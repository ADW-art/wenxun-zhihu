## Context

当前仓库已有产品文档、Next.js 工程骨架、Prisma Schema、Agent 抽象和部分页面，但缺少可复现基础设施验证。Docker Desktop 未运行，数据库尚未迁移，TypeScript 7 与 ESLint 生态不兼容，且没有测试文件和 CI。

## Goals / Non-Goals

**Goals:**

- 让新环境可以按 README 命令安装、启动、迁移、测试和构建。
- 让 Git、OpenSpec、格式、Lint、测试和 CI 成为持续开发门槛。
- 验证 PostgreSQL、Prisma、认证和 Agent 最小闭环确实可运行。
- 保留已有文档和代码，不回滚已有设计。

**Non-Goals:**

- 不在本变更中接受 UI 设计稿或重做视觉页面。
- 不接入真实大模型 API、对象存储或公网部署平台。
- 不扩展产品功能范围。

## Decisions

### TypeScript 6 而不是 TypeScript 7

- 选择：固定 TypeScript `6.0.3`。
- 原因：当前 Next.js 的 `typescript-eslint` 明确不支持 TypeScript 7，Lint 无法运行。
- 备选：移除类型感知 Lint。拒绝，因为会降低代码质量门槛。

### PostgreSQL 与 Prisma 迁移

- 选择：使用 Docker Compose 启动 PostgreSQL 17，使用 Prisma migration 和 seed 建立可重复数据库。
- 原因：与已确认架构一致，且比临时 SQLite 更接近生产。
- 备选：SQLite 开发模式。拒绝，因为会导致部署行为差异和迁移返工。

### 统一质量命令

- 选择：`format:check -> lint -> typecheck -> test -> build` 作为统一检查链。
- 原因：与构建指南和未来 CI 一致，命令可本地复现。
- 备选：只跑构建。拒绝，因为无法覆盖权限、Schema 和 Agent 回归。

### OpenSpec 仅管理变更，不替代长期文档

- 选择：OpenSpec 记录本次基础设施变更；长期事实继续保存在 `docs/`。
- 原因：避免规格与项目文档重复，符合构建指南的单一真相源原则。

### CI 使用 PostgreSQL 服务

- 选择：GitHub Actions 中启动 PostgreSQL，执行 Prisma 生成、类型检查、测试和构建。
- 原因：验证干净的持续集成环境，而不是依赖开发者本机状态。
- 备选：仅执行静态检查。拒绝，因为无法证明数据库集成。

## Risks / Trade-offs

- [Docker Desktop 未运行] → 尝试启动并等待健康检查；如果仍不可用，记录为未验证并保留命令。
- [Prettier 会修改大量文件] → 忽略用户原始指南和生成目录，只格式化项目文件，并审查 diff。
- [Next.js 构建阶段访问数据库] → 使用明确的动态渲染边界和 CI PostgreSQL 服务；构建失败时修正而不是跳过。
- [OpenSpec 工具升级导致格式变化] → 固定当前 CLI 版本行为，并在文档记录；不把 OpenSpec 加到运行时依赖。

## Migration Plan

1. 初始化 Git 和 OpenSpec。
2. 修复依赖、格式和 Lint 配置。
3. 启动 PostgreSQL，生成首个 Prisma migration。
4. 执行种子数据并运行最小闭环测试。
5. 运行完整检查链和浏览器冒烟验证。
6. 提交基础设施里程碑。

回滚策略：删除新增基础设施变更并恢复到本变更前的提交；数据库可删除本地 Docker volume 后重新初始化，不触碰生产环境。

## Open Questions

- 真实模型 Provider 和公网部署平台仍未确定，但不阻塞本次基础设施完成。
