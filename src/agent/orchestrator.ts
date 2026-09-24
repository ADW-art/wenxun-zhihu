import {
  inspectionAgentInputSchema,
  inspectionAgentOutputSchema,
  type InspectionAgentInput,
  type InspectionAgentOutput,
} from "./schemas";
import { createAgentProvider, createMockProvider } from "./provider";
import type { ProviderMetadata } from "./providers/types";

export type AnalysisResult = {
  output: InspectionAgentOutput;
  metadata: ProviderMetadata;
  degraded: boolean;
};

export async function analyzeInspection(
  rawInput: InspectionAgentInput,
): Promise<AnalysisResult> {
  const input = inspectionAgentInputSchema.parse(rawInput);
  const provider = createAgentProvider();
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await provider.generateInspectionAnalysis(input);
      return {
        ...result,
        output: inspectionAgentOutputSchema.parse(result.output),
      };
    } catch (error) {
      lastError = error;
    }
  }

  console.error("[agent] Provider failed twice, falling back to mock.", lastError);
  const fallback = await createMockProvider().generateInspectionAnalysis(input);

  return {
    ...fallback,
    output: inspectionAgentOutputSchema.parse(fallback.output),
    degraded: true,
  };
}
