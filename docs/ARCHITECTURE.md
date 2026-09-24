# 系统架构

最后更新：2026-09-24

## 1. 架构原则

- 采用单体 Web 应用，先保证闭环完整。
- 业务规则、Agent 和 Provider 分层，模型供应商可替换。
- 所有副作用操作必须通过服务端权限和业务校验。
- 模型只能提出建议，人工负责最终确认。
- 无必要不引入消息队列、微服务、多智能体或图数据库。

## 2. 分层结构

```text
Next.js App Router
  ├─ Server Components / Route Handlers
  ├─ Auth.js session and RBAC
  ├─ Inspection domain services
  ├─ Agent orchestrator
  │   ├─ Provider abstraction
  │   ├─ Prompt registry
  │   └─ Tool registry
  ├─ Knowledge retrieval
  ├─ File storage abstraction
  └─ Audit and observability
          │
          ▼
PostgreSQL + Prisma
```

## 3. 数据流

```text
用户提交巡查
  -> Zod 校验
  -> 保存 Inspection 和 Evidence
  -> AgentRun 创建
  -> 生成计划 / 检索规范 / 分析风险
  -> 保存结构化 Finding
  -> 人工确认
  -> 创建 RectificationTask
  -> 整改证据提交
  -> Agent 初审
  -> 人工复核
  -> 生成报告和审计日志
```

## 4. Agent 设计

- 单个编排智能体，不拆分多个角色。
- 工具调用使用 JSON Schema，执行前检查角色和工具白名单。
- 有副作用的工具必须经过用户确认。
- Provider 输出失败或 Schema 不合法时重试一次，再切换降级结果。
- Prompt 和工具 Schema 有版本号。

## 5. 部署拓扑

推荐生产方案：

```text
Browser
  -> Vercel / Docker Node server
  -> PostgreSQL
  -> S3-compatible object storage
  -> OpenAI-compatible model API
```

本地开发：

```text
Next.js dev server
  -> Docker PostgreSQL
  -> Local file storage
  -> Mock Provider
```

## 6. 关键架构决策

- ADR-001：使用 Next.js 全栈单体。
- 后续 ADR：认证实现、RAG 检索策略、部署平台、真实模型 Provider。
