# 数据模型

最后更新：2026-09-24

## 1. 核心实体

| 实体                | 作用                       |
| ------------------- | -------------------------- |
| User                | 用户、密码摘要和角色       |
| Building            | 脱敏文物建筑档案           |
| BuildingRiskHistory | 建筑历史风险摘要           |
| Inspection          | 一次巡查及状态             |
| InspectionEvidence  | 巡查照片、附件和脱敏元数据 |
| Finding             | 结构化风险发现             |
| StandardDocument    | 规范文档元数据             |
| StandardClause      | 可检索和引用的规范条款     |
| FindingCitation     | 风险与规范条款的引用关系   |
| RectificationTask   | 整改任务、责任人和期限     |
| TaskEvidence        | 整改说明和证据             |
| ReviewRecord        | 人工确认、驳回和关闭记录   |
| AgentRun            | 一次智能体执行             |
| ModelCall           | Provider、模型、耗时和错误 |
| ToolCall            | 工具参数、结果和状态       |
| AuditLog            | 关键业务操作审计           |

## 2. 状态机

```text
Inspection:
draft -> submitted -> analyzing -> pending_review
      -> rectifying -> pending_closure -> closed
      -> rejected

Finding:
proposed -> confirmed -> rejected -> resolved

RectificationTask:
open -> in_progress -> pending_review -> closed
     -> rejected
```

## 3. 约束

- 关闭任务必须有人工 ReviewRecord。
- FindingCitation 必须指向现存 StandardClause。
- 已关闭记录不可物理删除，只能新增修正记录。
- 图片必须记录来源、授权类型和脱敏状态。
- 所有状态变化记录操作者和时间。
