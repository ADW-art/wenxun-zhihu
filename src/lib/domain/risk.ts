import {
  FindingStatus,
  InspectionStatus,
  RiskSeverity,
  RiskType,
  TaskStatus,
} from "@prisma/client";

export const riskTypeLabels: Record<RiskType, string> = {
  FIRE: "火灾风险",
  ELECTRICAL: "电气风险",
  WATER: "水患与渗漏",
  STRUCTURE: "结构异常线索",
  VEGETATION: "植被与生物影响",
  HUMAN_ACTIVITY: "人为活动影响",
  MATERIAL_DETERIORATION: "材料劣化",
  TOURIST_PRESSURE: "游客承载压力",
  CONSTRUCTION_IMPACT: "施工影响",
  OTHER: "其他风险",
};

export const severityLabels: Record<RiskSeverity, string> = {
  LOW: "低风险",
  MEDIUM: "中风险",
  HIGH: "高风险",
  CRITICAL: "紧急风险",
};

export const severityTone: Record<RiskSeverity, { badge: string; dot: string }> = {
  LOW: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-600",
  },
  MEDIUM: {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-600",
  },
  HIGH: {
    badge: "border-orange-200 bg-orange-50 text-orange-800",
    dot: "bg-orange-600",
  },
  CRITICAL: {
    badge: "border-red-200 bg-red-50 text-red-800",
    dot: "bg-red-600",
  },
};

export const inspectionStatusLabels: Record<InspectionStatus, string> = {
  DRAFT: "草稿",
  SUBMITTED: "已提交",
  ANALYZING: "分析中",
  PENDING_REVIEW: "待人工复核",
  RECTIFYING: "整改中",
  PENDING_CLOSURE: "待关闭复核",
  CLOSED: "已归档",
  REJECTED: "已驳回",
};

export const findingStatusLabels: Record<FindingStatus, string> = {
  PROPOSED: "待确认",
  CONFIRMED: "已确认",
  REJECTED: "已排除",
  RESOLVED: "已消除",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  OPEN: "待处理",
  IN_PROGRESS: "处理中",
  PENDING_REVIEW: "待复核",
  CLOSED: "已关闭",
  REJECTED: "已驳回",
};

export function severityRank(severity: RiskSeverity) {
  return {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  }[severity];
}
