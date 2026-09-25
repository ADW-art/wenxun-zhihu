## Context

现有应用已经使用 Next.js App Router、Tailwind CSS v4、Lucide 和一组基础组件，并在 `src/app/globals.css` 中定义少量 CSS 变量。已确认文档采用“文巡智护”、四类角色和 375 × 812 手机基准；通用 UI 模板中的“守迹”和三类默认角色不再作为项目事实源。Figma 使用 Figwright 本地桥接，但目标设计文件尚未获得创建或切换授权。

## Goals / Non-Goals

**Goals:**

- 把现有视觉约定整理为可复用的 Primitive、Semantic 和 Component Token。
- 在不替换现有页面、框架和组件 API 的前提下，让基础组件统一引用语义 Token。
- 建立 `docs/ui` 单一事实源、Figma 页面结构、组件状态和设计—代码映射。
- 为后续 Figma 高保真、代码实现、截图比较和 WCAG 2.2 AA 检查提供明确入口。

**Non-Goals:**

- 本轮不重做登录页、工作台、巡查详情或任务详情的业务布局。
- 本轮不创建、切换或覆盖任何 Figma 文件。
- 本轮不引入 Storybook、暗色模式、第二套品牌或大型第三方组件库。
- 本轮不完成高保真原型和全部 10 个页面。

## Decisions

### 决策一：代码 Token 采用 Tailwind CSS v4 CSS 变量

继续使用现有 Tailwind CSS v4 和 `@theme inline`，新增 `src/app/tokens.css` 作为可发布基线。相比引入第三方 Token 工具，这种方式没有新运行时依赖，并能直接被现有类名消费。Figma Variables 后续按同名语义结构映射。

### 决策二：语义 Token 优先，旧变量保留别名

新增 `--color-*`、`--space-*`、`--radius-*`、`--shadow-*`、`--focus-*` 等语义 Token，同时把 `--background`、`--primary` 等旧变量保留为别名，降低现有页面迁移风险。相比一次性重命名所有类名，该方案允许分阶段迁移和回滚。

### 决策三：组件增强而不替换

保留现有组件导出名和 Props，优先统一状态色、焦点、禁用、只读和加载表现。相比引入另一套 UI 库，继续使用当前 `Button`、`Input`、`Textarea`、`Select`、`Card`、`StatusBadge` 和 `RiskBadge` 不需要改写业务页面。

### 决策四：Figma 使用强制原生结构

设计文件按 `00 Cover & Status` 到 `08 Handoff & Archive` 组织，颜色、间距和圆角绑定 Variables，组件使用 Auto Layout 和 Variants。相比直接生成扁平视觉稿，该结构能让后续实现、Code Connect 和截图比较可靠。

### 决策五：文档按 UI 项目档案、设计系统、决策/QA 三份维护

`docs/ui/UI_PROJECT_PROFILE.md` 负责产品与业务事实，`UI_DESIGN_SYSTEM.md` 负责 Token、组件和映射，`UI_DECISIONS_AND_QA.md` 负责决策、证据和验收。相比把所有内容堆入现有 `UI_SPEC.md`，三份文档更适合两人团队而不需要引入 Storybook。

## Risks / Trade-offs

- [Figma 文件授权尚未确认] → 本轮只固化文件结构和验收契约，不创建或覆盖 Figma 文件；获得授权后再执行 Figma 任务。
- [现有页面存在状态色和十六进制硬编码] → 先提供别名并迁移共享组件，后续页面逐步替换，避免一次性大范围重构。
- [文档可能与 `UI_SPEC.md`、`UI_DESIGN_BRIEF.md` 重复] → 新文档只保留 UI 工程事实，现有文档通过链接引用，避免复制需求全文。
- [Token 数量过多增加维护成本] → 仅保留核心流程所需的基础色、状态色、间距、圆角、阴影和焦点 Token，不建设完整设计系统平台。
- [没有目标用户测试] → 在决策与 QA 文档中标记为未验证；本轮不伪造测试人数或结果。

## Migration Plan

1. 新增 `docs/ui` 三份文档，并把现有 UI 规格和设计简报链接到新事实源。
2. 新增 `src/app/tokens.css`，在 `globals.css` 中导入并保留旧变量别名。
3. 迁移 Button、Input、Textarea、Select、Card、StatusBadge、RiskBadge 到语义 Token。
4. 运行 OpenSpec 校验、格式、Lint、类型检查、测试和生产构建。
5. 启动运行界面，检查登录页和现有工作区在桌面与 375 px 下没有明显回归。
6. 获得 Figma 文件授权后，按 `UI_DESIGN_SYSTEM.md` 的页面结构创建 Variables、组件和页面模板。

## Open Questions

- 目标 Figma 使用新建专用文件还是在现有文件中新建 UI 页面，待用户授权后决定。
- 目标用户走查尚未执行，待团队安排后补充结果；该问题不改变当前 Token 与组件契约。
