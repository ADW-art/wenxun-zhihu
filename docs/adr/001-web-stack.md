# ADR-001：使用 Next.js 全栈单体

- 状态：已接受
- 日期：2026-09-24

## 背景

竞赛版需要在有限时间内完成 Web 页面、API、认证、数据库、Agent 工作流、测试和公网部署。

## 决策

使用 Next.js App Router、TypeScript、Tailwind CSS、PostgreSQL、Prisma 和 Auth.js。Agent 与 Provider 保持独立分层。

## 备选

- React + Vite + Fastify：边界清晰，但部署和维护成本更高。
- Vue/Nuxt：开发效率高，但当前智能体全栈生态的示例相对较少。

## 后果

- 一个仓库和一套类型系统，降低集成成本。
- Agent 长任务需要控制超时或后续引入后台任务。
- 业务规模扩大后，可以逐步拆分 API 或 Worker。
