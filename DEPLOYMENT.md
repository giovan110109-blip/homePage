# 部署步骤 - 上传地址修复

## 修复内容总结

✅ **后端改动**：上传返回相对路径而不是完整 URL  
✅ **前端改动**：前端根据 API 基础地址构建完整 URL  
✅ **效果**：支持任意部署环境（localhost、Docker、服务器）

## 部署步骤

### 1. 拉取最新代码

```bash
cd /Users/giovan/Desktop/homePage
git pull origin main
```

### 2. 重新构建和部署

#### 方案 A: Docker Compose（推荐）

```bash
# 停止旧容器
docker-compose down

# 重新构建并启动
docker-compose up -d --build

# 查看日志确保服务正常
docker-compose logs -f server
```

#### 方案 B: 本地开发模式

```bash
# 终端 1：启动后端
cd server
pnpm dev

# 终端 2：启动前端
cd client
pnpm dev
```

#### 方案 C: 生产环境

```bash
# 后端
cd server
npm install
NODE_ENV=production npm start

# 前端（需要编译）
cd client
npm install
npm run build
# 使用构建输出的 dist 目录部署
```

### 3. 验证修复

打开管理后台上传头像，检查以下内容：

✅ **检查 1**：文件保存位置
```bash
# 验证文件是否正确保存到外接硬盘
ls -lah "/Volumes/大金刚/uploads/"
```

✅ **检查 2**：API 返回值
```bash
# 使用开发者工具查看网络请求
# 上传成功后，查看响应数据应该是相对路径
# 示例: "/uploads/1234567890-abc123.jpg"
```

✅ **检查 3**：图片显示
```bash
# 验证上传的头像是否正确显示
# 应该显示完整的 URL，例如
# http://localhost:8998/uploads/1234567890-abc123.jpg
```

## 网络请求示例

### 上传请求

```
POST /api/upload
Content-Type: multipart/form-data

{file: <binary>}
```

### 上传响应（修复后）

```json
{
  "code": 201,
  "message": "上传成功",
  "data": {
    "filename": "1234567890-abc123.jpg",
    "path": "/Volumes/大金刚/uploads/1234567890-abc123.jpg",
    "url": "/uploads/1234567890-abc123.jpg"
  }
}
```

### 前端处理

```typescript
// response.data.url = "/uploads/1234567890-abc123.jpg"
// VITE_API_BASE_URL_LOCAL = "http://localhost:8998"
// 最终 URL = "http://localhost:8998/uploads/1234567890-abc123.jpg"
```

## 常见部署环境配置

### Docker 部署环境

`.env` 配置：
```env
# 后端 API 返回相对路径
# /uploads/filename

# 前端需要配置正确的 API 基础地址
VITE_API_BASE_URL="https://your-domain.com"
VITE_API_BASE_URL_LOCAL="https://your-domain.com"
```

Docker 访问：
```
https://your-domain.com/uploads/filename
```

### Nginx 反向代理配置

```nginx
location /api/ {
    proxy_pass http://backend:8998;
}

location /uploads/ {
    proxy_pass http://backend:8998;
}
```

前端配置：
```env
VITE_API_BASE_URL="https://example.com"
VITE_API_BASE_URL_LOCAL="https://example.com"
```

## 故障排查

| 问题 | 原因 | 解决方案 |
|------|------|--------|
| 图片显示为 404 | URL 构建错误 | 检查 `VITE_API_BASE_URL_LOCAL` 配置 |
| 显示 localhost | 使用了开发环境配置 | 确保部署环境使用正确的 `.env` |
| 跨域错误 | API 服务器地址错误 | 检查 CORS 配置和 API 地址 |

## 回滚方案（如遇问题）

如果需要快速回滚到旧版本：

```bash
# 查看提交历史
git log --oneline -n 5

# 回滚到上一个版本
git revert HEAD

# 或重置到特定提交
git reset --hard <commit-hash>

# 重新部署
docker-compose down
docker-compose up -d --build
```

## 文件变更清单

本次修复涉及的文件：

| 文件 | 修改内容 |
|------|--------|
| `server/src/controllers/uploadController.js` | 移除服务端 URL 构建逻辑 |
| `client/src/pages/admin/components/SettingsPage.vue` | 添加前端 URL 构建逻辑 |
| `UPLOAD_FIX.md` | 修复说明文档 |

## 相关文档

- 📖 [上传功能修复详解](UPLOAD_FIX.md)
- 📘 [上传配置指南](UPLOAD_CONFIG.md)
- 📝 [快速启动指南](UPLOAD_QUICK_START.md)
- 🐳 [Docker 部署指南](README.docker.md)
