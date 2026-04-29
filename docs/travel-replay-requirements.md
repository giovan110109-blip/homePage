# 旅行足迹回放需求文档

## 1. 背景

当前站点已有 `/travel` 旅行胶卷地图，数据主要来自公开照片的地理位置聚合。新功能希望在此基础上增加“旅行足迹回放”：选择某一年或某一次旅行后，地图上的点位按路线顺序依次亮起，路线逐段绘制，旁边同步播放对应照片胶卷。

本阶段优先建设后端与后台编辑能力，先把“旅行、地点、顺序、照片、发布状态”管理好，再交给前端做动画展示。

## 2. 目标

- 后台可以创建和维护一条旅行回放。
- 后台可以配置回放中的地点、顺序、时间、坐标和照片。
- 回放可以按“某一年”或“某次旅行”组织。
- 前端可以通过公开接口获取已发布回放，并按稳定数据结构播放。
- 复用现有照片库、地理编码、地图数据能力，避免在照片表中硬编码动画逻辑。

## 3. 非目标

- 本阶段不实现前端动画效果。
- 本阶段不做复杂视频导出。
- 本阶段不做多人协作编辑、版本回滚。
- 本阶段不强依赖真实交通轨迹，只维护地点级路线。

## 4. 使用角色

- 管理员：在后台创建、编辑、预览、发布旅行回放。
- 访客：在 `/travel` 或后续回放页面观看已发布的旅行路线动画。

## 5. 核心概念

### 5.1 旅行回放 Travel Replay

一次可播放的路线集合，例如：

- `2025 年旅行足迹`
- `日本关西 2025`
- `毕业旅行`

### 5.2 站点 Stop

回放中的一个停靠点，例如大阪、京都、奈良。每个站点包含坐标、展示名称、抵达时间、照片列表和排序。

### 5.3 胶卷 Photos

站点关联的照片。优先复用 `Photo` 表中的照片，也允许后续扩展“外链图片”或“手动上传图片”。

## 6. 后台编辑流程

1. 管理员进入“旅行回放管理”。
2. 创建回放，填写标题、年份、类型、描述、封面、可见性。
3. 添加站点。
4. 为站点设置地点名称、坐标、日期、描述和排序。
5. 为站点选择照片。
6. 调整站点顺序。
7. 点击预览，检查路线和照片是否正确。
8. 发布回放。
9. 前端只展示 `published` 状态的回放。

## 7. 功能需求

### 7.1 回放列表

后台需要支持：

- 查看回放列表。
- 按关键词、年份、状态筛选。
- 显示标题、年份、类型、站点数量、照片数量、发布状态、更新时间。
- 支持分页。
- 支持复制回放，用于快速制作“年度回放”的变体。

### 7.2 创建和编辑回放

字段要求：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | 是 | 回放标题 |
| slug | string | 是 | 公开访问标识，需唯一 |
| year | number | 否 | 年度回放使用 |
| type | enum | 是 | `yearly` 年度 / `trip` 单次旅行 / `custom` 自定义 |
| description | string | 否 | 简短描述 |
| coverPhoto | ObjectId | 否 | 关联照片表 |
| visibility | enum | 是 | `public` / `private` / `unlisted` |
| status | enum | 是 | `draft` / `published` / `archived` |
| startedAt | Date | 否 | 旅行开始时间 |
| endedAt | Date | 否 | 旅行结束时间 |
| sort | number | 否 | 展示排序 |

### 7.3 站点管理

后台需要支持：

- 新增站点。
- 编辑站点。
- 删除站点。
- 拖拽调整站点顺序。
- 通过地址搜索获取坐标。
- 手动输入经纬度。
- 从已有照片地点中生成站点。
- 从某一年照片自动生成站点草稿。

站点字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | 展示名称，如“京都” |
| subtitle | string | 否 | 副标题，如“伏见稻荷大社” |
| description | string | 否 | 站点文案 |
| date | Date | 否 | 抵达或拍摄日期 |
| location.latitude | number | 是 | 纬度 |
| location.longitude | number | 是 | 经度 |
| geoinfo | object | 否 | 国家、省市、格式化地址 |
| photoIds | ObjectId[] | 否 | 关联照片 |
| coverPhoto | ObjectId | 否 | 站点封面 |
| sort | number | 是 | 路线播放顺序 |
| durationMs | number | 否 | 前端播放停留时长 |

### 7.4 照片选择

后台选择照片时需要支持：

- 按关键词搜索。
- 按日期筛选。
- 按地点筛选。
- 只看有坐标照片。
- 只看公开照片。
- 支持多选。
- 支持按拍摄时间自动排序。

建议照片仍保存在现有 `Photo` 表，回放站点只保存 `photoIds` 引用，避免重复存储文件信息。

### 7.5 自动生成草稿

为了降低维护成本，后台应提供两个自动生成入口：

1. 按年份生成：选择 `2025`，系统读取该年有坐标的公开照片，按城市或近似坐标聚合为站点。
2. 按相册生成：选择一个相册，系统读取相册内有坐标的照片，按拍摄时间生成站点。

生成后状态为 `draft`，管理员可以继续调整站点名称、顺序、照片和描述。

### 7.6 预览

后台预览接口返回与公开接口一致的数据结构，但允许查看 `draft` 状态。

预览需要检查：

- 是否至少有 2 个站点。
- 每个站点是否有有效经纬度。
- 是否有可展示照片。
- `slug` 是否唯一。
- 公开状态下是否存在私密照片。

### 7.7 发布规则

发布时必须满足：

- `title`、`slug`、`type` 完整。
- 至少 2 个有效站点。
- 每个站点有坐标。
- 至少 1 张公开照片，或允许纯路线回放。
- `visibility` 不能为 `private`。

发布后公开接口可访问。取消发布时状态改为 `draft` 或 `archived`。

## 8. 数据模型建议

### 8.1 TravelReplay

建议新增 `server/src/models/travelReplay.js`。

```js
{
  title: String,
  slug: { type: String, unique: true, required: true },
  year: Number,
  type: { type: String, enum: ["yearly", "trip", "custom"], default: "trip" },
  description: String,
  coverPhoto: { type: ObjectId, ref: "Photo" },
  visibility: { type: String, enum: ["public", "unlisted", "private"], default: "private" },
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
  startedAt: Date,
  endedAt: Date,
  sort: { type: Number, default: 0 },
  createdBy: { type: ObjectId, ref: "User" },
  updatedBy: { type: ObjectId, ref: "User" }
}
```

### 8.2 TravelReplayStop

建议新增 `server/src/models/travelReplayStop.js`。

```js
{
  replay: { type: ObjectId, ref: "TravelReplay", required: true },
  name: { type: String, required: true },
  subtitle: String,
  description: String,
  date: Date,
  location: {
    latitude: Number,
    longitude: Number,
    altitude: Number,
    coordinates: [Number]
  },
  geoinfo: {
    country: String,
    countryCode: String,
    region: String,
    city: String,
    locationName: String,
    formatted: String
  },
  photoIds: [{ type: ObjectId, ref: "Photo" }],
  coverPhoto: { type: ObjectId, ref: "Photo" },
  sort: { type: Number, default: 0 },
  durationMs: Number
}
```

### 8.3 索引建议

- `TravelReplay.slug` 唯一索引。
- `TravelReplay.status + visibility + year` 查询索引。
- `TravelReplay.type + status` 查询索引。
- `TravelReplayStop.replay + sort` 排序索引。
- `TravelReplayStop.location.coordinates` 地理索引。

## 9. API 草案

### 9.1 后台接口

统一前缀：`/api/admin/travel-replays`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/` | 回放列表 |
| POST | `/` | 创建回放 |
| GET | `/:id` | 回放详情 |
| PUT | `/:id` | 更新回放基础信息 |
| DELETE | `/:id` | 删除回放 |
| POST | `/:id/duplicate` | 复制回放 |
| POST | `/:id/publish` | 发布回放 |
| POST | `/:id/unpublish` | 取消发布 |
| GET | `/:id/preview` | 后台预览数据 |
| POST | `/generate/year` | 按年份生成草稿 |
| POST | `/generate/album` | 按相册生成草稿 |

站点接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/:id/stops` | 新增站点 |
| PUT | `/:id/stops/:stopId` | 更新站点 |
| DELETE | `/:id/stops/:stopId` | 删除站点 |
| PUT | `/:id/stops/reorder` | 站点排序 |
| POST | `/:id/stops/:stopId/photos` | 更新站点照片 |

### 9.2 公开接口

统一前缀：`/api/travel-replays`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/` | 已发布回放列表 |
| GET | `/years` | 可播放年份列表 |
| GET | `/:slug` | 回放详情 |

### 9.3 公开详情响应示例

```json
{
  "id": "65f...",
  "title": "日本关西 2025",
  "slug": "japan-kansai-2025",
  "year": 2025,
  "type": "trip",
  "description": "大阪、京都、奈良的春日胶卷",
  "coverPhoto": {
    "_id": "65a...",
    "thumbnailUrl": "/uploads/photos-webp/cover.webp",
    "originalUrl": "/uploads/photos-webp/cover.webp",
    "thumbnailHash": "..."
  },
  "stats": {
    "stopCount": 3,
    "photoCount": 24,
    "startedAt": "2025-04-01T00:00:00.000Z",
    "endedAt": "2025-04-05T00:00:00.000Z"
  },
  "route": {
    "type": "LineString",
    "coordinates": [
      [135.5023, 34.6937],
      [135.7681, 35.0116],
      [135.805, 34.6851]
    ]
  },
  "stops": [
    {
      "id": "65b...",
      "name": "大阪",
      "subtitle": "第一站",
      "description": "落地后的第一卷胶片",
      "date": "2025-04-01T00:00:00.000Z",
      "location": {
        "latitude": 34.6937,
        "longitude": 135.5023
      },
      "geoinfo": {
        "country": "日本",
        "city": "大阪"
      },
      "durationMs": 2600,
      "photos": [
        {
          "_id": "65c...",
          "title": "道顿堀夜色",
          "thumbnailUrl": "/uploads/photos-webp/a.webp",
          "originalUrl": "/uploads/photos-webp/a.webp",
          "originalFileUrl": "/uploads/photos/a.jpg",
          "thumbnailHash": "...",
          "width": 3000,
          "height": 2000,
          "dateTaken": "2025-04-01T12:20:00.000Z",
          "isLive": false,
          "videoUrl": null
        }
      ]
    }
  ]
}
```

## 10. 与现有系统的关系

- 现有 `Photo` 表继续作为照片来源。
- 现有 `/api/photos/map/data` 继续服务普通地图聚合。
- 新增回放数据不直接改动 `/travel` 当前地图聚合逻辑。
- 后续前端可以在 `/travel` 上增加“回放模式”，或新增 `/travel/replay/:slug` 页面。
- 坐标搜索和反向地理编码复用现有 `/api/geo`、`geocoding` 服务。

## 11. 权限与可见性

- 后台接口必须走 `adminAuth`。
- 公开接口只返回 `status = published` 且 `visibility in ["public", "unlisted"]` 的回放。
- `private` 回放只能后台查看。
- 公开接口返回照片时，只返回 `visibility = public` 且 `status = completed` 的照片。

## 12. 校验规则

- `slug` 只允许小写字母、数字和短横线。
- 经纬度必须是有效数字，纬度范围 `-90 ~ 90`，经度范围 `-180 ~ 180`。
- 同一回放内站点 `sort` 需要稳定。
- 删除回放时同步删除站点，但不删除照片原文件。
- 删除站点时只解除关联，不删除照片。
- 站点照片引用不存在或不可公开时，公开接口自动过滤。

## 13. 分期计划

### P0 后端数据闭环

- 新增 `TravelReplay`、`TravelReplayStop` 模型。
- 新增后台 CRUD 接口。
- 新增站点 CRUD 与排序接口。
- 新增公开列表与详情接口。
- 完成发布校验。

### P1 后台编辑效率

- 按年份自动生成草稿。
- 按相册自动生成草稿。
- 照片选择接口增强。
- 地址搜索与反向地理编码接入。

### P2 前端回放展示

- `/travel` 增加回放入口。
- 地图路线逐段绘制。
- 点位依次高亮。
- 胶卷照片同步滚动。
- 播放、暂停、重播、进度拖动。

### P3 体验增强

- 分享链接。
- 年度总结卡片。
- 移动端沉浸播放。
- 导出长图或短视频。

## 14. 验收标准

- 管理员可以完整创建一条回放并发布。
- 管理员可以给回放添加至少 2 个站点并排序。
- 管理员可以给每个站点关联照片。
- 公开接口能返回稳定、按顺序排列的 `stops`。
- 未发布或私密回放不会被公开接口返回。
- 私密照片不会出现在公开接口中。
- 按年份生成草稿后，可继续手动编辑并发布。

## 15. 待确认问题

- 后台是否已有独立管理端页面，还是需要在当前 `client` 中新增隐藏管理页面。
- 回放播放页面是复用 `/travel`，还是新增 `/travel/replay/:slug`。
- 纯路线无照片的站点是否允许发布。
- 年度回放是否按城市聚合，还是按更精细的景点坐标聚合。
- 是否需要支持国外地图坐标纠偏或不同地图服务切换。
