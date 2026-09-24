## Why

正式 UI 尚未交付，但核心业务闭环需要先完整可用。当前巡查和整改只支持文字，缺少文件证据和可下载报告，无法覆盖真实巡查场景。

## What Changes

- 新增巡查附件和整改证据文件上传。
- 支持 JPG、PNG、WebP、PDF、TXT，限制 8 MB。
- 图片转换为 WebP 并移除 EXIF。
- 新增受路径校验保护的本地文件读取接口。
- 新增 Markdown 巡查报告生成和下载。
- 扩展数据库集成测试，覆盖附件、证据和报告。

## Capabilities

### New Capabilities

- `inspection-evidence`: 巡查和整改文件证据的上传、存储、访问和元数据规则。
- `inspection-report-export`: 基于巡查、风险、规范、整改和复核数据生成可下载报告。

### Modified Capabilities

无。

## Impact

- 新增 `sharp` 依赖和本地文件存储模块。
- 新增 `/api/files` 和 `/api/reports/:id/export`。
- 修改新建巡查、巡查详情和整改任务页面。
- 本地默认文件目录为 `uploads/`，该目录不进入 Git。
