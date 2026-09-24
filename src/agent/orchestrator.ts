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

  try {
    const result = await provider.generateInspectionAnalysis(input);
    return {
      ...result,
      output: inspectionAgentOutputSchema.parse(result.output),
    };
  } catch (error) {
    console.error("[agent] Provider failed, falling back to mock.", error);
    const fallback = await createMockProvider().generateInspectionAnalysis({
      ...input,
      inspection: {
        ...input.inspection,
        summary: input.inspection.summary,
      },
    });

    return {
      ...fallback,
      output: inspectionAgentOutputSchema.parse(fallback.output),
      degraded: true,
    };
  }
}
