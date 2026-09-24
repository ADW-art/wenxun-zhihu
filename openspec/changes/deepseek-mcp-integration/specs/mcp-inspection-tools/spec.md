## Purpose

为支持 Model Context Protocol 的客户端提供文物建筑巡查、规范检索、风险分析预览和整改任务查询能力，使外部智能体能够安全复用文巡智护的业务数据与工具。

## ADDED Requirements

### Requirement: MCP server over stdio

系统 SHALL 提供名为 `wenxun-mcp-server` 的 MCP 服务，并支持通过 stdio transport 启动。

#### Scenario: MCP client initializes

- **WHEN** MCP 客户端启动服务并发送初始化请求
- **THEN** 服务 SHALL 返回服务器名称、版本和工具能力

### Requirement: Read-only building and inspection tools

MCP 服务 SHALL 提供建筑列表、建筑详情、巡查报告和整改任务查询工具，并且这些工具 MUST 为只读操作。

#### Scenario: Client lists buildings

- **WHEN** 客户端调用 `wenxun_list_buildings`
- **THEN** 系统 SHALL 返回分页建筑列表和结构化数据

#### Scenario: Client reads inspection report data

- **WHEN** 客户端调用 `wenxun_get_inspection`
- **THEN** 系统 SHALL 返回巡查、风险、引用、任务、证据和复核记录

### Requirement: Standards search tool

MCP 服务 SHALL 提供 `wenxun_search_standards` 工具，用于检索公开标准条款和项目演示规则。

#### Scenario: Search standards with risk tags

- **WHEN** 客户端提供巡查描述、风险标签和建筑类型
- **THEN** 系统 SHALL 返回按相关性排序的候选条款、来源和匹配原因

### Requirement: Inspection analysis preview

MCP 服务 SHALL 提供不写入数据库的巡查分析预览工具，并且结果 MUST 明确包含模型或降级状态。

#### Scenario: Preview analysis

- **WHEN** 客户端提供建筑、季节、天气和巡查文本
- **THEN** 系统 SHALL 返回检查计划、风险草案、规范引用和整改任务草案

#### Scenario: Preview must not mutate records

- **WHEN** 客户端调用分析预览工具
- **THEN** 系统 MUST 不创建或修改 Inspection、Finding 或 RectificationTask

### Requirement: Tool input validation

所有 MCP 工具 SHALL 使用严格输入 Schema，并且无效参数 MUST 在执行前被拒绝。

#### Scenario: Invalid pagination

- **WHEN** 客户端提交小于最小值或超出范围的分页参数
- **THEN** MCP 调用 SHALL 返回工具错误，不得执行数据库查询
