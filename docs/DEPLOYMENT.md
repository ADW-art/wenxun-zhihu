# 部署说明

最后更新：2026-09-24

## 1. 本地

```powershell
Copy-Item .env.example .env
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## 2. Docker

```powershell
docker compose up -d postgres
docker build -t wenxun-zhihu .
docker run --env-file .env -p 3000:3000 wenxun-zhihu
```

## 3. 推荐公网方案

- 应用：Vercel 或 Docker 平台。
- 数据库：Neon、Supabase 或其他 PostgreSQL。
- 文件：S3 兼容对象存储。
- 模型：OpenAI 兼容 Provider。
- 域名：HTTPS 公网地址，提供评审测试账号。

## 4. 部署检查

- `AUTH_SECRET` 使用随机值。
- 生产数据库与演示数据库隔离。
- 迁移在部署前执行。
- 演示账号和密码写入设计文档，但不得使用真实个人密码。
- Provider 失败时可以切换 Mock。
- 上传目录或对象存储设置大小和类型限制。
