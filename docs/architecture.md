# Architecture

## 核心设计

- 前端采用 Next.js App Router，服务端拉取 SEO 页面数据，客户端只承担交互式规划表单、地图和局部重规划。
- 后端采用 NestJS 模块化结构，统一使用 Zod schema 做请求与响应的双向校验。
- 规划能力采用“规则优先 + 可选 LLM 解释增强”，规则层负责可执行性，LLM 只负责摘要、亮点和自然语言 refinement。
- 数据层使用 Prisma + PostgreSQL，所有可展示实体必须携带来源、审核状态与更新时间。

## 模块拆分

### `packages/shared`
- 统一领域类型
- Zod schema
- 常量枚举

### `packages/planner`
- 用户意图标准化
- 候选召回与过滤
- 评分
- 行程拼装
- 预算、warning、sources 汇总

### `packages/data`
- Prisma schema
- seed 数据
- 数据访问工具

### `apps/api`
- 资源查询接口
- 规划接口
- 分享与反馈
- 后台 CRUD

### `apps/web`
- SEO 页面
- 结果页
- 后台维护页
- 分享落地页

## 运行方式

- 本地开发：`pnpm dev`
- 数据依赖：PostgreSQL + Redis，通过 Docker Compose 启动
- 生产部署：推荐 Docker Compose + Nginx 反向代理
