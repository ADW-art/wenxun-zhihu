# 工具注册表

最后更新：2026-09-24

## 1. 工具列表

| 工具                         | 作用               | 副作用 | 人工确认     |
| ---------------------------- | ------------------ | ------ | ------------ |
| `plan_inspection`            | 生成巡查清单       | 无     | 否           |
| `search_standards`           | 检索和返回规范条款 | 无     | 否           |
| `assess_findings`            | 生成结构化风险草案 | 无     | 风险确认必需 |
| `create_rectification_task`  | 创建整改任务草案   | 有     | 必需         |
| `review_task_evidence`       | 检查整改证据完整性 | 无     | 复核必需     |
| `generate_inspection_report` | 生成报告数据       | 无     | 归档前必需   |

## 2. 执行规则

- 工具名称和参数使用 Zod Schema 白名单。
- 工具运行时继承当前用户权限。
- 所有工具调用写入 `ToolCall`。
- 有副作用工具默认返回草案，由业务接口在人工确认后落库。
- 工具不得接受任意 URL、SQL 或文件路径。
- 超时默认 10 秒，单次 Agent 最多 8 次工具调用。

## 3. 版本

当前工具 Schema 版本：`tools.v1`。修改参数或语义时必须提升版本并重跑 Agent 评测。

## 4. MCP 工具

MCP 服务 `wenxun-mcp-server` 使用 stdio transport，当前只暴露只读或预览工具：

| MCP 工具                          | 作用                               | 写入数据库 |
| --------------------------------- | ---------------------------------- | ---------: |
| `wenxun_list_buildings`           | 分页查询脱敏建筑档案               |         否 |
| `wenxun_get_building`             | 获取建筑历史风险和最近巡查         |         否 |
| `wenxun_search_standards`         | 检索公开标准条款和项目规则         |         否 |
| `wenxun_analyze_inspection_text`  | 运行不落库的巡查分析预览           |         否 |
| `wenxun_get_inspection`           | 获取巡查、风险、证据和复核报告数据 |         否 |
| `wenxun_list_rectification_tasks` | 分页查询整改任务                   |         否 |

所有 MCP 工具使用严格 Zod Schema，并声明 `readOnlyHint`、`destructiveHint`、`idempotentHint` 和 `openWorldHint`。
