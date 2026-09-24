## Purpose

让巡查结果能够以稳定、可下载、可验证的报告形式交付，并完整保留风险、规范依据、整改证据和人工复核记录。

## ADDED Requirements

### Requirement: Inspection report generation

系统 SHALL 根据巡查记录生成包含建筑、风险、规范引用、整改任务、证据和人工复核记录的报告。

#### Scenario: Export a completed inspection

- **WHEN** 已授权用户请求导出巡查报告
- **THEN** 系统 SHALL 返回带文件名的 Markdown 下载

#### Scenario: Smart agent boundary is visible

- **WHEN** 报告包含智能体分析结果
- **THEN** 报告 MUST 说明智能体结果仅作为辅助信息
- **AND** 最终结论以专业人员复核为准

### Requirement: Missing record handling

系统 SHALL 在巡查不存在或不可访问时返回明确错误，不得生成空报告。

#### Scenario: Unknown inspection

- **WHEN** 用户请求不存在的巡查报告
- **THEN** 系统 SHALL 返回未找到错误
