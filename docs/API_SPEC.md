# API 规格

最后更新：2026-09-24

## 1. 约定

- 路径前缀：`/api`
- 格式：JSON
- 认证：Auth.js HTTP-only session
- 输入输出：Zod Schema
- 错误结构：

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "当前用户无权执行此操作",
    "requestId": "req_..."
  }
}
```

## 2. 核心接口

| 方法 | 路径                           | 作用           | 角色             |
| ---- | ------------------------------ | -------------- | ---------------- |
| GET  | `/api/buildings`               | 获取建筑列表   | 已登录           |
| POST | `/api/inspections`             | 创建巡查       | 巡查人员、管理员 |
| GET  | `/api/inspections/:id`         | 获取巡查详情   | 已登录           |
| POST | `/api/inspections/:id/submit`  | 提交巡查       | 巡查人员         |
| POST | `/api/inspections/:id/analyze` | 执行智能分析   | 巡查人员、管理员 |
| POST | `/api/findings/:id/confirm`    | 确认风险       | 复核人员         |
| POST | `/api/findings/:id/tasks`      | 创建整改任务   | 复核人员         |
| POST | `/api/tasks/:id/evidence`      | 提交整改证据   | 责任人           |
| POST | `/api/tasks/:id/review`        | 通过或驳回整改 | 复核人员         |
| GET  | `/api/reports/:inspectionId`   | 获取报告数据   | 已登录           |

## 3. 状态码

- `400`：输入不符合 Schema。
- `401`：未登录。
- `403`：角色或资源权限不足。
- `404`：资源不存在或无权查看。
- `409`：状态机冲突。
- `422`：业务规则不满足。
- `503`：模型或外部服务不可用，可切换降级模式。
