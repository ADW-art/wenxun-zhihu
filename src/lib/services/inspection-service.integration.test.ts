import { afterAll, describe, expect, it } from "vitest";
import { Role, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  confirmFinding,
  createInspection,
  createRectificationTask,
  reviewTask,
  submitInspection,
  submitTaskEvidence,
} from "./inspection-service";
import { buildInspectionMarkdown } from "./report-service";

const enabled = process.env.RUN_INTEGRATION_TESTS === "1";
let createdInspectionId = "";

describe.skipIf(!enabled)("inspection service integration", () => {
  afterAll(async () => {
    if (createdInspectionId) {
      await prisma.inspection.deleteMany({
        where: { id: createdInspectionId },
      });
    }
  });

  it("runs one inspection through analysis, rectification and closure", async () => {
    const [inspector, reviewer, rectifier, building] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { email: "inspector@example.com" },
      }),
      prisma.user.findUniqueOrThrow({
        where: { email: "reviewer@example.com" },
      }),
      prisma.user.findUniqueOrThrow({
        where: { email: "rectifier@example.com" },
      }),
      prisma.building.findUniqueOrThrow({ where: { code: "HB-A01" } }),
    ]);

    const inspection = await createInspection({
      actorId: inspector.id,
      buildingId: building.id,
      season: "秋季",
      weather: "暴雨后",
      summary: "东侧排水沟积水，墙脚出现新湿痕，需要复核排水状态。",
      evidence: [
        {
          kind: "NOTE",
          originalName: "现场记录.txt",
          mimeType: "text/plain",
          sizeBytes: 24,
          sourceType: "SELF_CAPTURED",
          exifStripped: false,
        },
      ],
    });
    createdInspectionId = inspection.id;

    await submitInspection({
      inspectionId: inspection.id,
      actorId: inspector.id,
    });

    const analyzed = await prisma.inspection.findUniqueOrThrow({
      where: { id: inspection.id },
      include: { findings: true, evidence: true },
    });
    expect(analyzed.status).toBe("PENDING_REVIEW");
    expect(analyzed.findings.length).toBeGreaterThan(0);
    expect(analyzed.evidence).toHaveLength(1);

    const finding = analyzed.findings[0]!;
    await confirmFinding({
      findingId: finding.id,
      actorId: reviewer.id,
      actorRole: Role.REVIEWER,
      comment: "现场记录与风险类型一致，确认进入整改。",
    });

    const task = await createRectificationTask({
      findingId: finding.id,
      actorId: reviewer.id,
      actorRole: Role.REVIEWER,
      assigneeId: rectifier.id,
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      title: "清理排水并复核墙脚",
      description: "清理排水沟，完成墙脚复查并提交前后证据。",
      acceptanceCriteria: "提交整改说明和整改后证据。",
      priority: finding.severity,
    });

    await submitTaskEvidence({
      taskId: task.id,
      actorId: rectifier.id,
      actorRole: Role.RECTIFIER,
      description: "已清理排水沟，墙脚干燥，提交复查记录。",
      kind: "NOTE",
      file: {
        originalName: "整改记录.txt",
        mimeType: "text/plain",
        sizeBytes: 24,
        sourceType: "SELF_CAPTURED",
      },
    });

    await reviewTask({
      taskId: task.id,
      actorId: reviewer.id,
      actorRole: Role.REVIEWER,
      decision: "APPROVE",
      comment: "整改证据完整，风险已受控。",
    });

    const closed = await prisma.inspection.findUniqueOrThrow({
      where: { id: inspection.id },
      include: {
        findings: true,
        agentRuns: true,
      },
    });
    expect(closed.status).toBe("CLOSED");
    expect(closed.findings[0]?.status).toBe("RESOLVED");
    expect(closed.agentRuns[0]?.status).toBe("DEGRADED");

    const closedTask = await prisma.rectificationTask.findUniqueOrThrow({
      where: { id: task.id },
      include: { evidence: true },
    });
    expect(closedTask.status).toBe(TaskStatus.CLOSED);
    expect(closedTask.evidence[0]?.originalName).toBe("整改记录.txt");

    const report = await buildInspectionMarkdown(inspection.id);
    expect(report.markdown).toContain("HB-A01");
    expect(report.markdown).toContain("整改任务");
  });
});
