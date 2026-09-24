## Purpose

为巡查智能体提供可替换的真实大模型 Provider，使系统能够在保留结构化约束、来源校验和降级能力的同时使用 DeepSeek 完成巡查分析。

## ADDED Requirements

### Requirement: DeepSeek structured inspection analysis

系统 SHALL 支持通过 DeepSeek OpenAI 兼容接口生成巡查分析结果，并且结果 MUST 符合既有结构化 Schema。

#### Scenario: Valid DeepSeek response

- **WHEN** DeepSeek 返回符合约定结构的 JSON
- **THEN** 系统 SHALL 保存计划、风险草案、不确定项和整改任务草案

#### Scenario: Invalid DeepSeek response

- **WHEN** DeepSeek 返回无法通过 Schema 校验的内容
- **THEN** 系统 MUST 将该次分析视为失败并记录错误

### Requirement: Citation allowlist

DeepSeek 生成的每个风险引用 MUST 来自本次请求提供的候选规范条款。

#### Scenario: Citation is in allowlist

- **WHEN** 风险引用使用候选条款中的 clauseId
- **THEN** 系统 SHALL 接受该引用并保留来源信息

#### Scenario: Citation is outside allowlist

- **WHEN** 风险引用使用未提供的 clauseId
- **THEN** 系统 MUST 拒绝该次结果，不得把该引用写入数据库

### Requirement: Provider fallback

真实 Provider 调用失败时，系统 SHALL 自动切换到 Mock Provider，并明确标记结果为降级模式。

#### Scenario: DeepSeek timeout

- **WHEN** DeepSeek 请求超时或返回服务错误
- **THEN** 系统 SHALL 使用 Mock Provider 生成可继续演示的结果
- **AND** Agent Run MUST 标记为降级状态

### Requirement: Provider observability

系统 SHALL 记录 Provider 名称、模型名称、调用耗时、Token 用量、Prompt 版本和工具 Schema 版本。

#### Scenario: Successful provider call

- **WHEN** DeepSeek 分析成功
- **THEN** 系统 SHALL 写入 Provider、Model、延迟和可用 Token 用量
