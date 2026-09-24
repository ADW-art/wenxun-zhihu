import type { InspectionAgentInput, InspectionAgentOutput } from "@/agent/schemas";

export type ProviderMetadata = {
  provider: string;
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
};

export type AgentProviderResult = {
  output: InspectionAgentOutput;
  metadata: ProviderMetadata;
  degraded: boolean;
};

export interface AgentProvider {
  generateInspectionAnalysis(input: InspectionAgentInput): Promise<AgentProviderResult>;
}
