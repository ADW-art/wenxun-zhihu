## Why

当前巡查分析只有 Mock Provider，且项目工具只在 Web 内部可用。接入 DeepSeek 后可以获得真实大模型结构化分析；提供 MCP 服务后，其他支持 Model Context Protocol 的客户端可以安全调用文物建筑巡查数据、规范检索和只读分析工具。

## What Changes

- 新增 DeepSeek OpenAI 兼容 Provider，支持 JSON Output、超时、用量元数据、引用白名单校验和 Mock 自动降级。
- 新增 `wenxun-mcp-server`，使用官方 MCP v2 TypeScript SDK 和 stdio transport。
- 暴露建筑查询、规范检索、巡查分析预览、巡查报告和整改任务查询工具。
- 新增加密密钥的本地环境配置，实际 API Key 不进入仓库。
- 增加 DeepSeek 适配器和 MCP 协议的自动化测试。

## Capabilities

### New Capabilities

- `agent-provider-integration`: DeepSeek 结构化分析、引用校验、错误归一化和 Mock 降级。
- `mcp-inspection-tools`: 面向 MCP 客户端的文物建筑巡查只读工具和结构化结果。

### Modified Capabilities

无。

## Impact

- 新增 `openai`、`@modelcontextprotocol/server` 和测试客户端依赖。
- 修改 Agent Provider 工厂、环境变量和 Agent 编排器。
- 新增 `src/mcp/` 服务和 `npm run mcp:dev`、`npm run mcp:inspect`。
- 真实 API Key 只保存于本地 `.env`，不进入 Git。
