# 智能体契约

最后更新：2026-09-24

## 1. 智能体职责

单个编排智能体负责理解巡查信息、制定计划、检索规范、形成结构化风险、生成整改建议、初审证据和生成报告。

## 2. 输入

```json
{
  "building": {
    "id": "building_demo_01",
    "type": "timber_historical_building",
    "era": "qing",
    "usage": "museum",
    "riskTags": ["fire", "damp"]
  },
  "inspection": {
    "season": "autumn",
    "weather": "heavy_rain",
    "text": "正殿东侧排水不畅，墙脚潮湿",
    "values": {}
  },
  "evidence": [],
  "history": []
}
```

## 3. 输出

```json
{
  "plan": [],
  "findings": [],
  "citations": [],
  "uncertainties": [],
  "suggestedTasks": []
}
```

## 4. 权限边界

- 可以读取建筑、巡查、证据和规范。
- 可以提出 Finding 和 Task 草案。
- 不得直接确认风险、审批证据或关闭任务。
- 不得执行删除、修改权限或修改知识库操作。

## 5. 停止条件

- 输入缺少必要字段时返回校验错误。
- 没有可靠条款时标记信息不足，不生成确定性结论。
- 工具连续失败或 Provider 超时后返回降级结果。
- 检测到越权或注入尝试时停止工具调用并记录审计事件。

## 6. 失败处理

- Schema 失败：修复一次，仍失败则返回错误。
- Provider 失败：使用 Mock Provider。
- 检索失败：使用预置条款集合并标记检索降级。
- 工具失败：不修改业务状态，返回可重试错误。
