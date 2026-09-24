import { z } from "zod";

export const riskTypeSchema = z.enum([
  "FIRE",
  "ELECTRICAL",
  "WATER",
  "STRUCTURE",
  "VEGETATION",
  "HUMAN_ACTIVITY",
  "MATERIAL_DETERIORATION",
  "TOURIST_PRESSURE",
  "CONSTRUCTION_IMPACT",
  "OTHER",
]);

export const riskSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export type RiskType = z.infer<typeof riskTypeSchema>;
export type RiskSeverity = z.infer<typeof riskSeveritySchema>;

export const inspectionAgentInputSchema = z.object({
  building: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    type: z.string(),
    era: z.string(),
    summary: z.string(),
    riskTags: z.array(z.string()),
  }),
  inspection: z.object({
    id: z.string(),
    season: z.string(),
    weather: z.string(),
    summary: z.string().min(5),
  }),
  history: z.array(
    z.object({
      riskType: riskTypeSchema,
      severity: riskSeveritySchema,
      summary: z.string(),
      happenedAt: z.coerce.date(),
    }),
  ),
});

export const inspectionPlanItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  rationale: z.string(),
  requiredEvidence: z.array(z.string()),
});

export const agentCitationSchema = z.object({
  clauseId: z.string(),
  relevance: z.string(),
});

export const findingDraftSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string(),
  riskType: riskTypeSchema,
  severity: riskSeveritySchema,
  confidence: z.number().min(0).max(1),
  uncertainty: z.string().nullable(),
  recommendedAction: z.string(),
  citations: z.array(agentCitationSchema).min(1),
});

export const taskDraftSchema = z.object({
  findingKey: z.string(),
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.string(),
  priority: riskSeveritySchema,
  dueInDays: z.number().int().min(1).max(90),
});

export const inspectionAgentOutputSchema = z.object({
  plan: z.array(inspectionPlanItemSchema).min(1),
  findings: z.array(findingDraftSchema),
  uncertainties: z.array(z.string()),
  suggestedTasks: z.array(taskDraftSchema),
});

export type InspectionAgentInput = z.infer<typeof inspectionAgentInputSchema>;
export type InspectionAgentOutput = z.infer<typeof inspectionAgentOutputSchema>;
export type FindingDraft = z.infer<typeof findingDraftSchema>;
export type TaskDraft = z.infer<typeof taskDraftSchema>;
