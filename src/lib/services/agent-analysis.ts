import {
  AgentRunStatus,
  CallStatus,
  FindingStatus,
  InspectionStatus,
} from "@prisma/client";
import { analyzeInspection } from "@/agent/orchestrator";
import { INSPECTION_PROMPT_VERSION } from "@/agent/prompts/inspection-v1";
import { TOOL_SCHEMA_VERSION } from "@/agent/tools";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function runInspectionAnalysis(inspectionId: string, actorId: string) {
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    include: {
      building: {
        include: {
          riskHistory: {
            orderBy: { happenedAt: "desc" },
            take: 8,
          },
        },
      },
      findings: true,
    },
  });

  if (!inspection) {
    throw new NotFoundError("巡查记录不存在");
  }

  const confirmedFinding = inspection.findings.find(
    (finding) => finding.status !== FindingStatus.PROPOSED,
  );
  if (confirmedFinding) {
    throw new ConflictError("巡查已经进入人工复核，不能覆盖现有风险结论");
  }

  const startedAt = new Date();
  const run = await prisma.agentRun.create({
    data: {
      inspectionId,
      status: AgentRunStatus.RUNNING,
      provider: process.env.AGENT_PROVIDER ?? "mock",
      model: process.env.AGENT_MODEL ?? "mock-conservation-agent",
      promptVersion: INSPECTION_PROMPT_VERSION,
      toolSchemaVersion: TOOL_SCHEMA_VERSION,
      inputJson: {
        inspectionId,
        summary: inspection.summary,
        buildingId: inspection.buildingId,
      },
      startedAt,
    },
  });

  try {
    await prisma.inspection.update({
      where: { id: inspectionId },
      data: { status: InspectionStatus.ANALYZING },
    });

    const result = await analyzeInspection({
      building: {
        id: inspection.building.id,
        code: inspection.building.code,
        name: inspection.building.name,
        type: inspection.building.type,
        era: inspection.building.era,
        summary: inspection.building.summary,
        riskTags: inspection.building.riskTags,
      },
      inspection: {
        id: inspection.id,
        season: inspection.season,
        weather: inspection.weather,
        summary: inspection.summary,
      },
      history: inspection.building.riskHistory.map((item) => ({
        riskType: item.riskType,
        severity: item.severity,
        summary: item.summary,
        happenedAt: item.happenedAt,
      })),
    });

    const clauseIds = Array.from(
      new Set(
        result.output.findings.flatMap((finding) =>
          finding.citations.map((citation) => citation.clauseId),
        ),
      ),
    );
    const existingClauses = await prisma.standardClause.findMany({
      where: { id: { in: clauseIds } },
      select: { id: true },
    });
    const existingClauseIds = new Set(existingClauses.map((clause) => clause.id));
    const invalidCitation = clauseIds.find((id) => !existingClauseIds.has(id));
    if (invalidCitation) {
      throw new ValidationError(`引用条款不存在：${invalidCitation}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.finding.deleteMany({
        where: {
          inspectionId,
          status: FindingStatus.PROPOSED,
        },
      });

      for (const finding of result.output.findings) {
        const findingId = `finding_${inspectionId}_${finding.key}`;
        await tx.finding.create({
          data: {
            id: findingId,
            inspectionId,
            title: finding.title,
            description: finding.description,
            riskType: finding.riskType,
            severity: finding.severity,
            status: FindingStatus.PROPOSED,
            confidence: finding.confidence,
            uncertainty: finding.uncertainty,
            recommendedAction: finding.recommendedAction,
            citations: {
              create: finding.citations.map((citation) => ({
                id: `citation_${findingId}_${citation.clauseId}`,
                clauseId: citation.clauseId,
                relevance: citation.relevance,
              })),
            },
          },
        });
      }

      await tx.inspection.update({
        where: { id: inspectionId },
        data: { status: InspectionStatus.PENDING_REVIEW },
      });

      await tx.agentRun.update({
        where: { id: run.id },
        data: {
          status: result.degraded ? AgentRunStatus.DEGRADED : AgentRunStatus.COMPLETED,
          outputJson: result.output,
          degraded: result.degraded,
          completedAt: new Date(),
        },
      });

      await tx.modelCall.create({
        data: {
          agentRunId: run.id,
          provider: result.metadata.provider,
          model: result.metadata.model,
          status: CallStatus.SUCCESS,
          latencyMs: result.metadata.latencyMs,
          inputTokens: result.metadata.inputTokens,
          outputTokens: result.metadata.outputTokens,
        },
      });

      for (const toolName of [
        "plan_inspection",
        "search_standards",
        "assess_findings",
      ]) {
        await tx.toolCall.create({
          data: {
            agentRunId: run.id,
            toolName,
            argumentsJson: { inspectionId },
            resultJson: { status: "ok" },
            status: CallStatus.SUCCESS,
            latencyMs: 0,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId,
          entityType: "Inspection",
          entityId: inspectionId,
          action: "ANALYZE_INSPECTION",
          metadataJson: {
            agentRunId: run.id,
            findingCount: result.output.findings.length,
            degraded: result.degraded,
          },
        },
      });
    });

    return { runId: run.id, result };
  } catch (error) {
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: AgentRunStatus.FAILED,
        errorCode: "AGENT_ANALYSIS_FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown analysis error",
        completedAt: new Date(),
      },
    });
    await prisma.inspection.update({
      where: { id: inspectionId },
      data: { status: InspectionStatus.SUBMITTED },
    });
    throw error;
  }
}
