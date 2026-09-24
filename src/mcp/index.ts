#!/usr/bin/env node
import "dotenv/config";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createWenxunMcpServer } from "./server";

void serveStdio(createWenxunMcpServer, {
  onerror(error) {
    console.error("[wenxun-mcp] protocol error", error);
  },
});

console.error("[wenxun-mcp] server running over stdio");
