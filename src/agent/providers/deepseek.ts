import OpenAI from "openai";
import {
  inspectionAgentOutputSchema,
  type InspectionAgentInput,
} from "@/agent/schemas";
import { INSPECTION_SYSTEM_POLICY } from "@/agent/prompts/inspection-v1";
import type { AgentProvider, AgentProviderResult } from "@/agent/providers/types";
import type { RankedClause } from "@/lib/knowledge/types";

type DeepSeekProviderOptions = {
  apiKey: string;
  baseURL: string;
  model: string;
  timeoutMs: number;
  retrieve: (args: {
    text: string;
    riskTags: string[];
    buildingType: string;
    limit?: number;
  }) => Promise<RankedClause[]>;
  client?: OpenAI;
};

function inferRiskTags(input: InspectionAgentInput) {
  const text = `${input.inspection.weather} ${input.inspection.summary}`;
  const tags = new Set(input.building.riskTags);

  if (/积水|渗漏|湿痕|返潮|排水|暴雨|漏水|屋面/.test(text)) {
    tags.add("water");
    tags.add("seepage");
    tags.add("heavy_rain");
  }
  if (/电线|电器|短路|配电|插座/.test(text)) {
    tags.add("electrical");
    tags.add("electrical_fire");
  }
  if (/明火|烟|灭火器|消防/.test(text)) {
    tags.add("fire");
    tags.add("risk_assessment");
  }
  if (/裂缝|倾斜|沉降|变形|脱榫|结构/.test(text)) {
    tags.add("structure");
    tags.add("crack");
  }
  if (/草|树|根|苔藓|虫|动物|植被/.test(text)) {
    tags.add("vegetation");
    tags.add("pest");
  }
  if (/施工|车辆|振动|游客|人为|改动|用火/.test(text)) {
    tags.add("human_activity");
    tags.add("construction");
    tags.add("visitor");
  }

  return Array.from(tags);
}

function schemaInstructions() {
  return `
请只输出一个 JSON 对象，不要输出 Markdown 代码块或解释文字。
JSON 必须满足以下结构：
{
  "plan": [
    {
      "id": "string",
      "title": "string",
      "rationale": "string",
      "requiredEvidence": ["string"]
    }
  ],
  "findings": [
    {
      "key": "string",
      "title": "string",
      "description": "string",
      "riskType": "FIRE|ELECTRICAL|WATER|STRUCTURE|VEGETATION|HUMAN_ACTIVITY|MATERIAL_DETERIORATION|TOURIST_PRESSURE|CONSTRUCTION_IMPACT|OTHER",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "confidence": 0.0,
      "uncertainty": "string|null",
      "recommendedAction": "string",
      "citations": [
        {
          "clauseId": "必须来自 candidateClauses.id",
          "relevance": "string"
        }
      ]
    }
  ],
  "uncertainties": ["string"],
  "suggestedTasks": [
    {
      "findingKey": "string",
      "title": "string",
      "description": "string",
      "acceptanceCriteria": "string",
      "priority": "LOW|MEDIUM|HIGH|CRITICAL",
      "dueInDays": 1
    }
  ]
}

规则：
1. 每个 finding 至少包含一个 citations。
2. citations.clauseId 只能使用 candidateClauses 中出现的 id。
3. 没有可靠依据时不要编造条款，应减少 findings 并写入 uncertainties。
4. 不得作出结构安全鉴定，不得批准修复方案。
`.trim();
}

function responseText(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }
        return "";
      })
      .join("");
  }
  return "";
}

export class DeepSeekAgentProvider implements AgentProvider {
  private readonly client: OpenAI;

  constructor(private readonly options: DeepSeekProviderOptions) {
    this.client =
      options.client ??
      new OpenAI({
        apiKey: options.apiKey,
        baseURL: options.baseURL,
        timeout: options.timeoutMs,
      });
  }

  async generateInspectionAnalysis(
    input: InspectionAgentInput,
  ): Promise<AgentProviderResult> {
    const startedAt = performance.now();
    const candidates = await this.options.retrieve({
      text: `${input.inspection.weather} ${input.inspection.summary}`,
      riskTags: inferRiskTags(input),
      buildingType: input.building.type,
      limit: 12,
    });
    const allowedClauseIds = new Set(candidates.map((clause) => clause.id));

    const completion = await this.client.chat.completions.create({
      model: this.options.model,
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${INSPECTION_SYSTEM_POLICY}\n\n${schemaInstructions()}`,
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              building: input.building,
              inspection: input.inspection,
              history: input.history,
              candidateClauses: candidates.map((clause) => ({
                id: clause.id,
                documentCode: clause.document.code,
                documentTitle: clause.document.title,
                clauseCode: clause.clauseCode,
                heading: clause.heading,
                text: clause.text,
                isOfficialText: clause.isOfficialText,
                sourceUrl: clause.document.sourceUrl,
              })),
            },
            null,
            2,
          ),
        },
      ],
    });

    const content = responseText(completion.choices[0]?.message?.content);
    if (!content) {
      throw new Error("DeepSeek 返回了空内容");
    }

    const output = inspectionAgentOutputSchema.parse(JSON.parse(content));
    for (const finding of output.findings) {
      for (const citation of finding.citations) {
        if (!allowedClauseIds.has(citation.clauseId)) {
          throw new Error(`DeepSeek 引用了未提供的条款：${citation.clauseId}`);
        }
      }
    }

    return {
      output,
      metadata: {
        provider: "deepseek",
        model: this.options.model,
        latencyMs: Math.round(performance.now() - startedAt),
        inputTokens: completion.usage?.prompt_tokens,
        outputTokens: completion.usage?.completion_tokens,
      },
      degraded: false,
    };
  }
}
