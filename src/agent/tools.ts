export const TOOL_SCHEMA_VERSION = "tools.v1";

export const agentTools = [
  "plan_inspection",
  "search_standards",
  "assess_findings",
  "create_rectification_task",
  "review_task_evidence",
  "generate_inspection_report",
] as const;

export type AgentTool = (typeof agentTools)[number];
