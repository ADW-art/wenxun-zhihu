import { env } from "@/lib/env";
import { searchStandards } from "@/lib/knowledge/retrieval";
import { DeepSeekAgentProvider } from "./providers/deepseek";
import { MockAgentProvider } from "./providers/mock";
import type { AgentProvider } from "./providers/types";

export function createMockProvider() {
  return new MockAgentProvider(searchStandards);
}

export function createAgentProvider(): AgentProvider {
  if (env.AGENT_PROVIDER === "mock") {
    return createMockProvider();
  }

  if (env.AGENT_PROVIDER === "deepseek") {
    const apiKey = env.DEEPSEEK_API_KEY || env.AGENT_API_KEY;
    if (!apiKey) {
      console.warn("[agent] DEEPSEEK_API_KEY is not configured; using mock provider.");
      return createMockProvider();
    }

    return new DeepSeekAgentProvider({
      apiKey,
      baseURL: env.AGENT_BASE_URL,
      model: env.AGENT_MODEL,
      timeoutMs: env.AGENT_TIMEOUT_MS,
      retrieve: searchStandards,
    });
  }

  return createMockProvider();
}
