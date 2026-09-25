## Why

项目已有可运行的基础界面，但 UI 规则分散在需求简报、页面代码和局部样式中，缺少统一的 Token 契约、组件状态定义、设计—代码映射和验收入口。此时先建立 UI 设计基础设施，可以避免后续 Figma 高保真与 Next.js 实现各自演进。

## What Changes

- 建立 `docs/ui` 下的项目档案、设计系统和决策/QA 文档。
- 建立与 Tailwind CSS v4 兼容的分层语义 Token，并让现有组件移除对 Tailwind 默认状态色的直接依赖。
- 建立机器可读的 Figma Variables/组件/页面清单和 UI 契约检查脚本，并由 CI 执行。
- 记录核心组件、全部必要状态、响应式基准、无障碍要求和 Figma-to-code 映射。
- 记录已核验的文保业务与无障碍依据；产品名和四类角色以现有已确认文档为准。
- 明确 Figma 文件结构、原生节点要求和后续高保真交付边界；本轮不创建或覆盖 Figma 文件。

## Capabilities

### New Capabilities

- `ui-design-system`: 提供文巡智护统一的设计 Token、核心组件状态、Figma 原生设计要求、设计—代码映射和 UI 验收契约。

### Modified Capabilities

- 无。

## Impact

- 文档：新增 `docs/ui/UI_PROJECT_PROFILE.md`、`UI_DESIGN_SYSTEM.md`、`UI_DECISIONS_AND_QA.md`，更新现有 UI 文档和项目状态。
- 代码：调整 `src/app/globals.css` 与现有基础 UI 组件，使颜色、状态和交互样式引用统一语义 Token。
- 设计：约定目标 Figma 文件必须包含 Variables、基础组件和页面模板；实际文件创建需用户授权。
- 验证：OpenSpec 校验、格式、Lint、类型检查、测试、生产构建；必要时执行浏览器截图检查。
