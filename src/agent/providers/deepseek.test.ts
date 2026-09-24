import type OpenAI from "openai";
import { describe, expect, it, vi } from "vitest";
import { DeepSeekAgentProvider } from "./deepseek";
import type { InspectionAgentInput } from "@/agent/schemas";
import type { RankedClause } from "@/lib/knowledge/types";

const input: InspectionAgentInput = {
  building: {
    id: "building-1",
    code: "HB-A01",
    name: "示范木构院落 A-01",
    type: "heritage_building",
    era: "清代",
    summary: "脱敏演示建筑",
    riskTags: ["water"],
  },
  inspection: {
    id: "inspection-1",
    season: "秋季",
    weather: "暴雨后",
    summary: "正殿东侧排水沟积水，墙脚出现新湿痕。",
  },
  history: [],
};

const clause: RankedClause = {
  id: "rule_water_01",
  clauseCode: "DEMO-WATER-01",
  heading: "排水与渗漏巡查",
  text: "暴雨后检查排水沟和墙脚。",
  riskTags: ["water", "seepage"],
  buildingTypes: ["heritage_building"],
  isOfficialText: false,
  document: {
    id: "project-rules",
    code: "PROJECT-RULES-V1",
    title: "演示巡查规则",
    publisher: "项目组",
    sourceType: "PROJECT_RULE",
    sourceUrl: null,
    version: "1.0",
    effectiveDate: null,
  },
  score: 10,
  matchReasons: ["风险标签匹配"],
};

function fakeClient(content: string) {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content } }],
          usage: {
            prompt_tokens: 120,
            completion_tokens: 180,
          },
        }),
      },
    },
  } as unknown as OpenAI;
}

const validOutput = {
  plan: [
    {
      id: "plan-water",
      title: "检查排水",
      rationale: "暴雨后优先检查排水",
      requiredEvidence: ["照片"],
    },
  ],
  findings: [
    {
      key: "water",
      title: "排水与渗漏风险",
      description: "墙脚出现湿痕",
      riskType: "WATER",
      severity: "HIGH",
      confidence: 0.86,
      uncertainty: null,
      recommendedAction: "复核排水和墙脚状态",
      citations: [{ clauseId: "rule_water_01", relevance: "标签匹配" }],
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
};

function createProvider(client: OpenAI) {
  return new DeepSeekAgentProvider({
    apiKey: "test-key",
    baseURL: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
    timeoutMs: 30_000,
    client,
    retrieve: async () => [clause],
  });
}

describe("DeepSeekAgentProvider", () => {
  it("parses and validates a valid structured response", async () => {
    const provider = createProvider(fakeClient(JSON.stringify(validOutput)));

    const result = await provider.generateInspectionAnalysis(input);

    expect(result.metadata.provider).toBe("deepseek");
    expect(result.metadata.inputTokens).toBe(120);
    expect(result.output.findings[0]?.severity).toBe("HIGH");
    expect(result.degraded).toBe(false);
  });

  it("rejects citations that were not provided as candidates", async () => {
    const invalid = structuredClone(validOutput);
    invalid.findings[0]!.citations[0]!.clauseId = "invented-clause";
    const provider = createProvider(fakeClient(JSON.stringify(invalid)));

    await expect(provider.generateInspectionAnalysis(input)).rejects.toThrow(
      "引用了未提供的条款",
    );
  });
});
