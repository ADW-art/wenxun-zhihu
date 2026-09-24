# 模型与 Provider 矩阵

最后更新：2026-09-24

当前选择 DeepSeek 作为首个真实 Provider。实现仍只依赖能力接口，不把供应商名称扩散到业务逻辑。

| Provider          | 用途                     | 状态   | 约束                                                       |
| ----------------- | ------------------------ | ------ | ---------------------------------------------------------- |
| Mock              | 本地开发、测试、现场降级 | 已实现 | 确定性结果，不代表真实模型能力                             |
| DeepSeek          | 真实结构化巡查分析       | 已验证 | 使用 Flash 模型、OpenAI 兼容接口、JSON Output 和引用白名单 |
| OpenAI-compatible | 其他兼容模型通用接入     | 预留   | 必须支持结构化输出或可靠 JSON 模式                         |
| Ollama            | 本地量化模型降级         | 可选   | 8 GB 显存只运行小参数模型                                  |

## DeepSeek 配置

```text
AGENT_PROVIDER="deepseek"
AGENT_MODEL="deepseek-v4-flash"
AGENT_BASE_URL="https://api.deepseek.com"
DEEPSEEK_API_KEY="仅保存在本地 .env"
```

当密钥为空、调用超时、返回空内容或输出结构不合法时，系统自动回退 Mock Provider，并把 Agent Run 标记为降级。

## 必需能力

- 文本生成。
- 结构化 JSON 输出。
- 可选工具调用。
- 超时、取消和错误归一化。
- 使用量、耗时和 Provider 元数据记录。

## 选择条件

1. 中文文保知识理解稳定。
2. 支持工具调用和 JSON Schema。
3. 允许公网部署调用。
4. 延迟和成本满足演示。
5. API Key 可由环境变量注入。
