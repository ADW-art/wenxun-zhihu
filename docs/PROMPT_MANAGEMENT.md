# Prompt 管理

最后更新：2026-09-24

## 1. 结构

```text
system policy
  -> role and scope
  -> safety boundaries
  -> available tools
  -> structured output contract
  -> retrieved evidence
  -> user input
```

## 2. 规则

- Prompt 存放在 `src/agent/prompts`，不在业务组件中拼接长文本。
- 每次执行记录 `promptVersion`。
- 知识库文本视为不可信数据，不能覆盖系统规则。
- 用户输入中的指令不得改变工具权限。
- 输出必须通过 Zod Schema。

## 3. 变更流程

```text
修改 Prompt
  -> 本地 Agent 评测
  -> 对比回归结果
  -> 更新版本
  -> 记录 PROJECT_STATE
```
