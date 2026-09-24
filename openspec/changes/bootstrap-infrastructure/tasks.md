## 1. 工具链与版本控制

- [x] 1.1 固定 TypeScript 6.0.3 并更新锁文件，验证 `npm install` 成功
- [x] 1.2 添加 Prettier 配置和忽略规则，验证 `npm run format:check` 通过
- [x] 1.3 验证 `npm run lint`、`npm run typecheck` 全部通过

## 2. 环境与数据库

- [x] 2.1 创建本地 `.env` 且确认未进入 Git，验证 `git check-ignore .env` 成功
- [x] 2.2 启动 Docker PostgreSQL 并等待健康状态，验证 `docker compose ps` 显示 healthy
- [x] 2.3 生成首个 Prisma migration，验证 `prisma/migrations` 存在且可重复应用
- [x] 2.4 执行种子数据，验证四类账号、三栋建筑和规范条款已写入数据库

## 3. 测试与 CI

- [x] 3.1 添加知识检索和 Agent Schema 单元测试，验证 `npm test` 通过
- [x] 3.2 添加 PostgreSQL 集成测试，验证服务和状态流转在干净数据库上通过
- [x] 3.3 添加 GitHub Actions CI，验证工作流包含安装、检查、测试和构建
- [x] 3.4 修复测试配置警告，验证测试输出无配置错误

## 4. 最小闭环验证

- [x] 4.1 验证生产构建成功，记录 `npm run build` 结果
- [x] 4.2 启动开发服务器，验证登录页可访问
- [x] 4.3 使用演示巡查账号完成巡查提交和智能分析
- [x] 4.4 使用复核账号确认风险并创建整改任务
- [x] 4.5 使用整改账号提交证据，使用复核账号关闭任务
- [x] 4.6 检查浏览器控制台、服务日志和数据库状态，无阻塞错误

## 5. 文档与收尾

- [x] 5.1 更新 README、AGENTS 和 PROJECT_STATE 的真实命令与验证状态
- [x] 5.2 执行 OpenSpec `validate`，验证基础设施变更完整
- [x] 5.3 审查 Git diff 和忽略文件，排除密钥、构建物和临时文件
- [ ] 5.4 完成基础设施里程碑提交，验证工作树状态已记录
