<div align="center">

# 赵都云旅 · 云端图鉴智行指南

邯郸智能文旅小助手，面向游客提供 **AI 路线规划、语音导游、景点图鉴、美食推荐与地图路线展示**。

[![在线访问](https://img.shields.io/badge/在线访问-qiuyu.online-2f855a?style=for-the-badge)](https://qiuyu.online)
[![Next.js](https://img.shields.io/badge/Next.js-16-111827?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-API-e0234e?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![MapLibre](https://img.shields.io/badge/MapLibre-地图-396cb2?style=for-the-badge)](https://maplibre.org/)
[![Docker](https://img.shields.io/badge/Docker-部署-2496ed?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

## 在线演示

- 访问地址：[https://qiuyu.online](https://qiuyu.online)
- AI 导游页：[https://qiuyu.online/guide](https://qiuyu.online/guide)
- 后台入口：`/admin`

## 项目简介

本项目围绕邯郸文旅出行场景构建，目标是让游客用更自然的方式完成“想去哪、怎么走、吃什么、听什么讲解”的决策。首页提供城市文旅展示和路线规划入口，AI 导游页提供语音导游与路线规划两种模式，结果页会结合日程、景点、美食、地图和风险提示生成可参考的出行方案。


## 核心功能

| 模块 | 说明 |
| --- | --- |
| AI 路线规划 | 通过对话收集时间、同行人、兴趣和节奏，生成顺路、好吃、可执行的旅行路线。 |
| 语音导游 | 支持游客用语音或文字提问，获得景点故事、附近美食和路线建议。 |
| 图文结果页 | 展示每日行程、景点介绍、美食安排、预算、替代方案和注意事项。 |
| MapLibre 地图 | 使用开源地图能力展示真实点位和路线顺序，不依赖昂贵商业地图 key。 |
| 内容图鉴 | 提供邯郸景点、美食、主题玩法、经典路线和 FAQ 页面。 |
| 后台管理 | 支持管理员查看数据概览，并维护景点、餐饮和导游提示内容。 |
| Docker 部署 | 提供 Web、API、PostgreSQL、Redis 的 Docker Compose 部署方案。 |

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Next.js 16、React 19、Tailwind CSS、MapLibre GL |
| 后端 | NestJS、Zod、Prisma、PostgreSQL、Redis |
| AI 能力 | 火山方舟文本模型、豆包端到端实时语音能力、规则规划兜底 |
| 工程化 | pnpm workspace、Turborepo、Vitest、Playwright、Docker Compose |

## 目录结构

```text
apps/
  web        Next.js 前端站点
  api        NestJS 后端接口
packages/
  shared     Zod schema、类型、常量
  planner    路线规划规则引擎与结果组装
  data       Prisma schema、种子数据、仓储层
  prompts    LLM prompt 配置
  ui         前端共享 UI 组件
docs/
  api-integration.md   前后端 API 对接文档
  architecture.md      架构说明
  configuration.md     环境变量配置说明
  deployment.md        服务器部署手册
  progress.md          开发进度记录
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 准备环境变量

```bash
cp .env.example .env
```

如果只是本地演示，可以先保留默认值；如果要启用真实 AI 和语音能力，请参考 [配置说明](./docs/configuration.md) 填写模型 key、实时语音 App ID 等参数。

### 3. 启动数据库和缓存

```bash
docker compose up -d db redis
```

### 4. 初始化数据库

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. 启动开发服务

```bash
pnpm dev
```

默认访问：

- Web：http://localhost:3000
- API：http://localhost:3001/api/v1

## 常用命令

```bash
pnpm build       # 构建全部应用与包
pnpm lint        # 代码风格检查
pnpm typecheck   # TypeScript 类型检查
pnpm test        # 单元测试
pnpm test:e2e    # 端到端测试
```

## 生产部署

项目已支持 Docker Compose 部署。最短流程如下：

```bash
git clone https://github.com/hanabinano/handan-llm-travel.git
cd handan-llm-travel
cp .env.example .env
```

编辑 `.env` 后执行：

```bash
docker compose build
docker compose up -d db redis
docker compose up -d api web
docker compose exec api pnpm --filter @handan/data db:migrate
docker compose exec api pnpm --filter @handan/data db:seed
```

部署完成后建议通过 Nginx 反向代理到域名，并配置 HTTPS。完整步骤见 [部署手册](./docs/deployment.md)。

## 环境变量

关键配置分为六类：

- 应用地址：`NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_API_BASE_URL`
- 地图：`NEXT_PUBLIC_MAP_PROVIDER`、`NEXT_PUBLIC_MAPLIBRE_STYLE_URL`
- 数据库与缓存：`DATABASE_URL`、`REDIS_URL`
- 后台登录：`ADMIN_USERNAME`、`ADMIN_PASSWORD`
- AI 路线规划：`ARK_API_KEY`、`ARK_MODEL`、`PLANNER_USE_LLM`
- 实时语音：`VOICE_REALTIME_APP_ID`、`VOICE_REALTIME_API_KEY`

详细说明见 [配置说明](./docs/configuration.md)。

## 文档索引

- [API 对接文档](./docs/api-integration.md)
- [系统架构说明](./docs/architecture.md)
- [环境变量配置](./docs/configuration.md)
- [服务器部署手册](./docs/deployment.md)
- [开发进度记录](./docs/progress.md)

## 安全提示

- 不要提交 `.env`、真实 API key、服务器密码或 GitHub Token。
- 仓库中的 `.env.example` 只保留占位值。
- 如果 token 曾经出现在聊天、截图或日志里，请立即在平台后台删除并重新生成。
