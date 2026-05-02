# 配置说明

本文档说明项目运行和部署时需要关注的环境变量。复制 `.env.example` 为 `.env` 后，根据本地开发或服务器部署场景修改即可。

```bash
cp .env.example .env
```

## 1. 应用基础配置

| 变量 | 示例 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `NODE_ENV` | `development` / `production` | 是 | 运行环境。生产部署建议使用 `production`。 |
| `WEB_PORT` | `3000` | 是 | Web 容器内部监听端口。 |
| `API_PORT` | `3001` | 是 | API 容器内部监听端口。 |
| `WEB_PUBLISH` | `3000:3000` | 是 | Docker Compose 端口映射。生产环境可改成 `127.0.0.1:3000:3000` 后由 Nginx 转发。 |
| `API_PUBLISH` | `127.0.0.1:3001:3001` | 是 | API 端口映射。建议仅本机监听，避免直接暴露后端。 |
| `NEXT_PUBLIC_SITE_URL` | `https://qiuyu.online` | 是 | 网站公网地址，用于 SEO、分享链接和站点地图。 |
| `NEXT_PUBLIC_API_BASE_URL` | `http://api:3001/api/v1` | 是 | 前端访问后端 API 的基础地址。Docker 内部部署建议使用 `http://api:3001/api/v1`。 |

本地开发常用配置：

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

服务器部署常用配置：

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_API_BASE_URL=http://api:3001/api/v1
WEB_PUBLISH=127.0.0.1:3000:3000
API_PUBLISH=127.0.0.1:3001:3001
```

## 2. 地图配置

| 变量 | 示例 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_MAP_PROVIDER` | `maplibre` | 是 | 地图模式。推荐使用 `maplibre`。 |
| `NEXT_PUBLIC_MAPLIBRE_STYLE_URL` | `https://tiles.openfreemap.org/styles/liberty` | 是 | MapLibre 样式地址。默认使用 OpenFreeMap 开源底图。 |

如果暂时不想加载真实地图，可以使用示意地图：

```env
NEXT_PUBLIC_MAP_PROVIDER=schematic
```

## 3. 数据库与缓存

| 变量 | 示例 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:postgres@db:5432/handan_travel` | 是 | PostgreSQL 连接地址。Docker 部署时 host 通常是 `db`。 |
| `REDIS_URL` | `redis://redis:6379` | 是 | Redis 连接地址。Docker 部署时 host 通常是 `redis`。 |
| `DB_PUBLISH` | `127.0.0.1:5432:5432` | 否 | 数据库端口映射。生产环境建议仅本机监听。 |
| `REDIS_PUBLISH` | `127.0.0.1:6379:6379` | 否 | Redis 端口映射。生产环境建议仅本机监听。 |

本地开发常用配置：

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/handan_travel
REDIS_URL=redis://localhost:6379
```

Docker 部署常用配置：

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/handan_travel
REDIS_URL=redis://redis:6379
```

## 4. 后台账号

| 变量 | 示例 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `ADMIN_USERNAME` | `admin` | 是 | 后台登录用户名。 |
| `ADMIN_PASSWORD` | `change_me_to_a_strong_password` | 是 | 后台登录密码。生产环境必须改成高强度密码。 |

后台地址：

```text
/admin
```

安全建议：

- 不要使用 `.env.example` 中的默认密码。
- 不要把 `.env` 上传到 GitHub。
- 如果后台要长期开放，建议叠加 Nginx IP 白名单或基础访问限制。

## 5. AI 路线规划

| 变量 | 示例 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `PLANNER_USE_LLM` | `true` / `false` | 是 | 是否启用 LLM 参与路线规划。 |
| `ARK_API_KEY` | 留空或填真实 key | 否 | 火山方舟 API Key。启用 LLM 时需要填写。 |
| `ARK_BASE_URL` | `https://ark.cn-beijing.volces.com/api/v3` | 是 | 火山方舟兼容接口地址。 |
| `ARK_MODEL` | `doubao-seed-2-0-mini-260215` | 是 | 路线规划使用的文本模型。 |
| `LLM_TIMEOUT_MS` | `30000` | 是 | LLM 调用超时时间。 |

如果没有模型 key，可以保持：

```env
PLANNER_USE_LLM=false
ARK_API_KEY=
```

此时系统会使用规则规划引擎生成路线，基础功能仍然可用。

如果启用模型：

```env
PLANNER_USE_LLM=true
ARK_API_KEY=你的火山方舟APIKey
ARK_MODEL=doubao-seed-2-0-mini-260215
```

## 6. 语音导游

| 变量 | 示例 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `VOICE_REALTIME_APP_ID` | 留空或填真实 App ID | 否 | 豆包端到端实时语音应用 ID。 |
| `VOICE_REALTIME_API_KEY` | 留空或填真实 key | 否 | 豆包端到端实时语音 API Key。 |
| `VOICE_REALTIME_BASE_URL` | `wss://openspeech.bytedance.com/api/v3/realtime/dialogue` | 是 | 实时语音 WebSocket 地址。 |
| `VOICE_REALTIME_MODEL` | `1.2.1.1` | 是 | 端到端实时语音模型版本。 |
| `VOICE_REALTIME_RESOURCE_ID` | `volc.speech.dialog` | 是 | 火山实时语音资源 ID。 |
| `VOICE_REALTIME_APP_KEY` | 按平台文档填写 | 是 | 火山语音应用 Key。 |
| `VOICE_TYPE` | `zh_female_vv_jupiter_bigtts` | 是 | 语音音色。 |
| `VOICE_TIMEOUT_MS` | `25000` | 是 | 语音接口超时时间。 |

没有实时语音 key 时：

- 文本问答仍然可用。
- 前端会根据浏览器能力使用可用的语音兜底能力。

启用实时语音时：

```env
VOICE_REALTIME_APP_ID=你的AppID
VOICE_REALTIME_API_KEY=你的APIKey
VOICE_REALTIME_BASE_URL=wss://openspeech.bytedance.com/api/v3/realtime/dialogue
VOICE_REALTIME_MODEL=1.2.1.1
VOICE_REALTIME_RESOURCE_ID=volc.speech.dialog
```

## 7. 日志与监控

| 变量 | 示例 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `LOG_LEVEL` | `info` | 否 | 后端日志级别。 |
| `SENTRY_DSN` | 留空或填真实 DSN | 否 | 接入 Sentry 时填写。 |

## 8. 推荐配置清单

本地开发：

```env
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/handan_travel
REDIS_URL=redis://localhost:6379
PLANNER_USE_LLM=false
```

服务器部署：

```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_API_BASE_URL=http://api:3001/api/v1
WEB_PUBLISH=127.0.0.1:3000:3000
API_PUBLISH=127.0.0.1:3001:3001
DATABASE_URL=postgresql://postgres:postgres@db:5432/handan_travel
REDIS_URL=redis://redis:6379
NEXT_PUBLIC_MAP_PROVIDER=maplibre
NEXT_PUBLIC_MAPLIBRE_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
ADMIN_USERNAME=admin
ADMIN_PASSWORD=请改成强密码
```

