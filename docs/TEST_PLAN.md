# 测试计划

最后更新：2026-09-24

## 1. 测试层级

| 层级       | 工具                         | 范围                                  |
| ---------- | ---------------------------- | ------------------------------------- |
| 静态检查   | ESLint、TypeScript、Prettier | 语法、类型、格式和常见错误            |
| 单元测试   | Vitest                       | Schema、状态机、检索、权限和 Provider |
| 集成测试   | Vitest + PostgreSQL          | API、数据库事务、Agent Run 和工具调用 |
| Agent 评测 | Vitest + 固定数据集          | 任务完成、引用、幻觉、工具选择和降级  |
| 端到端冒烟 | Playwright CLI               | 登录、巡查、复核和任务关闭            |
| 构建验证   | Next.js build                | 生产构建和路由可编译                  |

## 2. 核心测试场景

- 巡查人员正常创建和提交巡查。
- 非授权用户无法确认风险或关闭任务。
- 知识库引用不存在时输出信息不足。
- 风险确认后才能创建整改任务。
- 整改证据不完整时被驳回。
- 重新提交后可以复核关闭。
- Provider 超时后使用 Mock 降级结果。
- Prompt Injection 文本不能修改工具权限或系统规则。
- 文件名、MIME 类型和大小不符合规则时被拒绝。
- 删除定位信息后上传成功。

## 3. 命令

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

## 4. 通过条件

- 静态检查和构建零错误。
- 核心业务单元测试通过。
- 集成测试在干净 PostgreSQL 数据库上通过。
- Agent 评测达到 [EVAL_PLAN.md](EVAL_PLAN.md) 的阈值。
- 浏览器冒烟流程无阻塞、无控制台错误。
