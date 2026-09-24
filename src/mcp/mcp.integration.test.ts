import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const enabled = process.env.RUN_INTEGRATION_TESTS === "1";
let client: Client | undefined;

describe.skipIf(!enabled)("wenxun MCP server", () => {
  beforeAll(async () => {
    client = new Client(
      { name: "wenxun-mcp-integration-test", version: "1.0.0" },
      { capabilities: {} },
    );
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [
        path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
        path.join(process.cwd(), "src", "mcp", "index.ts"),
      ],
      cwd: process.cwd(),
      stderr: "pipe",
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL!,
        AUTH_SECRET: process.env.AUTH_SECRET!,
        AGENT_PROVIDER: "mock",
        AGENT_MODEL: "mock-conservation-agent",
        APP_URL: process.env.APP_URL ?? "http://localhost:3000",
      } as Record<string, string>,
    });
    await client.connect(transport);
  });

  afterAll(async () => {
    await client?.close();
  });

  it("lists the expected inspection tools", async () => {
    const result = await client!.listTools();
    const names = result.tools.map((tool) => tool.name);

    expect(names).toEqual(
      expect.arrayContaining([
        "wenxun_list_buildings",
        "wenxun_get_building",
        "wenxun_search_standards",
        "wenxun_analyze_inspection_text",
        "wenxun_get_inspection",
        "wenxun_list_rectification_tasks",
      ]),
    );
  });

  it("calls a read-only building tool", async () => {
    const result = await client!.callTool({
      name: "wenxun_list_buildings",
      arguments: { limit: 5, offset: 0 },
    });

    expect(result.isError).not.toBe(true);
    expect(JSON.stringify(result.structuredContent)).toContain("HB-A01");
  });

  it("rejects an invalid tool argument through the MCP schema", async () => {
    const result = await client!.callTool({
      name: "wenxun_list_buildings",
      arguments: { limit: 0, offset: -1 },
    });

    expect(result.isError).toBe(true);
  });
});
