# Project Instructions

## Read First

- `docs/PROJECT_BRIEF.md`
- `docs/REQUIREMENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/PROJECT_STATE.md`
- `docs/AGENT_CONTRACTS.md`
- `docs/TOOL_REGISTRY.md`

## Project Goal

- 项目定义：文巡智护，文物建筑智能巡查与保护整改智能体。
- 项目目标：为文物建筑巡查人员提供智能规划、风险识别、规范引用、整改闭环和档案报告能力。
- 当前阶段：基础设施和最小可运行闭环。
- 非目标：自动结构鉴定、自动修复方案、IoT、三维扫描、多智能体、真实敏感数据。

## Repository Map

- `src/app/`：Next.js 页面与路由处理器。
- `src/components/`：共享界面组件。
- `src/lib/`：数据库、认证、领域逻辑和通用工具。
- `src/agent/`：智能体、Provider、Prompt、工具和 Schema。
- `content/standards/`：可审阅的规范知识库源文件。
- `prisma/`：数据模型、迁移和种子数据。
- `docs/`：产品、架构、测试、安全和智能体规格。

## Commands

- 安装：`npm install`
- 开发：`npm run dev`
- Lint：`npm run lint`
- 类型检查：`npm run typecheck`
- UI 契约检查：`npm run ui:check`
- 单元测试：`npm test`
- 数据库集成测试：`npm run test:integration`
- 构建：`npm run build`
- MCP 开发：`npm run mcp:dev`
- MCP Inspector：`npm run mcp:inspect`
- Codex MCP 配置：`.codex/config.toml`
- 数据库生成：`npm run db:generate`
- 数据库迁移：`npm run db:migrate`
- 种子数据：`npm run db:seed`

## Development Workflow

1. 修改前阅读相关规格和现有实现。
2. 复杂任务先提出计划，不直接编码。
3. 只修改完成任务所需的最小范围。
4. 修改后运行格式、Lint、类型检查、测试和构建。
5. 更新相关文档和 `docs/PROJECT_STATE.md`。

## Anti-Assumption Rules

- 不得自行改变产品范围。
- 不得猜测未确认的业务规则。
- 不得擅自更换技术栈和核心依赖。
- 发现规格、测试和代码冲突时停止并报告。
- 不得把模型输出直接作为最终文保结论。

## Security

- 不提交真实密钥和用户数据。
- 不记录完整敏感请求和响应。
- 外部输入和模型结构化输出必须验证。
- 上传文件必须限制类型、大小并移除不必要定位信息。
- 精确坐标、安防设施和未公开遗址信息不得进入演示数据。

## Definition of Done

- 符合已确认需求和验收标准。
- 格式、Lint、类型检查、测试和构建通过。
- 文档与实现一致。
- 无未说明的范围扩张。
- 已审查 Git diff 和已知风险。

## Code Review Rules

- 优先检查正确性、安全、数据损坏、权限绕过和回归。
- 不把纯格式问题作为最高优先级问题。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
