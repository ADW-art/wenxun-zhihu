## Purpose

让巡查人员和整改责任人能够提交可追溯、受限制且不会泄露定位元数据的现场与整改文件证据。

## ADDED Requirements

### Requirement: Evidence upload validation

系统 SHALL 只接受 JPG、PNG、WebP、PDF 和 TXT 文件，并且单个文件 MUST 不超过 8 MB。

#### Scenario: Valid image upload

- **WHEN** 用户提交允许类型且不超过 8 MB 的图片
- **THEN** 系统 SHALL 保存图片并记录原始文件名、类型和大小

#### Scenario: Unsupported file upload

- **WHEN** 用户提交不受支持的文件类型
- **THEN** 系统 MUST 拒绝上传并返回可理解的错误

### Requirement: Metadata removal

系统 SHALL 将图片转换为 WebP 并移除 EXIF 定位元数据。

#### Scenario: Image with EXIF

- **WHEN** 用户上传包含 EXIF 的图片
- **THEN** 系统 SHALL 保存移除元数据后的 WebP 文件
- **AND** 记录 `exifStripped=true`

### Requirement: Safe evidence access

系统 SHALL 通过受控文件路径读取证据，并且 MUST 拒绝路径穿越。

#### Scenario: Path traversal attempt

- **WHEN** 请求路径试图跳出上传根目录
- **THEN** 系统 MUST 返回校验错误，不得读取根目录之外的文件

### Requirement: Evidence traceability

巡查证据和整改证据 SHALL 记录提交人、来源类型、原文件名、MIME 类型和大小。

#### Scenario: Evidence metadata is stored

- **WHEN** 文件证据成功提交
- **THEN** 系统 SHALL 在业务记录中保存可追溯的元数据
