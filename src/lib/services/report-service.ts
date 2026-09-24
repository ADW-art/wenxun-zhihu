import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function getInspectionReport(inspectionId: string) {
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    include: {
      building: true,
      inspector: { select: { name: true, email: true } },
      findings: {
        orderBy: { severity: "desc" },
        include: {
          citations: {
            include: {
              clause: { include: { document: true } },
            },
          },
          tasks: {
            include: {
              assignee: { select: { name: true, email: true } },
              evidence: {
                include: {
                  submittedBy: { select: { name: true, email: true } },
                },
                orderBy: { createdAt: "asc" },
              },
              reviews: {
                include: {
                  actor: { select: { name: true, email: true } },
                },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      },
      reviews: {
        include: {
          actor: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!inspection) return null;

  return {
    generatedAt: new Date().toISOString(),
    inspection: {
      id: inspection.id,
      status: inspection.status,
      season: inspection.season,
      weather: inspection.weather,
      summary: inspection.summary,
      createdAt: inspection.createdAt.toISOString(),
      submittedAt: inspection.submittedAt?.toISOString() ?? null,
      completedAt: inspection.completedAt?.toISOString() ?? null,
    },
    building: {
      id: inspection.building.id,
      code: inspection.building.code,
      name: inspection.building.name,
      type: inspection.building.type,
      era: inspection.building.era,
      addressLabel: inspection.building.addressLabel,
    },
    findings: inspection.findings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      description: finding.description,
      riskType: finding.riskType,
      severity: finding.severity,
      status: finding.status,
      confidence: finding.confidence,
      uncertainty: finding.uncertainty,
      recommendedAction: finding.recommendedAction,
      citations: finding.citations.map((citation) => ({
        documentCode: citation.clause.document.code,
        documentTitle: citation.clause.document.title,
        clauseCode: citation.clause.clauseCode,
        heading: citation.clause.heading,
        text: citation.clause.text,
        sourceUrl: citation.clause.document.sourceUrl,
      })),
      tasks: finding.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        acceptanceCriteria: task.acceptanceCriteria,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt.toISOString(),
        assignee: task.assignee,
        evidence: task.evidence.map((evidence) => ({
          id: evidence.id,
          kind: evidence.kind,
          description: evidence.description,
          submittedBy: evidence.submittedBy,
          createdAt: evidence.createdAt.toISOString(),
        })),
        reviews: task.reviews.map((review) => ({
          id: review.id,
          action: review.action,
          comment: review.comment,
          actor: review.actor,
          createdAt: review.createdAt.toISOString(),
        })),
      })),
    })),
    reviews: inspection.reviews.map((review) => ({
      id: review.id,
      action: review.action,
      comment: review.comment,
      actor: review.actor,
      createdAt: review.createdAt.toISOString(),
    })),
  };
}

export async function buildInspectionMarkdown(inspectionId: string) {
  const report = await getInspectionReport(inspectionId);
  if (!report) throw new NotFoundError("巡查记录不存在");

  const lines = [
    `# ${report.building.name}巡查报告`,
    "",
    `- 建筑编号：${report.building.code}`,
    `- 建筑年代：${report.building.era}`,
    `- 建筑类型：${report.building.type}`,
    `- 地区：${report.building.addressLabel}`,
    `- 巡查状态：${report.inspection.status}`,
    `- 季节与环境：${report.inspection.season}，${report.inspection.weather}`,
    `- 生成时间：${report.generatedAt}`,
    "",
    "## 现场观察",
    "",
    report.inspection.summary,
    "",
    "## 风险与整改",
    "",
  ];

  if (report.findings.length === 0) {
    lines.push("未记录风险。", "");
  }

  for (const [index, finding] of report.findings.entries()) {
    lines.push(
      `### ${index + 1}. ${finding.title}`,
      "",
      `- 风险类型：${finding.riskType}`,
      `- 风险等级：${finding.severity}`,
      `- 状态：${finding.status}`,
      `- 智能体置信度：${finding.confidence ?? "未提供"}`,
      "",
      finding.description,
      "",
      `建议处置：${finding.recommendedAction}`,
      "",
    );

    if (finding.uncertainty) {
      lines.push(`不确定项：${finding.uncertainty}`, "");
    }

    lines.push("规范与规则依据：", "");
    for (const citation of finding.citations) {
      lines.push(
        `- ${citation.documentCode} ${citation.clauseCode} ${citation.heading}`,
        `  - ${citation.text}`,
        citation.sourceUrl
          ? `  - 来源：${citation.sourceUrl}`
          : "  - 来源：项目演示规则",
      );
    }

    if (finding.tasks.length > 0) {
      lines.push("", "整改任务：", "");
      for (const task of finding.tasks) {
        lines.push(
          `- ${task.title}`,
          `  - 状态：${task.status}`,
          `  - 责任人：${task.assignee.name}`,
          `  - 期限：${task.dueAt}`,
          `  - 验收标准：${task.acceptanceCriteria}`,
          `  - 证据数量：${task.evidence.length}`,
        );
      }
    }

    lines.push("");
  }

  lines.push("## 人工复核记录", "");
  if (report.reviews.length === 0) {
    lines.push("暂无人工复核记录。");
  } else {
    for (const review of report.reviews) {
      lines.push(
        `- ${review.createdAt} ${review.actor.name} ${review.action}：${review.comment}`,
      );
    }
  }

  lines.push(
    "",
    "---",
    "",
    "本报告由文巡智护生成。智能体结果仅作为辅助信息，最终结论以专业人员复核为准。",
  );

  return {
    fileName: `${report.building.code}-巡查报告.md`,
    markdown: lines.join("\n"),
  };
}
