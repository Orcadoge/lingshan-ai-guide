# 部署手册

本文档说明如何把「赵都云旅 · 云端图鉴智行指南」部署到自己的服务器，并通过域名访问。

## 线上站点

当前演示站点：

- 网站地址：[https://qiuyu.online](https://qiuyu.online)
- AI 导游页：[https://qiuyu.online/guide](https://qiuyu.online/guide)
- 后台入口：`https://qiuyu.online/admin`

## 1. 服务器要求

推荐配置：

| 项目 | 建议 |
| --- | --- |
| 系统 | Ubuntu 22.04 LTS 或 Debian 12 |
| CPU | 2 vCPU 起步 |
| 内存 | 4 GB 起步 |
| 磁盘 | 40 GB 起步，建议开启快照或备份 |
| 必备软件 | Git、Docker、Docker Compose、Nginx |
| 开放端口 | `80`、`443` |

生产环境建议只把 Web/API 服务映射到 `127.0.0.1`，再由 Nginx 对外代理，避免数据库、Redis 和 API 端口直接暴露在公网。

## 2. 拉取项目

```bash
git clone https://github.com/hanabinano/handan-llm-travel.git
cd handan-llm-travel
cp .env.example .env
```

## 3. 修改环境变量

打开 `.env`：

```bash
nano .env
```

推荐生产配置：

```env
NODE_ENV=production
WEB_PORT=3000
API_PORT=3001
WEB_PUBLISH=127.0.0.1:3000:3000
API_PUBLISH=127.0.0.1:3001:3001
DB_PUBLISH=127.0.0.1:5432:5432
REDIS_PUBLISH=127.0.0.1:6379:6379

NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_API_BASE_URL=http://api:3001/api/v1
NEXT_PUBLIC_MAP_PROVIDER=maplibre
NEXT_PUBLIC_MAPLIBRE_STYLE_URL=https://tiles.openfreemap.org/styles/liberty

DATABASE_URL=postgresql://postgres:postgres@db:5432/handan_travel
REDIS_URL=redis://redis:6379

ADMIN_USERNAME=admin
ADMIN_PASSWORD=请改成强密码

PLANNER_USE_LLM=true
ARK_API_KEY=你的火山方舟APIKey
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_MODEL=doubao-seed-2-0-mini-260215
LLM_TIMEOUT_MS=30000
```

如果暂时没有模型 key：

```env
PLANNER_USE_LLM=false
ARK_API_KEY=
```

系统仍然可以使用规则规划能力生成路线。

完整变量说明见 [配置说明](./configuration.md)。

## 4. 启动服务

构建镜像：

```bash
docker compose build
```

启动数据库和缓存：

```bash
docker compose up -d db redis
```

启动后端和前端：

```bash
docker compose up -d api web
```

初始化数据库：

```bash
docker compose exec api pnpm --filter @handan/data db:migrate
docker compose exec api pnpm --filter @handan/data db:seed
```

查看容器状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f web
docker compose logs -f api
```

## 5. Nginx 反向代理

假设域名为 `your-domain.com`，创建配置：

```bash
sudo nano /etc/nginx/sites-available/handan-llm-travel
```

写入：

```nginx
server {
  listen 80;
  server_name your-domain.com www.your-domain.com;

  client_max_body_size 20m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/handan-llm-travel /etc/nginx/sites-enabled/handan-llm-travel
sudo nginx -t
sudo systemctl reload nginx
```

说明：

- 前端通过 `/api/proxy/...` 访问后端，通常只需要代理 Web 的 `3000` 端口。
- 如果你要单独暴露 API 域名，可以再配置一个 `api.your-domain.com` 指向 `127.0.0.1:3001`。

## 6. 配置 HTTPS

安装 Certbot：

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

申请证书：

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

检查自动续期：

```bash
sudo certbot renew --dry-run
```

HTTPS 生效后，把 `.env` 中的站点地址改成真实域名：

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

然后重建 Web：

```bash
docker compose build web
docker compose up -d web
```

## 7. 域名解析

在域名服务商处添加两条记录：

| 主机记录 | 类型 | 记录值 |
| --- | --- | --- |
| `@` | A | 你的服务器公网 IP |
| `www` | A | 你的服务器公网 IP |

解析可能需要几分钟到数小时生效。可以用下面命令检查：

```bash
dig your-domain.com +short
dig www.your-domain.com +short
```

## 8. 部署检查

后端健康检查：

```bash
curl http://127.0.0.1:3001/api/v1/health
```

前端检查：

```bash
curl -I http://127.0.0.1:3000
curl -I https://your-domain.com
```

页面检查：

- 首页可以正常打开。
- 首页顶部之后能看到 AI 路线规划对话框。
- 右上角 AI 导游页可在「语音导游」和「AI 路线规划」之间切换。
- 输入路线需求后能生成结果页。
- 结果页地图能显示路线点位。
- `/admin` 能用 `.env` 中配置的账号密码登录。

## 9. 更新部署

服务器上更新代码：

```bash
git pull
docker compose build web api
docker compose up -d web api
```

如果数据库结构或种子数据有更新：

```bash
docker compose exec api pnpm --filter @handan/data db:migrate
docker compose exec api pnpm --filter @handan/data db:seed
```

## 10. 备份建议

建议至少备份：

- PostgreSQL 数据卷
- `.env`
- Nginx 配置
- 证书配置

示例：

```bash
docker compose exec db pg_dump -U postgres handan_travel > handan_travel_backup.sql
```

恢复时：

```bash
cat handan_travel_backup.sql | docker compose exec -T db psql -U postgres handan_travel
```

## 11. 常见问题

### 页面能打开，但路线生成失败

检查 API 容器日志：

```bash
docker compose logs -f api
```

重点确认：

- `DATABASE_URL` 是否指向 `db:5432`
- 数据库是否已经执行 `db:migrate` 和 `db:seed`
- `NEXT_PUBLIC_API_BASE_URL` 是否为 `http://api:3001/api/v1`

### 地图不显示

检查：

- `NEXT_PUBLIC_MAP_PROVIDER=maplibre`
- `NEXT_PUBLIC_MAPLIBRE_STYLE_URL` 是否能从服务器和浏览器访问
- 浏览器控制台是否有网络请求失败

### 语音导游不能实时对话

检查：

- 网站是否使用 HTTPS
- 浏览器是否允许麦克风权限
- `VOICE_REALTIME_APP_ID` 和 `VOICE_REALTIME_API_KEY` 是否已配置
- 火山端到端实时语音服务是否已开通

### 后台登录失败

检查：

- `.env` 里的 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`
- Web 容器和 API 容器是否已经重启
- 浏览器是否缓存了旧账号密码
