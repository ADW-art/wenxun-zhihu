import type { AgentProvider, AgentProviderResult } from "@/agent/providers/types";
import type {
  InspectionAgentInput,
  InspectionAgentOutput,
  RiskSeverity,
  RiskType,
} from "@/agent/schemas";
import type { RankedClause } from "@/lib/knowledge/types";

type RiskSignal = {
  riskType: RiskType;
  severity: RiskSeverity;
  tags: string[];
  title: string;
  description: string;
  action: string;
  evidence: string[];
};

function detectSignals(text: string): RiskSignal[] {
  const signals: RiskSignal[] = [];
  const normalized = text.toLowerCase();

  if (/积水|渗漏|湿痕|返潮|排水|暴雨|漏水|屋面/.test(normalized)) {
    signals.push({
      riskType: "WATER",
      severity: /积水|渗漏|暴雨/.test(normalized) ? "HIGH" : "MEDIUM",
      tags: ["water", "seepage", "heavy_rain"],
      title: "排水与渗漏风险",
      description: "巡查记录包含积水、湿痕、返潮或排水相关线索。",
      action: "复核排水路径、墙脚和地下空间，清理堵塞并记录复查结果。",
      evidence: ["风险位置", "积水和湿痕照片", "排水清理前后对比"],
    });
  }

  if (/电线|电器|短路|配电|插座|明火|烟|灭火器|消防/.test(normalized)) {
    const electrical = /电线|电器|短路|配电|插座/.test(normalized);
    signals.push({
      riskType: electrical ? "ELECTRICAL" : "FIRE",
      severity: "HIGH",
      tags: electrical
        ? ["electrical_fire", "electrical"]
        : ["fire", "risk_assessment"],
      title: electrical ? "电气火灾风险" : "消防安全风险",
      description: "巡查记录包含用电、明火或消防设施相关线索。",
      action: "由具备资质的人员复核用电和消防条件，禁止仅凭模型结论处置。",
      evidence: ["设备与线路照片", "现场检查记录", "专业复核意见"],
    });
  }

  if (/裂缝|倾斜|沉降|变形|脱榫|结构/.test(normalized)) {
    signals.push({
      riskType: "STRUCTURE",
      severity: "HIGH",
      tags: ["structure", "crack", "deformation"],
      title: "结构异常观察线索",
      description: "记录中出现裂缝、倾斜、沉降或变形等观察线索。",
      action: "立即保护现场并提交结构专业人员复核，系统不得作出结构安全结论。",
      evidence: ["整体和局部照片", "变化时间", "尺寸或位移记录", "专业复核意见"],
    });
  }

  if (/草|树|根|苔藓|虫|动物|植被/.test(normalized)) {
    signals.push({
      riskType: "VEGETATION",
      severity: "MEDIUM",
      tags: ["vegetation", "pest", "drainage"],
      title: "植被与生物影响",
      description: "记录中出现植物根系、苔藓、虫害或动物活动线索。",
      action: "评估根系、排水和构件受影响范围，采用最小干预方式处理。",
      evidence: ["影响范围照片", "与排水或构件关系说明", "处置前后记录"],
    });
  }

  if (/施工|车辆|振动|游客|人为|改动|用火/.test(normalized)) {
    signals.push({
      riskType: "HUMAN_ACTIVITY",
      severity: /施工|用火/.test(normalized) ? "HIGH" : "MEDIUM",
      tags: ["human_activity", "construction", "visitor"],
      title: "人为活动影响",
      description: "记录中出现施工、车辆、游客或未经批准改动等影响线索。",
      action: "核实活动审批和影响范围，必要时暂停可能扩大损害的行为。",
      evidence: ["活动位置与时间", "现场照片", "审批或处置记录"],
    });
  }

  if (signals.length === 0) {
    signals.push({
      riskType: "OTHER",
      severity: "LOW",
      tags: ["inspection", "record"],
      title: "补充巡查信息",
      description: "当前文字未匹配到明确风险类别，需要补充现场证据。",
      action: "补充照片、位置、持续时间和可观察变化后重新分析。",
      evidence: ["补充照片", "现场位置", "变化时间"],
    });
  }

  return signals;
}

function confidenceForSignal(signal: RiskSignal) {
  if (signal.riskType === "STRUCTURE") return 0.72;
  if (signal.severity === "HIGH") return 0.86;
  if (signal.severity === "MEDIUM") return 0.78;
  return 0.6;
}

export class MockAgentProvider implements AgentProvider {
  constructor(
    private readonly retrieve: (args: {
      text: string;
      riskTags: string[];
      buildingType: string;
      limit?: number;
    }) => Promise<RankedClause[]>,
  ) {}

  async generateInspectionAnalysis(
    input: InspectionAgentInput,
  ): Promise<AgentProviderResult> {
    const startedAt = performance.now();
    const signals = detectSignals(input.inspection.summary);
    const clauses = await this.retrieve({
      text: input.inspection.summary,
      riskTags: input.building.riskTags,
      buildingType: input.building.type,
      limit: 8,
    });

    const findings = [];
    const suggestedTasks = [];

    for (const signal of signals) {
      const candidates = await this.retrieve({
        text: input.inspection.summary,
        riskTags: signal.tags,
        buildingType: input.building.type,
        limit: 2,
      });
      const citations = (candidates.length > 0 ? candidates : clauses)
        .slice(0, 1)
        .map((clause) => ({
          clauseId: clause.id,
          relevance: clause.matchReasons.join("；") || "用于支撑风险识别和处置建议",
        }));

      if (citations.length === 0) {
        continue;
      }

      const key = signal.riskType.toLowerCase();
      findings.push({
        key,
        title: signal.title,
        description: signal.description,
        riskType: signal.riskType,
        severity: signal.severity,
        confidence: confidenceForSignal(signal),
        uncertainty:
          signal.riskType === "STRUCTURE"
            ? "该结论只表示存在需要专业复核的观察线索，不代表结构安全判定。"
            : null,
        recommendedAction: signal.action,
        citations,
      });

      suggestedTasks.push({
        findingKey: key,
        title: signal.title,
        description: signal.action,
        acceptanceCriteria: `提交${signal.evidence.join("、")}，并说明原风险是否已消除。`,
        priority: signal.severity,
        dueInDays:
          signal.severity === "CRITICAL" ? 1 : signal.severity === "HIGH" ? 3 : 7,
      });
    }

    const output: InspectionAgentOutput = {
      plan: [
        {
          id: "plan-site-boundary",
          title: "巡查范围与环境确认",
          rationale: `${input.building.name}当前季节为${input.inspection.season}，天气条件为${input.inspection.weather}。`,
          requiredEvidence: ["巡查时间", "天气与排水状况", "建筑整体照片"],
        },
        {
          id: "plan-risk-focus",
          title: "历史与重点风险复查",
          rationale:
            input.history.length > 0
              ? "建筑存在历史风险记录，需要优先复查。"
              : "没有历史风险记录，按建筑类型和现场线索检查。",
          requiredEvidence: ["历史问题位置", "当前变化照片", "补充说明"],
        },
        {
          id: "plan-evidence",
          title: "证据完整性检查",
          rationale: "每条风险必须有位置、范围、时间或照片支撑。",
          requiredEvidence: ["现场照片", "位置说明", "风险范围"],
        },
      ],
      findings,
      uncertainties:
        findings.length > 0
          ? findings
              .filter((finding) => finding.uncertainty)
              .map((finding) => finding.uncertainty as string)
          : ["当前记录不足以形成可靠风险判断，请补充证据。"],
      suggestedTasks,
    };

    const validated = output;
    return {
      output: validated,
      metadata: {
        provider: "mock",
        model: "mock-conservation-agent",
        latencyMs: Math.round(performance.now() - startedAt),
        inputTokens: Math.ceil(input.inspection.summary.length / 2),
        outputTokens: Math.ceil(JSON.stringify(validated).length / 2),
      },
      degraded: true,
    };
  }
}
