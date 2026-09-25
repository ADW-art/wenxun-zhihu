# 文巡智护 UI 实装交接

最后更新：2026-09-25

## 当前状态

- 项目：文巡智护，文物建筑智能巡查与保护整改智能体。
- 当前分支：`codex/ui-foundation-v1`。
- 已推送基础设计里程碑：`a6f18e3 feat: add UI design foundation and Figma handoff`。
- 本轮核心页面实装已经完成本地验证，等待提交为新的 GitHub 里程碑。

## 已实装页面

| 路由                                                 | 能力                                            |
| ---------------------------------------------------- | ----------------------------------------------- |
| `/risk-map`                                          | 示意地图、风险点位、建筑详情和处置进度          |
| `/dashboard`                                         | 指标、重点巡查、最近巡查看板和当前关注          |
| `/inspections/[id]`                                  | 原始证据、流程步骤、AI 初判、规范依据和复核入口 |
| `/tasks/[id]`                                        | 验收标准、整改证据、风险依据和处理记录          |
| `/reports`                                           | 归档指标、可归档巡查和报告下载                  |
| `/inspections`、`/tasks`、`/buildings`、`/standards` | 已统一新视觉壳层与页面标题                      |

## 共享组件

- `src/components/app-shell.tsx`
- `src/components/workspace-nav.tsx`
- `src/components/page-header.tsx`
- `src/components/evidence-gallery.tsx`
- `src/components/status-timeline.tsx`
- `src/components/ui/metric-card.tsx`
- `src/components/ui/feedback-state.tsx`

## 演示数据

`prisma/seed.ts` 已扩展为两个确定性演示案例：

1. `demo_inspection_001`：待人工复核巡查，包含 2 条风险、规范引用和 Agent 运行记录。
2. `demo_inspection_workflow_001`：整改复核案例，包含已确认风险、整改任务、证据和复核流转。

所有演示图片位都标记为演示素材，不是真实病害证据。

## 验证命令

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run ui:check
npm test
npm run test:integration
npm run build
```

当前结果：

- 5 个测试文件通过，2 个跳过；12 项测试通过，4 项跳过。
- 数据库集成测试通过。
- 生产构建通过。
- 1440/1280 与 375 核心页面无横向溢出，生产控制台 0 errors、0 warnings。

## 仍需完成

- 将本轮核心页面实装提交并推送到 `origin/codex/ui-foundation-v1`。
- 统计分析和系统管理尚未实装。
- 正式地图来源与审图号需要确认。
- 演示照片需要替换为授权素材。
- 需要补充目标用户走查和键盘/对比度人工检查。
- Figma 组件库尚未完全抽成 Components/Variants，后续应与代码组件同步。

## 禁止事项

- 不得把产品名称改为“守迹”。
- 不得展示精确坐标、敏感安防信息或未公开遗址信息。
- 不得把参考图截图或演示素材声明为真实巡查证据。
- 不得未经检查覆盖现有 Figma 节点或已有业务状态机。
