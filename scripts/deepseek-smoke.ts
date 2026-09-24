import "dotenv/config";
import { analyzeInspection } from "@/agent/orchestrator";
import { prisma } from "@/lib/prisma";

async function main() {
  if (!process.env.DEEPSEEK_API_KEY && !process.env.AGENT_API_KEY) {
    throw new Error(
      "DEEPSEEK_API_KEY is not configured. Fill it in the local .env file and retry.",
    );
  }

  const building = await prisma.building.findFirstOrThrow({
    where: { status: "ACTIVE" },
    orderBy: { code: "asc" },
    include: {
      riskHistory: {
        orderBy: { happenedAt: "desc" },
        take: 5,
      },
    },
  });

  const result = await analyzeInspection({
    building: {
      id: building.id,
      code: building.code,
      name: building.name,
      type: building.type,
      era: building.era,
      summary: building.summary,
      riskTags: building.riskTags,
    },
    inspection: {
      id: `deepseek_smoke_${Date.now()}`,
      season: "秋季",
      weather: "暴雨后",
      summary: "正殿东侧排水沟积水，墙脚出现新湿痕，周边有杂草根系侵入。",
    },
    history: building.riskHistory.map((item) => ({
      riskType: item.riskType,
      severity: item.severity,
      summary: item.summary,
      happenedAt: item.happenedAt,
    })),
  });

  console.log(
    JSON.stringify(
      {
        provider: result.metadata.provider,
        model: result.metadata.model,
        degraded: result.degraded,
        latencyMs: result.metadata.latencyMs,
        inputTokens: result.metadata.inputTokens,
        outputTokens: result.metadata.outputTokens,
        findingCount: result.output.findings.length,
        taskCount: result.output.suggestedTasks.length,
      },
      null,
      2,
    ),
  );

  if (result.metadata.provider !== "deepseek" || result.degraded) {
    throw new Error("DeepSeek smoke test fell back to Mock Provider.");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
