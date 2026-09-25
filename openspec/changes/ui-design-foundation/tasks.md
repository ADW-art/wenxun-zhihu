## 1. UI 事实源与业务档案

- [x] 1.1 新增 `docs/ui/UI_PROJECT_PROFILE.md`，记录“文物建筑智能巡查与保护整改智能体”定位、四类角色、核心流程、设备范围、安全边界和待确认项，并通过文档交叉检查确认与现有需求一致
- [x] 1.2 新增 `docs/ui/UI_DESIGN_SYSTEM.md`，记录 Token 分层、核心组件状态、Figma 页面结构和 Figma-to-code 映射，并确认每项均有代码或设计目标
- [x] 1.3 新增 `docs/ui/UI_DECISIONS_AND_QA.md`，记录调研来源、设计决策、验收矩阵、未验证项和恢复动作
- [x] 1.4 更新 `README.md`、`docs/UI_SPEC.md` 和 `docs/UX_FLOW.md` 的权威入口，确认文档没有相互矛盾的当前事实

## 2. 代码 Token 与基础组件

- [x] 2.1 新增 `src/app/tokens.css` 并接入 `src/app/globals.css`，运行 `npm run build` 验证 Tailwind CSS v4 能解析全部语义 Token 和兼容别名
- [x] 2.2 迁移 `Button`、`Input`、`Textarea`、`Select`、`Card`、`StatusBadge` 和 `RiskBadge` 到语义 Token，运行 `rg` 检查共享组件不再直接使用 Tailwind 默认状态色
- [x] 2.3 补齐共享组件的 Focus、Disabled、Loading、Error 和 Read-only 适用样式，运行 `npm run typecheck` 与现有组件测试验证 Props 和渲染没有回归

## 3. 基础设施验证

- [x] 3.1 运行 `openspec validate ui-design-foundation --strict`，确认 proposal、spec、design 和 tasks 结构有效
- [x] 3.2 运行 `npm run format:check`、`npm run lint`、`npm run typecheck`、`npm test` 和 `npm run build`，记录全部结果
- [x] 3.3 启动本地应用，检查登录页和已实现工作区在 1440 × 1024 与 375 × 812 下无横向滚动、文字溢出或明显控制台错误
- [x] 3.4 更新 `docs/PROJECT_STATE.md`，审查 `git diff`、未跟踪文件和剩余限制，确认没有提交密钥、Figma 文件覆盖或范围外改动

## 4. Figma 引导清单与自动门禁

- [x] 4.1 新增 `design/figma/ui-foundation.manifest.json`，记录页面、Variables、组件和核心页面，运行 `npm run ui:check` 验证与 CSS Token 一致
- [x] 4.2 把 `npm run ui:check` 接入 `package.json` 和 GitHub Actions，运行格式、类型检查和 UI 契约检查确认 CI 配置有效
- [x] 4.3 限制 Vitest 只扫描 `src` 下的测试文件，排除 `.next`、构建产物和覆盖率目录，运行 `npm test` 验证构建产物不会被误收集

## 5. 授权 Figma 文件基础写入

- [x] 5.1 读取当前 Figma 文件并确认只有空 `Page 1`，没有覆盖或删除既有内容
- [x] 5.2 创建 `00` 至 `08` 共 9 个标准页面，并通过 `get_pages` 核对名称与顺序
- [x] 5.3 创建 `Semantic/Color`、`Semantic/Space`、`Semantic/Radius` 三个集合的 60 个 Variables
- [x] 5.4 通过 `get_variable_defs` 核对 3 个集合、60 个变量和 0 个缺失值
