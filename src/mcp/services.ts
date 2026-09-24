import type { TaskStatus } from "@prisma/client";
import { analyzeInspection } from "@/agent/orchestrator";
import { prisma } from "@/lib/prisma";
import { searchStandards } from "@/lib/knowledge/retrieval";
export { getInspectionReport } from "@/lib/services/report-service";

function pagination(total: number, count: number, offset: number) {
  const hasMore = total > offset + count;
  return {
    total,
    count,
    offset,
    hasMore,
    nextOffset: hasMore ? offset + count : undefined,
  };
}

export async function listBuildings({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) {
  const [total, buildings] = await Promise.all([
    prisma.building.count({ where: { status: "ACTIVE" } }),
    prisma.building.findMany({
      where: { status: "ACTIVE" },
      orderBy: { code: "asc" },
      skip: offset,
      take: limit,
      include: {
        _count: {
          select: { inspections: true, riskHistory: true },
        },
      },
    }),
  ]);

  return {
    ...pagination(total, buildings.length, offset),
    buildings: buildings.map((building) => ({
      id: building.id,
      code: building.code,
      name: building.name,
      type: building.type,
      era: building.era,
      addressLabel: building.addressLabel,
      summary: building.summary,
      riskTags: building.riskTags,
      inspectionCount: building._count.inspections,
      historicalRiskCount: building._count.riskHistory,
    })),
  };
}

export async function getBuildingOverview({
  buildingId,
  code,
}: {
  buildingId?: string;
  code?: string;
}) {
  const building = await prisma.building.findFirst({
    where: buildingId ? { id: buildingId } : { code },
    include: {
      riskHistory: { orderBy: { happenedAt: "desc" }, take: 20 },
      inspections: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          _count: { select: { findings: true, evidence: true } },
        },
      },
    },
  });

  if (!building) return null;

  return {
    id: building.id,
    code: building.code,
    name: building.name,
    type: building.type,
    era: building.era,
    addressLabel: building.addressLabel,
    summary: building.summary,
    riskTags: building.riskTags,
    riskHistory: building.riskHistory.map((item) => ({
      id: item.id,
      riskType: item.riskType,
      severity: item.severity,
      summary: item.summary,
      happenedAt: item.happenedAt.toISOString(),
    })),
    inspections: building.inspections.map((inspection) => ({
      id: inspection.id,
      status: inspection.status,
      season: inspection.season,
      weather: inspection.weather,
      summary: inspection.summary,
      findingCount: inspection._count.findings,
      evidenceCount: inspection._count.evidence,
      createdAt: inspection.createdAt.toISOString(),
      updatedAt: inspection.updatedAt.toISOString(),
    })),
  };
}

export async function searchStandardClauses({
  query,
  riskTags,
  buildingType,
  limit,
}: {
  query: string;
  riskTags: string[];
  buildingType: string;
  limit: number;
}) {
  const clauses = await searchStandards({
    text: query,
    riskTags,
    buildingType,
    limit,
  });

  return clauses.map((clause) => ({
    id: clause.id,
    score: clause.score,
    matchReasons: clause.matchReasons,
    document: {
      code: clause.document.code,
      title: clause.document.title,
      publisher: clause.document.publisher,
      sourceType: clause.document.sourceType,
      sourceUrl: clause.document.sourceUrl,
      version: clause.document.version,
      effectiveDate: clause.document.effectiveDate?.toISOString() ?? null,
    },
    clauseCode: clause.clauseCode,
    heading: clause.heading,
    text: clause.text,
    riskTags: clause.riskTags,
    buildingTypes: clause.buildingTypes,
    isOfficialText: clause.isOfficialText,
  }));
}

export async function listRectificationTasks({
  status,
  assigneeEmail,
  limit,
  offset,
}: {
  status?: TaskStatus;
  assigneeEmail?: string;
  limit: number;
  offset: number;
}) {
  const where = {
    ...(status ? { status } : {}),
    ...(assigneeEmail ? { assignee: { email: assigneeEmail.toLowerCase() } } : {}),
  };

  const [total, tasks] = await Promise.all([
    prisma.rectificationTask.count({ where }),
    prisma.rectificationTask.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
      include: {
        assignee: { select: { name: true, email: true } },
        finding: {
          include: {
            inspection: {
              include: {
                building: {
                  select: { id: true, code: true, name: true },
                },
              },
            },
          },
        },
        _count: { select: { evidence: true } },
      },
    }),
  ]);

  return {
    ...pagination(total, tasks.length, offset),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      acceptanceCriteria: task.acceptanceCriteria,
      status: task.status,
      priority: task.priority,
      dueAt: task.dueAt.toISOString(),
      assignee: task.assignee,
      building: task.finding.inspection.building,
      finding: {
        id: task.finding.id,
        title: task.finding.title,
        severity: task.finding.severity,
      },
      evidenceCount: task._count.evidence,
    })),
  };
}

export async function analyzeInspectionPreview({
  buildingId,
  season,
  weather,
  summary,
}: {
  buildingId: string;
  season: string;
  weather: string;
  summary: string;
}) {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    include: {
      riskHistory: {
        orderBy: { happenedAt: "desc" },
        take: 8,
      },
    },
  });

  if (!building) return null;

  const result = await analyzeInspection({
    building: {
      id: building.id,
      code: building.code,
      name: building.name,
      type: building.type,
      era: building.era,
      summary: building.summary,
      riskTags: building.riskTags,
    },
    inspection: {
      id: `mcp_preview_${Date.now()}`,
      season,
      weather,
      summary,
    },
    history: building.riskHistory.map((item) => ({
      riskType: item.riskType,
      severity: item.severity,
      summary: item.summary,
      happenedAt: item.happenedAt,
    })),
  });

  return {
    building: {
      id: building.id,
      code: building.code,
      name: building.name,
    },
    ...result,
  };
}
