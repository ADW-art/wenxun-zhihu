import {
  inspectionAgentInputSchema,
  inspectionAgentOutputSchema,
  type InspectionAgentInput,
  type InspectionAgentOutput,
} from "./schemas";
import { createAgentProvider } from "./provider";
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
  } catch {
    const fallback = await provider.generateInspectionAnalysis({
      ...input,
      inspection: {
        ...input.inspection,
        summary:
          input.inspection.summary ||
          "模型服务不可用，使用预置巡查分析结果，请人工补充证据。",
      },
    });

    return {
      ...fallback,
      output: inspectionAgentOutputSchema.parse(fallback.output),
      degraded: true,
    };
  }
}
