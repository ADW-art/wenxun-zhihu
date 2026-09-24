## Why

项目已经完成需求和方案确认，但 Git、OpenSpec、环境变量、数据库迁移、Lint、测试和 CI 尚未达到可复现开发标准。先完成基础设施，才能安全继续页面和智能体功能开发。

## What Changes

- 初始化 Git 仓库和 OpenSpec 项目结构。
- 固定兼容的 Node、npm、TypeScript 和依赖版本。
- 建立格式、Lint、类型检查、单元测试、集成测试、构建和 CI 命令。
- 建立本地环境变量、Docker PostgreSQL、Prisma 迁移和种子数据。
- 验证文档、数据库、认证、Agent 服务、页面骨架和最小纵向闭环。
- 更新项目状态和交接文档。

本次变更不新增业务能力规格，只修复工程基础设施和可复现验证流程。

## Capabilities

### New Capabilities

无。本次变更仅修复工程基础设施，不改变已确认的产品行为。

### Modified Capabilities

无。

## Impact

- 影响 `package.json`、依赖锁文件、ESLint、Prettier、Vitest、GitHub Actions、Docker、Prisma 和环境配置。
- 影响所有开发、测试、构建和部署命令。
- 不改变页面、API、智能体工具或数据模型的已确认业务语义。
