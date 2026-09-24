## 1. DeepSeek Provider

- [x] 1.1 增加 DeepSeek 环境变量和 Provider 类型，验证类型检查通过
- [x] 1.2 实现 DeepSeek JSON Output 分析适配器，验证单元测试通过
- [x] 1.3 实现候选条款引用白名单校验，验证伪造引用被拒绝
- [x] 1.4 实现真实 Provider 失败后的 Mock 自动降级，验证降级状态被记录
- [x] 1.5 在本地 `.env` 填入真实 Key 并完成一次真实 API 调用，验证返回 Provider 为 `deepseek`

## 2. MCP Server

- [x] 2.1 使用官方 MCP v2 SDK 建立 `wenxun-mcp-server`，验证 stdio 初始化成功
- [x] 2.2 实现建筑列表和建筑详情工具，验证只读查询返回结构化结果
- [x] 2.3 实现规范检索工具，验证返回条款来源、相关性和匹配原因
- [x] 2.4 实现巡查分析预览工具，验证不写入数据库
- [x] 2.5 实现巡查报告和整改任务查询工具，验证分页和过滤
- [x] 2.6 为所有工具增加严格 Zod Schema 和 Tool Annotations
- [x] 2.7 使用官方 MCP Client 测试工具发现、调用和无效参数拒绝

## 3. 验证与文档

- [x] 3.1 添加 DeepSeek Provider 单元测试，验证 `npm test` 通过
- [x] 3.2 添加 MCP stdio 集成测试，验证完整测试套件通过
- [x] 3.3 添加 `npm run mcp:dev` 和 `npm run mcp:inspect` 命令
- [x] 3.4 更新 Provider 矩阵、工具注册表和项目状态
- [x] 3.5 完成真实 DeepSeek 调用后归档本变更并创建独立提交
