## Purpose

把已经确认的文巡智护视觉语言和安全业务边界实装为真实可运行的 Web 工作台，使巡查、复核、整改和归档核心闭环具备一致的页面、组件和状态体验。

## ADDED Requirements

### Requirement: Visual token synchronization

代码 SHALL 使用深墨绿导航、宣纸工作区、米白面板、朱红高风险和土金中风险的语义 Token，并保留必要的旧别名以避免无范围回归。

#### Scenario: Render the application shell

- **WHEN** 已登录用户进入工作区
- **THEN** 页面 SHALL 使用深色侧栏、宣纸工作区、衬线标题和清晰选中态

#### Scenario: Keep old aliases valid

- **WHEN** 尚未迁移的旧组件引用旧 Token 名称
- **THEN** 旧别名 SHALL 继续映射到新的语义 Token

### Requirement: Safe risk map

系统 SHALL 提供一个只读的风险地图工作台，使用示意地图和不展示精确坐标的脱敏点位。

#### Scenario: View risk distribution

- **WHEN** 用户打开风险地图
- **THEN** 系统 SHALL 展示风险点位、图例、汇总和选中建筑摘要

#### Scenario: Protect sensitive location

- **WHEN** 页面显示建筑位置
- **THEN** 系统 MUST 只显示脱敏地区标签，不得输出精确经纬度、安防设施或未公开遗址信息

### Requirement: Inspection overview dashboard

系统 SHALL 在巡查总览中展示关键指标、最近巡查、当前重点风险和进入新建巡查或详情页的入口。

#### Scenario: Empty inspection data

- **WHEN** 没有巡查记录
- **THEN** 页面 SHALL 显示空状态和创建巡查入口

#### Scenario: Load inspection data fails

- **WHEN** 数据库或服务调用失败
- **THEN** 页面 SHALL 显示可理解的错误状态，不得渲染空白页面

### Requirement: Inspection evidence and review workspace

系统 SHALL 在巡查详情中同时呈现原始证据、现场观察、AI 初判、人工关注项、规范来源和复核操作。

#### Scenario: Finding awaits review

- **WHEN** 风险状态为 `PROPOSED`
- **THEN** 页面 SHALL 显示待确认状态和符合权限的确认入口

#### Scenario: Agent is degraded

- **WHEN** 最近一次 Agent Run 使用降级结果
- **THEN** 页面 SHALL 明确显示降级状态，并保留人工继续流程的入口

### Requirement: Rectification task review

系统 SHALL 在整改任务详情中展示验收标准、整改证据、证据完整性、处理记录和权限对应的提交或复核操作。

#### Scenario: Evidence is missing

- **WHEN** 任务没有整改证据
- **THEN** 页面 SHALL 显示证据缺失状态，复核人员 MUST 不能关闭任务

#### Scenario: Task is rejected

- **WHEN** 复核人员驳回任务
- **THEN** 页面 SHALL 显示驳回原因和责任人重新提交路径

### Requirement: Archived report center

系统 SHALL 在报告中心展示可归档巡查、风险数量、闭环状态和下载入口。

#### Scenario: Generate a report

- **WHEN** 巡查包含已确认风险和关闭任务
- **THEN** 页面 SHALL 提供报告数据查看和报告下载入口

### Requirement: Responsive and accessible core pages

核心页面 SHALL 在 1440 px 和 375 px 下保持可操作，并满足键盘焦点、可见标签和非颜色状态表达。

#### Scenario: Use a narrow viewport

- **WHEN** 页面宽度为 375 px
- **THEN** 页面 SHALL 无横向滚动，主操作可到达，长文本不溢出容器

#### Scenario: Use a keyboard

- **WHEN** 用户以键盘操作核心流程
- **THEN** 焦点 SHALL 可见，链接和按钮 SHALL 有明确名称
