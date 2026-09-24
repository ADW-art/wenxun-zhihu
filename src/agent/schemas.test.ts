import { describe, expect, it } from "vitest";
import { inspectionAgentInputSchema, inspectionAgentOutputSchema } from "./schemas";

describe("inspection agent schemas", () => {
  it("accepts a valid structured output", () => {
    const result = inspectionAgentOutputSchema.safeParse({
      plan: [
        {
          id: "plan-1",
          title: "检查排水",
          rationale: "暴雨后优先检查排水",
          requiredEvidence: ["照片"],
        },
      ],
      findings: [
        {
          key: "water",
          title: "渗漏风险",
          description: "墙脚出现湿痕",
          riskType: "WATER",
          severity: "HIGH",
          confidence: 0.86,
          uncertainty: null,
          recommendedAction: "复核排水和墙脚状态",
          citations: [
            {
              clauseId: "rule_water_01",
              relevance: "风险标签和现场描述匹配",
            },
          ],
        },
      ],
      uncertainties: [],
      suggestedTasks: [
        {
          findingKey: "water",
          title: "处理渗漏",
          description: "清理排水并复查墙脚",
          acceptanceCriteria: "提交前后对比照片",
          priority: "HIGH",
          dueInDays: 3,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects findings without citations", () => {
    const result = inspectionAgentOutputSchema.safeParse({
      plan: [],
      findings: [
        {
          key: "fire",
          title: "火灾风险",
          description: "存在明火",
          riskType: "FIRE",
          severity: "HIGH",
          confidence: 0.8,
          uncertainty: null,
          recommendedAction: "专业复核",
          citations: [],
        },
      ],
      uncertainties: [],
      suggestedTasks: [],
    });

    expect(result.success).toBe(false);
  });

  it("requires a meaningful inspection summary", () => {
    const result = inspectionAgentInputSchema.safeParse({
      building: {
        id: "building-1",
        code: "A-01",
        name: "示范建筑",
        type: "heritage_building",
        era: "清代",
        summary: "脱敏建筑",
        riskTags: ["water"],
      },
      inspection: {
        id: "inspection-1",
        season: "秋季",
        weather: "暴雨后",
        summary: "积水",
      },
      history: [],
    });

    expect(result.success).toBe(false);
  });
});
