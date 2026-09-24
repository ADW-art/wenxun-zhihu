import {
  EvidenceKind,
  EvidenceSourceType,
  FindingStatus,
  InspectionStatus,
  RiskSeverity,
  RiskType,
  Role,
  TaskStatus,
} from "@prisma/client";
import { z } from "zod";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/services/audit";
import { runInspectionAnalysis } from "@/lib/services/agent-analysis";

export const createInspectionSchema = z.object({
  buildingId: z.string().min(1),
  season: z.string().trim().min(1).max(20),
  weather: z.string().trim().min(1).max(30),
  summary: z.string().trim().min(5).max(4000),
});

export async function createInspection(input: {
  actorId: string;
  buildingId: string;
  season: string;
  weather: string;
  summary: string;
  evidence?: Array<{
    kind: EvidenceKind;
    originalName: string;
    storageKey?: string;
    mimeType: string;
    sizeBytes: number;
    sourceType?: EvidenceSourceType;
    licenseNote?: string;
    exifStripped?: boolean;
  }>;
}) {
  const data = createInspectionSchema.parse(input);
  const building = await prisma.building.findUnique({
    where: { id: data.buildingId },
  });
  if (!building) throw new NotFoundError("文物建筑不存在");

  const inspection = await prisma.inspection.create({
    data: {
      buildingId: data.buildingId,
      inspectorId: input.actorId,
      status: InspectionStatus.DRAFT,
      season: data.season,
      weather: data.weather,
      summary: data.summary,
      evidence: input.evidence?.length
        ? {
            create: input.evidence.map((evidence) => ({
              kind: evidence.kind,
              originalName: evidence.originalName,
              storageKey: evidence.storageKey,
              mimeType: evidence.mimeType,
              sizeBytes: evidence.sizeBytes,
              sourceType: evidence.sourceType ?? "SELF_CAPTURED",
              licenseNote: evidence.licenseNote,
              exifStripped: evidence.exifStripped ?? false,
            })),
          }
        : undefined,
    },
  });

  await writeAuditLog({
    actorId: input.actorId,
    entityType: "Inspection",
    entityId: inspection.id,
    action: "CREATE_INSPECTION",
  });

  return inspection;
}

export async function submitInspection({
  inspectionId,
  actorId,
}: {
  inspectionId: string;
  actorId: string;
}) {
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
  });
  if (!inspection) throw new NotFoundError("巡查记录不存在");
  if (
    inspection.status !== InspectionStatus.DRAFT &&
    inspection.status !== InspectionStatus.SUBMITTED
  ) {
    throw new ConflictError("当前巡查状态不能提交分析");
  }

  await prisma.inspection.update({
    where: { id: inspectionId },
    data: {
      status: InspectionStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  return runInspectionAnalysis(inspectionId, actorId);
}

export async function confirmFinding({
  findingId,
  actorId,
  actorRole,
  comment,
}: {
  findingId: string;
  actorId: string;
  actorRole: Role;
  comment: string;
}) {
  if (actorRole !== Role.REVIEWER && actorRole !== Role.ADMIN) {
    throw new ForbiddenError("只有复核人员可以确认风险");
  }

  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: { inspection: true },
  });
  if (!finding) throw new NotFoundError("风险记录不存在");
  if (finding.status !== FindingStatus.PROPOSED) {
    throw new ConflictError("该风险已经处理");
  }

  await prisma.$transaction([
    prisma.finding.update({
      where: { id: findingId },
      data: {
        status: FindingStatus.CONFIRMED,
        confirmedById: actorId,
        confirmedAt: new Date(),
      },
    }),
    prisma.reviewRecord.create({
      data: {
        inspectionId: finding.inspectionId,
        findingId,
        actorId,
        action: "CONFIRM_FINDING",
        comment,
      },
    }),
    prisma.inspection.update({
      where: { id: finding.inspectionId },
      data: { status: InspectionStatus.RECTIFYING },
    }),
    prisma.auditLog.create({
      data: {
        actorId,
        entityType: "Finding",
        entityId: findingId,
        action: "CONFIRM_FINDING",
      },
    }),
  ]);
}

export async function createRectificationTask({
  findingId,
  actorId,
  actorRole,
  assigneeId,
  dueAt,
  title,
  description,
  acceptanceCriteria,
  priority,
}: {
  findingId: string;
  actorId: string;
  actorRole: Role;
  assigneeId: string;
  dueAt: Date;
  title: string;
  description: string;
  acceptanceCriteria: string;
  priority: RiskSeverity;
}) {
  if (actorRole !== Role.REVIEWER && actorRole !== Role.ADMIN) {
    throw new ForbiddenError("只有复核人员可以创建整改任务");
  }

  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: { inspection: true, tasks: true },
  });
  if (!finding) throw new NotFoundError("风险记录不存在");
  if (finding.status !== FindingStatus.CONFIRMED) {
    throw new ConflictError("风险确认后才能创建整改任务");
  }
  if (finding.tasks.some((task) => task.status !== TaskStatus.REJECTED)) {
    throw new ConflictError("该风险已经存在整改任务");
  }

  const assignee = await prisma.user.findFirst({
    where: {
      id: assigneeId,
      role: { in: [Role.RECTIFIER, Role.ADMIN] },
    },
  });
  if (!assignee) throw new NotFoundError("整改责任人不存在");

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.rectificationTask.create({
      data: {
        findingId,
        assigneeId,
        createdById: actorId,
        title,
        description,
        acceptanceCriteria,
        priority,
        dueAt,
      },
    });
    await tx.reviewRecord.create({
      data: {
        inspectionId: finding.inspectionId,
        findingId,
        taskId: created.id,
        actorId,
        action: "CREATE_TASK",
        comment: "创建整改任务",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        entityType: "RectificationTask",
        entityId: created.id,
        action: "CREATE_TASK",
      },
    });
    return created;
  });

  return task;
}

export async function submitTaskEvidence({
  taskId,
  actorId,
  actorRole,
  description,
  kind = "NOTE",
  file,
}: {
  taskId: string;
  actorId: string;
  actorRole: Role;
  description: string;
  kind?: "NOTE" | "PHOTO" | "DOCUMENT";
  file?: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey?: string;
    sourceType?:
      | "SELF_CAPTURED"
      | "CC0"
      | "CC_BY"
      | "PUBLIC_DOMAIN"
      | "AI_SYNTHETIC"
      | "PERMISSION_GRANTED"
      | "PROJECT_GENERATED"
      | "UNKNOWN";
  };
}) {
  const task = await prisma.rectificationTask.findUnique({
    where: { id: taskId },
  });
  if (!task) throw new NotFoundError("整改任务不存在");

  const isAssignee = task.assigneeId === actorId;
  if (!isAssignee && actorRole !== Role.ADMIN) {
    throw new ForbiddenError("只有任务责任人可以提交整改证据");
  }

  if (task.status === TaskStatus.PENDING_REVIEW || task.status === TaskStatus.CLOSED) {
    throw new ConflictError("当前任务状态不能重复提交");
  }

  const evidence = await prisma.$transaction(async (tx) => {
    const created = await tx.taskEvidence.create({
      data: {
        taskId,
        submittedById: actorId,
        kind,
        description,
        originalName: file?.originalName,
        mimeType: file?.mimeType ?? "text/plain",
        sizeBytes: file?.sizeBytes ?? 0,
        storageKey: file?.storageKey,
        sourceType: file?.sourceType ?? "SELF_CAPTURED",
      },
    });
    await tx.rectificationTask.update({
      where: { id: taskId },
      data: { status: TaskStatus.PENDING_REVIEW },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        entityType: "RectificationTask",
        entityId: taskId,
        action: "SUBMIT_EVIDENCE",
      },
    });
    return created;
  });

  return evidence;
}

export async function reviewTask({
  taskId,
  actorId,
  actorRole,
  decision,
  comment,
}: {
  taskId: string;
  actorId: string;
  actorRole: Role;
  decision: "APPROVE" | "REJECT";
  comment: string;
}) {
  if (actorRole !== Role.REVIEWER && actorRole !== Role.ADMIN) {
    throw new ForbiddenError("只有复核人员可以审核整改");
  }

  const task = await prisma.rectificationTask.findUnique({
    where: { id: taskId },
    include: {
      finding: { include: { inspection: true } },
      evidence: true,
    },
  });
  if (!task) throw new NotFoundError("整改任务不存在");
  if (task.status !== TaskStatus.PENDING_REVIEW) {
    throw new ConflictError("任务当前不在待复核状态");
  }
  if (decision === "APPROVE" && task.evidence.length === 0) {
    throw new ConflictError("没有整改证据，不能关闭任务");
  }

  await prisma.$transaction(async (tx) => {
    if (decision === "APPROVE") {
      await tx.rectificationTask.update({
        where: { id: taskId },
        data: { status: TaskStatus.CLOSED, completedAt: new Date() },
      });
      await tx.finding.update({
        where: { id: task.findingId },
        data: { status: FindingStatus.RESOLVED },
      });
      await tx.reviewRecord.create({
        data: {
          inspectionId: task.finding.inspectionId,
          findingId: task.findingId,
          taskId,
          actorId,
          action: "APPROVE_TASK",
          comment,
        },
      });

      const openTaskCount = await tx.rectificationTask.count({
        where: {
          finding: { inspectionId: task.finding.inspectionId },
          status: { not: TaskStatus.CLOSED },
        },
      });
      const proposedFindingCount = await tx.finding.count({
        where: {
          inspectionId: task.finding.inspectionId,
          status: FindingStatus.PROPOSED,
        },
      });
      if (openTaskCount === 0 && proposedFindingCount === 0) {
        await tx.inspection.update({
          where: { id: task.finding.inspectionId },
          data: {
            status: InspectionStatus.CLOSED,
            completedAt: new Date(),
          },
        });
      }
    } else {
      await tx.rectificationTask.update({
        where: { id: taskId },
        data: { status: TaskStatus.REJECTED },
      });
      await tx.reviewRecord.create({
        data: {
          inspectionId: task.finding.inspectionId,
          findingId: task.findingId,
          taskId,
          actorId,
          action: "REJECT_TASK",
          comment,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId,
        entityType: "RectificationTask",
        entityId: taskId,
        action: decision === "APPROVE" ? "APPROVE_TASK" : "REJECT_TASK",
        metadataJson: { comment },
      },
    });
  });
}

export async function getInspectionDetail(inspectionId: string) {
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    include: {
      building: true,
      inspector: {
        select: { id: true, name: true, email: true },
      },
      evidence: {
        orderBy: { createdAt: "desc" },
      },
      findings: {
        orderBy: [{ severity: "desc" }, { createdAt: "asc" }],
        include: {
          citations: {
            include: {
              clause: {
                include: {
                  document: true,
                },
              },
            },
          },
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true, email: true },
              },
              evidence: true,
              reviews: {
                include: {
                  actor: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      },
      agentRuns: {
        orderBy: { startedAt: "desc" },
        include: {
          modelCalls: true,
          toolCalls: true,
        },
      },
      reviews: {
        include: {
          actor: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!inspection) throw new NotFoundError("巡查记录不存在");
  return inspection;
}

export function isInspectionRiskType(value: string): value is RiskType {
  return Object.values(RiskType).includes(value as RiskType);
}
