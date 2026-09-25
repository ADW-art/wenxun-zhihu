# UI 设计系统：文巡智护

最后更新：2026-09-25

## 1. 目标与边界

本文件定义项目的最小设计系统契约。Figma 管理设计意图，代码代表实际实现，Token 与组件映射连接两端。

当前只建设核心业务需要的 Foundations、12 个组件类别和状态规则，不建设面向多品牌的完整组件平台。

## 2. Token 分层

```text
Primitive：原始色阶、字体、尺寸值
Semantic：页面真正使用的背景、文字、状态、边框和操作语义
Component：仅有必要时增加的组件级别名
```

代码发布基线位于 `src/app/tokens.css`。Figma Variables 使用相同语义路径，例如：

```text
color/surface/page       -> --color-surface-page
color/text/primary       -> --color-text-primary
color/action/primary     -> --color-action-primary
color/risk/high          -> --color-risk-high
space/4                  -> --space-4
radius/control           -> --radius-control
```

机器可读的 Figma 引导清单位于 `design/figma/ui-foundation.manifest.json`。运行 `npm run ui:check` 会检查页面清单、Variables、组件入口和禁止的原始状态色；CI 已将该命令设为门禁。

## 3. Foundations

### 3.1 Color

| Semantic Token                  | 值        | 用途                 |
| ------------------------------- | --------- | -------------------- |
| `--color-surface-page`          | `#F4F7F5` | 页面背景             |
| `--color-surface-panel`         | `#FFFFFF` | 内容面板             |
| `--color-surface-subtle`        | `#E8EFEC` | 次级区域             |
| `--color-text-primary`          | `#1F2A26` | 标题和正文           |
| `--color-text-secondary`        | `#5A6963` | 说明和辅助信息       |
| `--color-border-default`        | `#D8E1DD` | 分隔和输入边框       |
| `--color-action-primary`        | `#1F6F62` | 主操作和 Focus       |
| `--color-action-primary-hover`  | `#18594F` | 主操作 Hover         |
| `--color-action-primary-active` | `#12483F` | 主操作 Active        |
| `--color-status-success`        | `#2F7D68` | 成功和已关闭         |
| `--color-status-warning`        | `#A96F1F` | 待处理和临近期限     |
| `--color-status-info`           | `#2F6591` | 分析中、系统提示     |
| `--color-status-danger`         | `#C2412D` | 错误、驳回和紧急风险 |
| `--color-risk-high`             | `#C65D2E` | 高风险               |

状态色必须同时配合文字、图标或形状，不允许仅靠颜色区分。

### 3.2 Typography

- 中文正文：Noto Sans SC、Source Han Sans SC 或系统无衬线字体。
- 编号、版本、模型名和数值：IBM Plex Mono 或系统等宽字体。
- 正文 14–16 px，行高 1.5。
- 页面标题 28–36 px；面板标题 16–20 px。
- 辅助文字不小于 12 px，长正文优先 14 px 以上。
- 字母间距保持 0，不使用负字距。

### 3.3 Spacing、Radius 与 Border

- Spacing：`4 / 8 / 12 / 16 / 24 / 32 / 48`。
- Radius：`4 / 6 / 8`，卡片和面板最大 8 px。
- Border：默认 1 px；Focus 使用 2 px 高对比 Ring。
- 触控目标最小高度 44 px；紧凑桌面控件不得小于 32 px。

### 3.4 Elevation

- Page、Card 和 Table 默认使用边框与留白，不使用大面积浮动阴影。
- Elevation 仅用于 Drawer、Dialog、Popover 和需要脱离文档流的临时层。
- 重叠内容必须通过层级和边界表达，不叠加无意义阴影。

### 3.5 Icon 与 Motion

- 功能图标使用 Lucide 线性图标，不使用 emoji。
- 图标按钮必须有可访问名称和 Tooltip，除非图标含义已由始终可见标签说明。
- 动画只用于状态反馈、抽屉和对话框；遵循 `prefers-reduced-motion`。

## 4. 核心组件

| 组件            | Figma 名称          | 代码入口                             | 必要状态                                                  |
| --------------- | ------------------- | ------------------------------------ | --------------------------------------------------------- |
| Button          | `Button`            | `src/components/ui/button.tsx`       | Default、Hover、Active、Focus、Disabled、Loading          |
| Input           | `Input`             | `src/components/ui/input.tsx`        | Default、Focus、Disabled、Error、Read-only                |
| Textarea        | `Textarea`          | `src/components/ui/textarea.tsx`     | Default、Focus、Disabled、Error、Read-only、长文本        |
| Select          | `Select`            | `src/components/ui/select.tsx`       | Default、Focus、Disabled、Error                           |
| Search / Filter | `SearchFilter`      | 待实现                               | Empty、Result、No-result、Clear、Multi-filter             |
| Tabs / Table    | `TabsTable`         | 待实现                               | Default、Selected、Sorting、Loading、Empty、Dense         |
| Status          | `Status`            | `src/components/ui/status-badge.tsx` | Neutral、Info、Warning、Success、Danger                   |
| Risk            | `RiskBadge`         | `src/components/ui/risk-badge.tsx`   | Low、Medium、High、Critical                               |
| Upload          | `EvidenceUpload`    | 现有页面 + 待组件化                  | Idle、Uploading、Success、Format error、Too large、Failed |
| Image Viewer    | `EvidenceViewer`    | 待实现                               | Loading、Loaded、Failed、Alt text、Marker、Full screen    |
| Timeline        | `ReviewTimeline`    | 待实现                               | Current、Completed、Rejected、Locked                      |
| Task Row        | `InspectionTaskRow` | 现有列表 + 待组件化                  | Open、In progress、Review、Closed、Rejected、Overdue      |
| Feedback        | `EmptyErrorLoading` | 现有局部实现 + 待组件化              | Empty、Loading、Error、Permission denied、Read-only       |

### 4.1 组件状态原则

- 主操作只有权限允许时出现。
- 已关闭记录显示为只读，不提供重复提交按钮。
- Loading 必须保留上下文和已输入内容。
- Error 必须说明失败对象、原因和下一步，不使用只写“操作失败”的空泛提示。
- Empty 状态必须提供主操作或可执行返回路径。
- 长文本必须换行并扩展容器，不通过截断隐藏业务关键信息。

## 5. 业务状态映射

| 业务对象 | 状态       | 视觉语义               | 必须显示                |
| -------- | ---------- | ---------------------- | ----------------------- |
| 智能分析 | 待分析     | Neutral                | 运行入口                |
| 智能分析 | 分析中     | Info + Loading         | 当前阶段和取消/等待说明 |
| 智能分析 | 成功       | Success                | 结果、来源和生成时间    |
| 智能分析 | 失败       | Danger                 | 原因、保留输入、重试    |
| 智能分析 | 降级       | Warning                | 降级标识和预置结果说明  |
| 风险     | 待确认     | Warning                | 人工确认或排除入口      |
| 风险     | 已确认     | Danger/High 或对应等级 | 复核人、时间和依据      |
| 风险     | 已排除     | Neutral                | 排除理由                |
| 风险     | 已消除     | Success                | 关闭证据和历史          |
| 整改任务 | 待处理     | Warning                | 责任人、期限、验收标准  |
| 整改任务 | 处理中     | Info                   | 已提交内容              |
| 整改任务 | 待复核     | Warning                | 证据和缺项              |
| 整改任务 | 已驳回     | Danger                 | 明确原因和重新提交入口  |
| 整改任务 | 已关闭     | Success                | 复核记录和归档          |
| 规范依据 | 已匹配     | Success                | 标准号、条款和来源      |
| 规范依据 | 信息不足   | Warning                | 不编造条款的说明        |
| 规范依据 | 来源不可用 | Danger                 | 失败来源和替代动作      |

## 6. 页面与响应式规则

- 桌面工作台使用固定侧栏和受约束内容宽度，不使用营销式大 Hero。
- 复杂录入、风险复核和证据审核以双栏为主，窄屏按任务顺序变为单栏。
- 表格在窄屏下必须转换为可读的行列表，不横向溢出页面。
- 375 px 下保留查看、确认、驳回和轻量提交；复杂巡查提示使用桌面端。
- 页面只保留一个主要视觉任务，避免标题、按钮、状态和卡片竞争层级。
- 不为填满页面制造虚假指标、趋势图、进度环或装饰模块。

## 7. Figma 文件结构

目标文件获得用户授权后，页面命名固定如下：

```text
00 Cover & Status
01 Research & Flows
02 Wireframes
03 Foundations
04 Components & Patterns
05 Desktop Screens
06 Mobile Screens
07 Prototype
08 Handoff & Archive
```

创建 Figma 内容时直接读取 `design/figma/ui-foundation.manifest.json`，不得重新临场命名页面、Variables 或组件。

### 7.1 Foundations 变量集合

```text
Primitive/Color
Primitive/Space
Primitive/Radius
Primitive/Font
Semantic/Color
Semantic/Space
Semantic/Radius
Semantic/Type
Component/Control
```

### 7.2 原生设计要求

- 主要 Frame 使用 Auto Layout。
- 重复元素使用 Component、Variants 或 Component Properties。
- 颜色、间距和圆角优先绑定 Variables。
- 层名使用业务语义，不使用 `Frame 123`、`Rectangle 7`。
- 页面内容使用真实中文业务数据，不用 Lorem Ipsum。
- 禁止把可编辑页面压成单张图片。

## 8. Figma-to-code 映射

| Figma               | Code                           | Token / Props          | 状态   |
| ------------------- | ------------------------------ | ---------------------- | ------ |
| `Button/Primary`    | `<Button variant="default">`   | `color/action/primary` | 已存在 |
| `Button/Secondary`  | `<Button variant="secondary">` | `color/surface/panel`  | 已存在 |
| `Button/Danger`     | `<Button variant="danger">`    | `color/status/danger`  | 已存在 |
| `Input`             | `<Input>`                      | `color/border/default` | 已存在 |
| `Textarea`          | `<Textarea>`                   | `color/border/default` | 已存在 |
| `Select`            | `<Select>`                     | `color/border/default` | 已存在 |
| `Status`            | `<StatusBadge>`                | `color/status/*`       | 已存在 |
| `RiskBadge`         | `<RiskBadge>`                  | `color/risk/*`         | 已存在 |
| `EvidenceUpload`    | 待组件化                       | 待定义                 | 待映射 |
| `EvidenceViewer`    | 待实现                         | 待定义                 | 待映射 |
| `ReviewTimeline`    | 待实现                         | 待定义                 | 待映射 |
| `InspectionTaskRow` | 现有列表项待组件化             | 业务 Props             | 待映射 |

Code Connect 可用时应生成 `.figma.ts`；不可用时以本表作为人工映射记录。

## 9. 无障碍与验收关联

- 目标为 WCAG 2.2 AA。
- 正文与背景对比度至少 4.5:1。
- 键盘可完成登录、提交、确认、驳回和任务关闭。
- Focus 清晰可见且不被固定层遮挡。
- 表单标签始终可见，错误与字段建立程序化关联。
- 状态消息通过文本或 Live Region 通知，不仅依赖颜色。
- 图片有替代文本；证据图说明必须与照片对应。

每个页面的具体检查项记录在 `docs/ui/UI_DECISIONS_AND_QA.md`。
