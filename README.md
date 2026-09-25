# 文巡智护

文巡智护是面向文物建筑的智能巡查与保护整改智能体。它以 Web 工作台为主要交互形态，把巡查计划、风险识别、规范引用、整改任务、证据复核和报告归档连接为一个可追踪闭环。

## 当前阶段

项目处于工程基础设施和最小纵向闭环阶段。完整状态见 [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md)。

## 环境要求

- Node.js 24
- npm 11
- Docker Desktop 或可用的 PostgreSQL 17

## 安装

```powershell
npm install
Copy-Item .env.example .env
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 开发

```powershell
npm run dev
```

访问 `http://localhost:3000`。

## DeepSeek

在本地 `.env` 中设置：

```text
AGENT_PROVIDER="deepseek"
AGENT_MODEL="deepseek-v4-flash"
AGENT_BASE_URL="https://api.deepseek.com"
DEEPSEEK_API_KEY="你的本地密钥"
```

不要提交 `.env`。没有密钥或 DeepSeek 调用失败时，系统会自动降级到 Mock Provider。

填入密钥后运行真实 Provider 冒烟测试：

```powershell
npm run ai:smoke
```

## MCP

```powershell
npm run mcp:dev
npm run mcp:inspect
```

`mcp:dev` 启动本地 stdio MCP 服务。`mcp:inspect` 使用官方 MCP Inspector 调试工具列表和调用参数。

项目级 Codex MCP 配置位于 `.codex/config.toml`。信任本项目后，Codex 会自动加载 `wenxun-mcp-server`。

## 检查

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run ui:check
npm test
npm run build
```

启动 PostgreSQL 后，可以运行包含数据库状态流转的完整测试：

```powershell
npm run test:integration
```

## 演示账号

所有账号的本地演示密码均为 `DemoPass123!`。

| 角色       | 邮箱                    |
| ---------- | ----------------------- |
| 巡查人员   | `inspector@example.com` |
| 整改责任人 | `rectifier@example.com` |
| 复核人员   | `reviewer@example.com`  |
| 管理员     | `admin@example.com`     |

## 文档入口

- [项目简介](docs/PROJECT_BRIEF.md)
- [需求规格](docs/REQUIREMENTS.md)
- [系统架构](docs/ARCHITECTURE.md)
- [测试计划](docs/TEST_PLAN.md)
- [项目状态](docs/PROJECT_STATE.md)
- [智能体契约](docs/AGENT_CONTRACTS.md)
- [工具注册表](docs/TOOL_REGISTRY.md)
- [RAG 规格](docs/RAG_SPEC.md)
- [评测计划](docs/EVAL_PLAN.md)
- [UI 设计需求](docs/UI_DESIGN_BRIEF.md)
- [UI 产品档案](docs/ui/UI_PROJECT_PROFILE.md)
- [UI 设计系统](docs/ui/UI_DESIGN_SYSTEM.md)
- [UI 决策与 QA](docs/ui/UI_DECISIONS_AND_QA.md)
- [AI UI 下一会话交接](AI_UI_NEXT_SESSION_HANDOFF.md)
- [MCP 服务说明](docs/MCP.md)

## 安全

不要提交 `.env`、真实用户资料、真实文保单位敏感位置、安防信息或未授权图片。
