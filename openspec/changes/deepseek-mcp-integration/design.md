## Context

现有系统已经完成 Provider 抽象、结构化 Schema、引用存在性校验、Agent Run 记录和 Mock 降级。MCP 目前没有服务端，外部客户端无法复用巡查数据与规范工具。DeepSeek 使用 OpenAI 兼容协议，支持 JSON Output、Function Calling 和严格工具 Schema。

## Goals / Non-Goals

**Goals:**

- 使用 DeepSeek 生成结构化巡查分析，并保留现有业务 Schema。
- DeepSeek 失败时自动回退 Mock，不阻塞演示。
- 提供官方 MCP v2 TypeScript SDK 实现的本地 stdio 服务。
- MCP 首版只提供只读和预览工具，避免外部客户端越权修改数据。
- 使用自动化测试验证 Provider 解析和 MCP 协议调用。

**Non-Goals:**

- 不实现远程 Streamable HTTP MCP 服务。
- 不通过 MCP 创建、审批或关闭业务记录。
- 不实现 Embedding 或 `pgvector`。
- 不接公网部署。

## Decisions

### DeepSeek 使用 OpenAI SDK

- 选择：使用 `openai` 包连接 `https://api.deepseek.com`。
- 原因：DeepSeek 官方支持 OpenAI 兼容格式，SDK 已处理超时、重试和类型。
- 备选：直接 `fetch`。拒绝，因为需要自行维护更多协议细节。

### JSON Output 而不是 Function Calling

- 选择：巡查分析使用 `response_format: json_object`，由本地 Zod 做最终校验。
- 原因：当前 Agent 只做一次结构化分析；工具能力由 MCP 单独提供。
- 备选：让模型直接调用数据库工具。拒绝，因为会增加写入和越权风险。

### 引用白名单

- 选择：候选条款先由本地检索确定，DeepSeek 只能引用候选 clauseId。
- 原因：防止模型编造规范来源。
- 备选：根据模型引用再查数据库。拒绝，因为无法证明引用来自当前巡查上下文。

### MCP 使用 stdio 与只读工具

- 选择：官方 v2 SDK、stdio transport、六个只读或预览工具。
- 原因：当前阶段只支持本机开发和桌面客户端；只读边界最小且可验证。
- 备选：立即提供远程 HTTP 和写入工具。拒绝，因为需要额外认证、审计和部署设计。

### 测试策略

- 选择：DeepSeek Provider 使用 Fake Client 测试解析和引用拦截；MCP 使用官方 Client 启动真实 stdio 子进程。
- 原因：既验证业务边界，也验证协议握手、工具发现、调用和参数校验。

## Risks / Trade-offs

- [DeepSeek 偶发空 JSON] → 重试一次后自动回退 Mock，并保留错误记录。
- [模型引用幻觉] → clauseId 白名单校验，非法引用直接拒绝。
- [MCP stdio 子进程环境不一致] → 测试显式传入数据库、Agent 和 Auth 环境变量。
- [只读 MCP 功能有限] → 首版保证安全，后续基于 OpenSpec 单独增加写入工具与人工确认机制。
- [真实 API Key 泄漏] → 只允许写入本地 `.env`，不进入 Git、日志和测试快照。

## Migration Plan

1. 更新 `.env` Provider 配置并填入 DeepSeek Key。
2. 运行 DeepSeek Provider 单元测试和 MCP 协议集成测试。
3. 通过 Web UI 发起一次真实分析，核对 Provider、模型、Token 和引用。
4. 失败时把 `AGENT_PROVIDER` 改回 `mock` 即可回滚。

## Open Questions

- `deepseek-v4-pro` 与 `deepseek-v4-flash` 的成本、延迟和文保场景质量对比需要在真实 Key 可用后验证。
