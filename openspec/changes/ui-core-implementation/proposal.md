## Why

当前 Figma 已形成成熟的 6 页桌面主流程和 2 页移动采集流程，但运行中的 Next.js 页面仍是临时 UI，视觉 Token 和组件语义也未与该设计同步。现在需要把已确认视觉骨架落到真实业务页面上，让核心巡查闭环可以稳定演示、测试和继续扩展。

## What Changes

- 把代码 Token 同步为深墨绿、宣纸米黄、朱红状态色的守迹参考视觉。
- 新增深色 App Shell，保留现有权限模型和业务路由。
- 新增安全的风险地图页，使用示意资产，不展示精确坐标。
- 重构巡查总览、巡查详情、复核操作、整改任务详情和报告中心。
- 抽取页面标题、指标、状态、证据、时间线和任务表等共享模式。
- 补齐核心页面的加载、空、错误、无权限、驳回、降级和证据不足状态。
- 保持当前 Prisma 状态机和 API，不新增未确认的业务规则。

## Capabilities

### New Capabilities

- `core-ui-implementation`: 将已确认 UI 设计落地为可运行的文巡智护核心页面、共享组件和状态体验。

### Modified Capabilities

- 无。

## Impact

- `src/app/tokens.css`：更新为深墨绿与宣纸色语义 Token。
- `src/components/`：新增和调整 App Shell、页面标题、指标、证据、状态和任务展示组件。
- `src/app/(workspace)/`：实装风险地图、巡查总览、巡查详情、任务详情和报告中心。
- `public/assets/`：新增可公开演示的示意地图和暗纹资产。
- 验证：格式、Lint、类型检查、UI 契约、测试、构建和 Playwright 页面检查。
