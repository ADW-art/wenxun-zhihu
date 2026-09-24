# MCP 服务说明

最后更新：2026-09-24

## 1. 服务定位

`wenxun-mcp-server` 将文物建筑、巡查、规范、整改任务和只读分析能力标准化暴露给支持 Model Context Protocol 的客户端。

当前只实现 stdio transport，适合 Codex 和本地开发工具使用。远程 Streamable HTTP、OAuth 和写入工具属于后续范围。

## 2. 启动与调试

```powershell
npm run mcp:dev
npm run mcp:inspect
```

Codex 项目级配置位于 `.codex/config.toml`。信任项目后，Codex 会启动 `wenxun-mcp-server`。

## 3. 工具

| 工具                              | 类型 | 作用                       |
| --------------------------------- | ---- | -------------------------- |
| `wenxun_list_buildings`           | 只读 | 分页查询建筑档案           |
| `wenxun_get_building`             | 只读 | 查询建筑历史风险和最近巡查 |
| `wenxun_search_standards`         | 只读 | 检索标准和项目规则         |
| `wenxun_analyze_inspection_text`  | 预览 | 运行不落库的智能分析       |
| `wenxun_get_inspection`           | 只读 | 获取完整巡查报告数据       |
| `wenxun_list_rectification_tasks` | 只读 | 分页查询整改任务           |

## 4. 安全边界

- 所有工具输入通过严格 Zod Schema 校验。
- 不接受任意文件路径、SQL 或外部 URL。
- 当前工具不得创建、修改、审批或关闭业务记录。
- 分析预览结果标记模型或降级状态，不代表人工确认。
- 精确坐标、安防信息和敏感地点不得通过工具返回。

## 5. 验证

```powershell
$env:RUN_INTEGRATION_TESTS="1"
npm test
```

集成测试通过官方 MCP Client 启动真实 stdio 子进程，验证工具发现、只读调用和无效参数拒绝。
