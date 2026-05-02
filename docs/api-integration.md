# API Integration Guide

## 1. Base URLs

当前项目有两种可用的接口接入方式：

- 同站点代理地址（推荐前端直接使用）：
  - `https://qiuyu.online/api/proxy`
- 服务器本机 API 地址（仅服务器本机可访问）：
  - `http://127.0.0.1:3101/api/v1`

说明：

- 如果你的前端和当前站点部署在同一台服务器，优先使用 `/api/proxy`。
- 如果你的前端部署在别的机器或别的域名下，当前不能直接从公网访问 `3101`，需要后续再挂到 `nginx /api/`。

## 2. Auth

公开接口不需要鉴权。

后台接口需要 `Basic Auth`：

- 用户名：`admin`
- 密码：使用 `.env` 中配置的 `ADMIN_PASSWORD`

请求头格式：

```http
Authorization: Basic <base64(username:password)>
```

示例：

```bash
curl -u 'admin:你的后台密码' \
  https://qiuyu.online/api/proxy/admin/overview
```

## 3. Common Notes

- 所有接口默认返回 `application/json`
- API 全局前缀为 `/api/v1`
- 代理前缀为 `/api/proxy`
- 后台接口鉴权失败时会返回 `401`

## 4. Enum Definitions

### 4.1 行程生成枚举

- `durationDays`: `0.5 | 1 | 2 | 3 | 4 | 5`
- `transportMode`: `self-drive | public | taxi | walk-first`
- `companions`: `solo | couple | friends | family | parents`
- `budgetLevel`: `low | medium | high | custom`
- `interests`: `history | mountain | taiji | red | citywalk | food | photo`
- `foodPreferences`: `spicy | non-spicy | light | local-specialty | exclude-ingredient`
- `pace`: `relaxed | standard | compact`

### 4.2 主题 slug

- `idiom-culture`
- `zhao-culture`
- `taiji-culture`
- `red-culture`
- `grotto-archaeology`
- `mountain-leisure`
- `citywalk`
- `night-food`
- `family-friendly`
- `senior-friendly`

### 4.3 审核状态

- `DRAFT`
- `PENDING`
- `APPROVED`
- `REJECTED`

## 5. Public APIs

---

### 5.1 Health Check

`GET /health`

完整地址：

- `https://qiuyu.online/api/proxy/health`

返回示例：

```json
{
  "ok": true,
  "database": true,
  "service": "handan-travel-api",
  "timestamp": "2026-04-13T10:14:22.789Z"
}
```

---

### 5.2 景点列表

`GET /pois`

查询参数：

- `district`: string，可选
- `theme`: string，可选
- `q`: string，可选

示例：

```bash
curl 'https://qiuyu.online/api/proxy/pois?district=丛台区&theme=citywalk&q=历史'
```

返回：`Poi[]`

单项结构：

```json
{
  "id": "poi-congtai",
  "name": "丛台公园",
  "slug": "congtai-park",
  "district": "丛台区",
  "level": null,
  "lat": 36.612,
  "lng": 114.489,
  "tags": ["历史", "市区"],
  "themeSlugs": ["idiom-culture", "citywalk"],
  "intro": "邯郸市区的代表性公园",
  "sourceId": "source-001",
  "freshnessDate": "2026-04-13",
  "reviewStatus": "APPROVED",
  "culturalStory": "与赵都历史相关",
  "recommendStayMinutes": 90,
  "openingHours": null,
  "ticketPriceRange": null,
  "suitableCrowd": ["family", "parents"],
  "transportTips": null,
  "nearbyFoodIds": []
}
```

---

### 5.3 景点详情

`GET /pois/:slug`

示例：

```bash
curl 'https://qiuyu.online/api/proxy/pois/congtai-park'
```

返回：`Poi`

---

### 5.4 美食目录

`GET /foods`

查询参数：

- `district`: string，可选
- `theme`: string，可选
- `q`: string，可选

说明：

- 该接口返回混合目录
- `kind` 为 `venue` 时表示餐馆
- `kind` 为 `dish` 时表示菜品

示例：

```bash
curl 'https://qiuyu.online/api/proxy/foods?theme=night-food'
```

返回：`DirectoryFoodItem[]`

单项结构：

```json
{
  "id": "food-001",
  "slug": "ermao-shaobing",
  "name": "二毛烧饼",
  "kind": "dish",
  "district": "丛台区",
  "intro": "邯郸本地经典小吃",
  "tags": ["小吃", "本地特色"],
  "priceLabel": null,
  "bestTimeToEat": "早餐"
}
```

---

### 5.5 美食详情

`GET /foods/:slug`

示例：

```bash
curl 'https://qiuyu.online/api/proxy/foods/ermao-shaobing'
```

返回格式：

```json
{
  "kind": "dish",
  "item": {
    "id": "food-001",
    "name": "二毛烧饼",
    "slug": "ermao-shaobing"
  }
}
```

说明：

- `kind = venue` 时，`item` 为 `FoodVenue`
- `kind = dish` 时，`item` 为 `Dish`

`FoodVenue` 关键字段：

- `lat`
- `lng`
- `avgPrice`
- `spicyLevel`
- `signatureDishes`
- `cultureStory`
- `bestTimeToEat`

`Dish` 关键字段：

- `flavor`
- `cultureTags`
- `relatedVenueIds`
- `bestTimeToEat`
- `spicyLevel`

---

### 5.6 主题列表

`GET /themes`

示例：

```bash
curl 'https://qiuyu.online/api/proxy/themes'
```

返回：`Theme[]`

单项结构：

```json
{
  "id": "theme-idiom",
  "name": "成语文化",
  "slug": "idiom-culture",
  "intro": "以邯郸成语典故为主线的旅行专题",
  "seoText": "邯郸成语文化旅游专题",
  "heroImage": "/images/theme-idiom.jpg",
  "featureBullets": ["城市地标", "历史典故", "适合 citywalk"]
}
```

---

### 5.7 主题详情

`GET /themes/:slug`

示例：

```bash
curl 'https://qiuyu.online/api/proxy/themes/idiom-culture'
```

返回结构：

```json
{
  "id": "theme-idiom",
  "name": "成语文化",
  "slug": "idiom-culture",
  "intro": "以邯郸成语典故为主线",
  "seoText": "邯郸成语文化旅游专题",
  "heroImage": "/images/theme-idiom.jpg",
  "featureBullets": ["城市地标", "历史典故"],
  "pois": [],
  "foodVenues": [],
  "dishes": []
}
```

---

### 5.8 全局搜索

`GET /search`

查询参数：

- `q`: string，必填建议

示例：

```bash
curl 'https://qiuyu.online/api/proxy/search?q=成语'
```

返回结构：

```json
{
  "pois": [],
  "foods": [],
  "themes": []
}
```

---

### 5.9 生成行程

`POST /plans/generate`

请求体：

```json
{
  "intent": {
    "originalQuery": "周末带父母来邯郸，两天轻松一点，想看历史也想吃特色",
    "durationDays": 2,
    "transportMode": "taxi",
    "companions": ["parents"],
    "budgetLevel": "medium",
    "budgetAmount": null,
    "interests": ["history", "food"],
    "foodPreferences": ["local-specialty", "light"],
    "pace": "relaxed",
    "constraints": ["少走路"],
    "mustVisitSlugs": []
  }
}
```

示例：

```bash
curl -X POST 'https://qiuyu.online/api/proxy/plans/generate' \
  -H 'Content-Type: application/json' \
  -d '{
    "intent": {
      "originalQuery": "两天邯郸历史美食游",
      "durationDays": 2,
      "transportMode": "taxi",
      "companions": ["friends"],
      "budgetLevel": "medium",
      "budgetAmount": null,
      "interests": ["history", "food"],
      "foodPreferences": ["local-specialty"],
      "pace": "standard",
      "constraints": [],
      "mustVisitSlugs": []
    }
  }'
```

返回结构：`PlanResult`

核心字段：

- `sessionId`: string
- `shareId`: string
- `tripTitle`: string
- `summary`: string
- `whyThisPlan`: string
- `userProfile`
- `days`
- `budget`
- `alternatives`
- `warnings`
- `sources`

`days` 单项结构：

```json
{
  "dayIndex": 1,
  "theme": "赵都历史线",
  "estimatedCost": 280,
  "segments": [
    {
      "startTime": "09:00",
      "endTime": "10:30",
      "type": "poi",
      "entityId": "poi-congtai",
      "entityType": "poi",
      "title": "丛台公园",
      "reason": "历史主线起点",
      "stayMinutes": 90,
      "transportSuggestion": "打车前往",
      "warning": null
    }
  ]
}
```

---

### 5.10 微调行程

`POST /plans/refine`

请求体：

```json
{
  "sessionId": "your-session-id",
  "instruction": "减少步行，多安排美食，预算控制在600元"
}
```

说明：

- 当前实现会基于上一次 `intent` 做规则化调整
- 返回结果结构与 `POST /plans/generate` 相同

---

### 5.11 获取分享行程

`GET /plans/share/:shareId`

示例：

```bash
curl 'https://qiuyu.online/api/proxy/plans/share/abcd1234'
```

返回：`PlanResult`

---

### 5.12 用户反馈

### 5.12 语音导游问答

`POST /voice/guide`

请求体：

```json
{
  "message": "带父母一天怎么玩？",
  "history": [
    {
      "role": "assistant",
      "content": "我是你的邯郸语音导游，可以直接问我。"
    }
  ]
}
```

示例：

```bash
curl -X POST 'https://qiuyu.online/api/proxy/voice/guide' \
  -H 'Content-Type: application/json' \
  -d '{"message":"我想吃邯郸特色小吃","history":[]}'
```

返回结构：

```json
{
  "reply": "邯郸特色小吃可以优先试试武安拽面、永年驴肉、二毛烧鸡这一类。",
  "provider": "volcengine-ark",
  "model": "doubao-seed-2-0-mini-260215",
  "generatedAt": "2026-04-24T12:00:00.000Z",
  "voice": {
    "mode": "browser-speech-with-server-ai",
    "realtimeModel": "1.2.1.1",
    "realtimeGatewayReady": false
  }
}
```

---

### 5.13 语音合成

`POST /voice/tts`

请求体：

```json
{
  "text": "欢迎来到邯郸，我来帮你规划今天的路线。"
}
```

返回结构：

```json
{
  "audioBase64": null,
  "contentType": null,
  "provider": "browser-speech-fallback",
  "model": "1.2.1.1",
  "voiceType": "zh_female_vv_jupiter_bigtts"
}
```

说明：

- 配置火山端到端实时语音 `VOICE_REALTIME_APP_ID` 和 `VOICE_REALTIME_API_KEY` 后，`audioBase64` 会返回可播放音频。
- 当前实现使用官方 `wss://openspeech.bytedance.com/api/v3/realtime/dialogue` 二进制协议，通过 `ChatTTSText` 事件生成 `audio/wav`。
- 未配置 App ID 或 Access Key 时，前端会自动使用浏览器朗读兜底。

---

### 5.14 用户反馈

`POST /feedback`

请求体：

```json
{
  "planSessionId": "your-session-id",
  "rating": 5,
  "useful": true,
  "comment": "整体不错"
}
```

返回结构：

```json
{
  "id": "feedback-id",
  "planSessionId": "your-session-id",
  "rating": 5,
  "useful": true,
  "comment": "整体不错"
}
```

## 6. Admin APIs

以下接口都需要 `Basic Auth`

---

### 6.1 后台概览

`GET /admin/overview`

示例：

```bash
curl -u 'admin:你的后台密码' \
  'https://qiuyu.online/api/proxy/admin/overview'
```

返回结构：

```json
{
  "counts": {
    "pois": 10,
    "foodVenues": 8,
    "promptConfigs": 2
  },
  "prompts": []
}
```

---

### 6.2 Prompt 列表

`GET /admin/prompts`

返回：`PromptConfig[]`

单项字段：

- `id`
- `name`
- `version`
- `description`
- `systemPrompt`
- `isPublished`

---

### 6.3 新增景点

`POST /admin/pois`

请求体：

```json
{
  "name": "新景点",
  "slug": "new-poi",
  "district": "丛台区",
  "level": null,
  "lat": 36.61,
  "lng": 114.49,
  "tags": ["历史"],
  "intro": "景点简介",
  "culturalStory": "文化说明",
  "recommendStayMinutes": 90,
  "openingHours": null,
  "ticketPriceRange": null,
  "suitableCrowd": ["family"],
  "transportTips": null,
  "sourceId": "source-001",
  "freshnessDate": "2026-04-13",
  "reviewStatus": "APPROVED"
}
```

返回：创建后的 `Poi`

---

### 6.4 更新景点

`PUT /admin/pois/:id`

Body 与新增景点相同。

---

### 6.5 新增餐馆

`POST /admin/foods`

请求体：

```json
{
  "name": "新餐馆",
  "slug": "new-food-venue",
  "district": "丛台区",
  "lat": 36.61,
  "lng": 114.49,
  "avgPrice": 68,
  "spicyLevel": "mild",
  "tags": ["本地特色"],
  "intro": "餐馆简介",
  "openingHours": "10:00-21:00",
  "signatureDishes": ["招牌菜A"],
  "suitableCrowd": ["friends", "family"],
  "cultureStory": null,
  "bestTimeToEat": "晚餐",
  "sourceId": "source-001",
  "freshnessDate": "2026-04-13",
  "reviewStatus": "APPROVED"
}
```

返回：创建后的 `FoodVenue`

---

### 6.6 更新餐馆

`PUT /admin/foods/:id`

Body 与新增餐馆相同。

---

### 6.7 发布 Prompt

`POST /admin/prompts/publish`

请求体：

```json
{
  "id": "prompt-config-id"
}
```

返回：更新后的 `PromptConfig`

---

### 6.8 重建索引

`POST /admin/reindex`

返回：

```json
{
  "ok": true,
  "message": "MVP 阶段暂用 PostgreSQL 查询，无需额外向量重建。",
  "timestamp": "2026-04-13T10:00:00.000Z"
}
```

## 7. Frontend Recommendations

如果你自己重写前端，建议优先对接这几个接口：

### 首页/搜索页

- `GET /themes`
- `GET /pois`
- `GET /foods`
- `GET /search`

### 行程生成页

- `POST /plans/generate`
- `POST /plans/refine`
- `GET /plans/share/:shareId`

### 详情页

- `GET /pois/:slug`
- `GET /foods/:slug`
- `GET /themes/:slug`

### 后台

- `GET /admin/overview`
- `GET /admin/prompts`
- `POST /admin/pois`
- `PUT /admin/pois/:id`
- `POST /admin/foods`
- `PUT /admin/foods/:id`

## 8. Quick Test Commands

```bash
curl 'https://qiuyu.online/api/proxy/health'
curl 'https://qiuyu.online/api/proxy/themes'
curl 'https://qiuyu.online/api/proxy/search?q=成语'
curl 'https://qiuyu.online/api/proxy/pois'
curl 'https://qiuyu.online/api/proxy/foods'
```

后台测试：

```bash
curl -u 'admin:你的后台密码' \
  'https://qiuyu.online/api/proxy/admin/overview'
```
