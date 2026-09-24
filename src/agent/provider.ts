import { env } from "@/lib/env";
import { searchStandards } from "@/lib/knowledge/retrieval";
import { MockAgentProvider } from "./providers/mock";
import type { AgentProvider } from "./providers/types";

export function createAgentProvider(): AgentProvider {
  if (env.AGENT_PROVIDER === "mock") {
    return new MockAgentProvider(searchStandards);
  }

  return new MockAgentProvider(searchStandards);
}
