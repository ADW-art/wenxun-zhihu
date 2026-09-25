## Purpose

为文巡智护建立统一的 UI 视觉语义、组件状态、响应式规则、无障碍要求以及 Figma 与代码之间的可追踪映射，使设计稿和运行界面能够围绕同一套契约持续演进。

## ADDED Requirements

### Requirement: Canonical UI project profile

系统 SHALL 维护唯一的产品 UI 档案，记录已确认的项目名称、用户角色、核心任务、流程、设备范围、成功标准和待确认事项。

#### Scenario: Resolve conflicting guidance

- **WHEN** 项目文档与通用 UI 模板对名称、角色或设备基准给出不同默认值
- **THEN** UI 档案 SHALL 采用用户已确认的项目文档，并记录模板默认值不适用

#### Scenario: Locate current UI scope

- **WHEN** 设计或开发人员开始一轮 UI 工作
- **THEN** UI 档案 SHALL 提供当前范围、非目标和权威文档入口

#### Scenario: Identify the product type

- **WHEN** 设计、开发或验收人员读取 UI 产品档案
- **THEN** 档案 SHALL 明确项目是“文物建筑智能巡查与保护整改智能体”，并把 Web 工作台描述为主要交互形态

### Requirement: Layered design token contract

系统 SHALL 使用 Primitive、Semantic、Component 三层 Token，并让业务页面通过语义 Token 使用颜色、字体、间距、圆角和焦点样式。

#### Scenario: Build a business component

- **WHEN** 组件表达主操作、风险、成功、警告、信息、禁用或 Focus 状态
- **THEN** 组件 SHALL 引用语义 Token，MUST NOT 在业务页面散落状态色或品牌色十六进制值

#### Scenario: Keep backward compatibility

- **WHEN** 现有组件仍引用旧变量名
- **THEN** 旧变量 SHALL 作为语义 Token 的别名继续可用，直到迁移完成并有验证记录

### Requirement: Core component state coverage

系统 SHALL 为核心组件定义正常、交互、禁用、加载、错误、空数据、只读和权限不足等适用状态。

#### Scenario: Submit an unavailable action

- **WHEN** 用户没有操作权限或任务已经关闭
- **THEN** 界面 SHALL 隐藏不可执行主操作，并提供明确的权限或只读说明

#### Scenario: Display a long-running analysis

- **WHEN** 智能分析、上传或复核请求正在执行
- **THEN** 界面 SHALL 显示进行中状态、保留已输入内容，并在失败时提供失败原因和重试入口

### Requirement: Cultural-heritage and AI safety states

系统 SHALL 把 AI 不确定性、人工确认、规范来源、证据不足、整改驳回和降级模式表达为显式界面状态。

#### Scenario: Finding awaits human confirmation

- **WHEN** AI 生成的风险尚未被复核人员确认
- **THEN** 界面 SHALL 显示“待确认”和人工确认入口，MUST NOT 显示为整改中或最终结论

#### Scenario: Citation is unavailable

- **WHEN** 风险没有可靠的规范条款来源
- **THEN** 界面 SHALL 显示“信息不足”或“来源不可用”，MUST NOT 编造条款

#### Scenario: Provider is degraded

- **WHEN** 真实模型调用失败并切换到预置降级结果
- **THEN** 界面 SHALL 明确显示降级状态，并允许用户继续人工流程

### Requirement: Figma native design source

Figma 文件 SHALL 使用语义化图层、Auto Layout、Variables、组件与 Variants 表达设计和状态，MUST NOT 用扁平图片冒充可编辑页面。

#### Scenario: Prepare a screen for handoff

- **WHEN** 页面准备从设计交付到代码实现
- **THEN** 页面 SHALL 使用已发布组件、Variables、Auto Layout 和完整适用状态

#### Scenario: Edit content length

- **WHEN** 标题、风险描述、规范引用或证据说明变长
- **THEN** 容器 SHALL 根据 Figma 的 resizing 约束扩展或换行，MUST NOT 发生不可控重叠

### Requirement: Design-to-code mapping

系统 SHALL 维护 Figma 组件、代码组件、Token/Props 和映射状态的对应关系。

#### Scenario: Implement a mapped component

- **WHEN** 代码实现使用已映射的 Figma 组件
- **THEN** 实现 SHALL 复用对应代码组件和语义 Token，MUST NOT 为单个页面复制不可复用 HTML/CSS

#### Scenario: Figma and code diverge

- **WHEN** 设计稿、Token 或运行代码出现不一致
- **THEN** 差异 SHALL 记录到 UI 决策与 QA 文档，并在再次验收前解决或明确保留原因

### Requirement: Machine-readable Figma bootstrap

系统 SHALL 维护机器可读的 Figma 页面、Variables 和组件清单，并通过自动检查验证清单与代码 Token 一致。

#### Scenario: Tokens remain synchronized

- **WHEN** 代码 Token 数值或名称发生变化
- **THEN** Figma 引导清单 SHALL 同步更新，UI 契约检查 SHALL 通过

#### Scenario: Token drift is introduced

- **WHEN** Figma 引导清单与代码 Token 不一致
- **THEN** UI 契约检查 SHALL 以非零状态退出并指出不一致的 Token

### Requirement: Responsive and accessible UI

系统 SHALL 支持已确认的桌面、笔记本、平板和手机基准，并使核心任务满足 WCAG 2.2 AA 的关键要求。

#### Scenario: Inspect on mobile

- **WHEN** 页面在 375 px 宽度显示
- **THEN** 页面 SHALL 无横向滚动，文字 SHALL NOT 溢出按钮或卡片，查看、轻量确认和提交任务 SHALL 可用

#### Scenario: Operate with keyboard

- **WHEN** 用户仅使用键盘完成登录、表单提交、确认风险和复核任务
- **THEN** 焦点 SHALL 清晰可见，顺序 SHALL 合理，状态变化 SHALL 提供文本反馈而不仅依赖颜色

### Requirement: UI evidence and acceptance record

系统 SHALL 为 UI 基础设施保留可追溯的调研来源、设计决策、验证命令、截图或运行证据和剩余限制。

#### Scenario: Verify infrastructure completion

- **WHEN** 一次 UI 基础设施变更准备完成
- **THEN** 项目 SHALL 记录实际运行的格式、Lint、类型检查、测试、构建和必要的页面检查结果

#### Scenario: Record a deferred item

- **WHEN** Figma 文件、授权素材或目标用户测试暂时无法完成
- **THEN** 文档 SHALL 记录未完成项、原因和恢复所需的单一动作，MUST NOT 声称已经完成
