# CDN 配置指南

## 📡 国内 CDN 加速配置

### 🎯 方案说明

本方案使用腾讯云/阿里云 CDN 的**回源功能**，无需迁移资源到云端。

**原理**：

```
用户请求 → CDN 边缘节点 → 如果有缓存，直接返回
                            ↓
                            如果无缓存，从源站（你的服务器）获取
                            ↓
                            缓存到 CDN 边缘节点
```

---

## � 快速开始

### 方式 1：通过 .env 配置（推荐）

在 `.env` 文件中配置：

```env
# ========================================
# CDN 加速配置
# ========================================

# 是否启用 CDN（true 启用，false 禁用）
CDN_ENABLED=false

# CDN 基础 URL（启用 CDN 时使用）
CDN_BASE_URL=https://cdn.giovan.cn

# 本地资源 URL（禁用 CDN 时使用）
LOCAL_BASE_URL=https://serve.giovan.cn
```

**使用方式**：

- **开发环境**：设置 `CDN_ENABLED=false`，使用本地资源
- **生产环境**：设置 `CDN_ENABLED=true`，使用 CDN 加速

### 方式 2：代码中动态获取

在 Controller 中使用：

```javascript
// 获取资源 URL
const photoUrl = ctx.state.getResourceUrl("/uploads/photos/photo.jpg");

// CDN 启用时：https://cdn.giovan.cn/uploads/photos/photo.jpg
// CDN 禁用时：https://serve.giovan.cn/uploads/photos/photo.jpg
```

---

## �📝 腾讯云 CDN 配置

### 1. 创建 CDN 加速域名

1. 登录 [腾讯云 CDN 控制台](https://console.cloud.tencent.com/cdn)
2. 点击「域名管理」→「添加域名」
3. 填写信息：
   - **加速域名**：`cdn.yourdomain.com`（或 `static.yourdomain.com`）
   - **业务类型**：静态加速
   - **源站类型**：源站 IP
   - **源站地址**：你的服务器 IP（如 `1.2.3.4`）
   - **回源端口**：`80` 或 `443`

### 2. 配置缓存规则

1. 进入域名详情页 →「缓存配置」→「节点缓存过期配置」
2. 添加规则：

| 规则       | 目录                     | 过期时间 |
| ---------- | ------------------------ | -------- |
| **规则 1** | `/uploads/photos-webp/*` | 1 天     |
| **规则 2** | `/uploads/photos/*.mov`  | 1 天     |
| **规则 3** | `/uploads/photos/*.mp4`  | 1 天     |
| **规则 4** | `/uploads/photos/*.jpg`  | 1 小时   |
| **规则 5** | `/uploads/photos/*.jpeg` | 1 小时   |
| **规则 6** | `/uploads/photos/*.png`  | 1 小时   |
| **规则 7** | `/uploads/photos/*.webp` | 1 小时   |

### 3. 配置回源策略

1. 进入「回源配置」→「回源 HOST」
2. 设置回源 HOST：`yourdomain.com`（你的域名）

### 4. 配置 HTTPS

1. 进入「HTTPS 配置」
2. 上传 SSL 证书
3. 开启 HTTPS 强制跳转

### 5. 配置 DNS 解析

1. 进入「域名管理」→「DNS 解析」
2. 添加记录：

| 记录类型  | 主机记录 | 记录值                                                   |
| --------- | -------- | -------------------------------------------------------- |
| **CNAME** | `cdn`    | `cdn.yourdomain.com.cdn.dnsv1.com`（腾讯云提供的 CNAME） |

---

## 📝 阿里云 CDN 配置

### 1. 创建 CDN 加速域名

1. 登录 [阿里云 CDN 控制台](https://cdn.console.aliyun.com/)
2. 点击「域名管理」→「添加域名」
3. 填写信息：
   - **加速域名**：`cdn.yourdomain.com`
   - **业务类型**：图片小文件
   - **源站类型**：IP 源站
   - **源站地址**：你的服务器 IP（如 `1.2.3.4`）
   - **端口**：`80` 或 `443`

### 2. 配置缓存规则

1. 进入域名详情页 →「缓存配置」→「缓存过期时间」
2. 添加规则：

| 规则       | 目录                     | 过期时间          |
| ---------- | ------------------------ | ----------------- |
| **规则 1** | `/uploads/photos-webp/*` | 86400 秒（1 天）  |
| **规则 2** | `/uploads/photos/*.mov`  | 86400 秒（1 天）  |
| **规则 3** | `/uploads/photos/*.mp4`  | 86400 秒（1 天）  |
| **规则 4** | `/uploads/photos/*.jpg`  | 3600 秒（1 小时） |
| **规则 5** | `/uploads/photos/*.jpeg` | 3600 秒（1 小时） |
| **规则 6** | `/uploads/photos/*.png`  | 3600 秒（1 小时） |
| **规则 7** | `/uploads/photos/*.webp` | 3600 秒（1 小时） |

### 3. 配置回源策略

1. 进入「回源配置」→「回源 HOST」
2. 设置回源 HOST：`yourdomain.com`（你的域名）

### 4. 配置 HTTPS

1. 进入「HTTPS 配置」
2. 上传 SSL 证书
3. 开启 HTTPS 强制跳转

### 5. 配置 DNS 解析

1. 进入「域名管理」→「DNS 解析」
2. 添加记录：

| 记录类型  | 主机记录 | 记录值                                                    |
| --------- | -------- | --------------------------------------------------------- |
| **CNAME** | `cdn`    | `cdn.yourdomain.com.w.kunlunsl.com`（阿里云提供的 CNAME） |

---

## 🔧 前端代码修改

### 修改图片 URL 为 CDN 地址

**示例**：

```javascript
// 原来的 URL
const originalUrl = "https://serve.giovan.cn/uploads/photos/photo.jpg";

// 修改为 CDN URL
const cdnUrl = "https://cdn.yourdomain.com/uploads/photos/photo.jpg";
```

### 配置 CDN 基础 URL

在 `.env` 中添加：

```env
CDN_BASE_URL=https://cdn.yourdomain.com
```

在代码中使用：

```javascript
const cdnBaseUrl =
  process.env.CDN_BASE_URL || "https://serve.giovan.cn/uploads";

// 生成 CDN URL
const photoUrl = `${cdnBaseUrl}/photos/${photo.storageKey}`;
```

---

## 📊 缓存策略说明

### HTTP 缓存头（代码已配置）

| 文件类型             | Cache-Control                                            | Expires |
| -------------------- | -------------------------------------------------------- | ------- |
| **视频**             | `public, max-age=86400, s-maxage=86400`                  | 24 小时 |
| **图片（带时间戳）** | `public, max-age=31536000, s-maxage=31536000, immutable` | 1 年    |
| **图片（无时间戳）** | `public, max-age=300, s-maxage=3600, must-revalidate`    | 5 分钟  |

### CDN 缓存规则

| 文件类型        | CDN 缓存时间 |
| --------------- | ------------ |
| **视频**        | 1 天         |
| **WebP 缩略图** | 1 天         |
| **图片**        | 1 小时       |

---

## 🎯 优化效果

| 指标             | 无 CDN  | 有 CDN     |
| ---------------- | ------- | ---------- |
| **图片加载速度** | 1-5 秒  | 0.1-0.5 秒 |
| **视频加载速度** | 5-20 秒 | 1-3 秒     |
| **服务器带宽**   | 100%    | 10-20%     |
| **用户体验**     | 慢      | 快         |

---

## 📝 注意事项

1. **CDN 缓存刷新**
   - 修改图片后，需要在 CDN 控制台手动刷新缓存
   - 或者在 URL 中添加时间戳参数（如 `?t=1234567890`）

2. **HTTPS 证书**
   - 确保 CDN 和源站都配置了 HTTPS
   - 使用相同的 SSL 证书

3. **成本**
   - 腾讯云 CDN：按流量计费，约 0.24 元/GB
   - 阿里云 CDN：按流量计费，约 0.24 元/GB

4. **监控**
   - 在 CDN 控制台监控流量、命中率
   - 调整缓存规则以获得最佳效果

---

## ✅ 验证 CDN 配置

### 1. 检查 DNS 解析

```bash
dig cdn.yourdomain.com
```

应该返回 CDN 提供的 CNAME。

### 2. 检查缓存头

```bash
curl -I https://cdn.yourdomain.com/uploads/photos/photo.jpg
```

应该看到：

```
Cache-Control: public, max-age=300, s-maxage=3600, must-revalidate
X-Cache: HIT (CDN 命中)
```

### 3. 测试加载速度

使用 [WebPageTest](https://www.webpagetest.org/) 或 [Lighthouse](https://developers.google.com/web/tools/lighthouse) 测试页面加载速度。

---

## 📞 技术支持

- 腾讯云 CDN 文档：https://cloud.tencent.com/document/product/228
- 阿里云 CDN 文档：https://help.aliyun.com/product/cdn.html
