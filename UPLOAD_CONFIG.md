# 文件上传配置指南

本文档详细说明如何配置上传文件的存储位置。

## 概述

Decanter 项目的文件上传功能支持灵活的存储位置配置。您可以将上传的文件保存到：

- 项目内的默认目录
- 项目外的自定义目录
- 外接硬盘或移动存储设备
- 网络存储路径（如 NFS 挂载）
- Docker 容器中的映射卷

## 配置方式

### 1. 环境变量配置

编辑项目根目录的 `.env` 文件，添加以下两个环境变量：

```env
# 文件保存的本地目录路径
UPLOAD_DIR="/path/to/upload/directory"

# 对外暴露的 HTTP 访问前缀
UPLOAD_BASE_URL="/uploads"
```

### 2. 配置参数说明

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `UPLOAD_DIR` | 字符串 | 文件在服务器上的绝对存储路径 | `/Volumes/大金刚/uploads` |
| `UPLOAD_BASE_URL` | 字符串 | 客户端访问文件时使用的 URL 前缀 | `/uploads` |

## 常见配置场景

### 场景 1: 外接硬盘（macOS）

```env
# 使用外接硬盘（命名为 "大金刚"）
UPLOAD_DIR="/Volumes/大金刚/uploads"
UPLOAD_BASE_URL="/uploads"
```

**第一次使用前的准备：**
```bash
# 创建上传目录
mkdir -p "/Volumes/大金刚/uploads"

# 验证目录已创建
ls -la "/Volumes/大金刚/"
```

### 场景 2: 项目内部目录（默认）

```env
# 使用项目根目录下的 uploads 文件夹
UPLOAD_DIR="./uploads"
# 或绝对路径
UPLOAD_DIR="/Users/username/Desktop/homePage/uploads"
UPLOAD_BASE_URL="/uploads"
```

### 场景 3: Linux/Unix 服务器自定义路径

```env
# 使用服务器上的自定义目录
UPLOAD_DIR="/data/uploads"
UPLOAD_BASE_URL="/uploads"

# 需要确保目录存在且有写入权限
# sudo mkdir -p /data/uploads
# sudo chown -R appuser:appgroup /data/uploads
# sudo chmod 755 /data/uploads
```

### 场景 4: Docker 容器部署

**docker-compose.yml 配置：**
```yaml
version: '3.8'
services:
  server:
    build: ./server
    ports:
      - "8998:8998"
    environment:
      - NODE_ENV=production
      - UPLOAD_DIR=/app/uploads
      - UPLOAD_BASE_URL=/uploads
    volumes:
      # 将外接硬盘挂载到容器内
      - /Volumes/大金刚/uploads:/app/uploads
```

**.env 文件配置：**
```env
UPLOAD_DIR=/app/uploads
UPLOAD_BASE_URL=/uploads
```

### 场景 5: Nginx 反向代理配置

若使用 Nginx 代理，需要配置静态文件映射：

```nginx
# 在 Nginx 配置中添加
location /uploads/ {
    alias /Volumes/大金刚/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

相应的 `.env` 配置：
```env
UPLOAD_DIR=/Volumes/大金刚/uploads
UPLOAD_BASE_URL=/uploads
```

## 技术实现

### 上传流程

1. **客户端上传**: 浏览器通过 POST /api/upload 发送文件
2. **服务端处理**: Koa 服务器接收文件流
3. **文件保存**: 将文件保存到 `UPLOAD_DIR` 指定的目录
4. **URL 生成**: 根据 `UPLOAD_BASE_URL` 生成访问 URL

### 相关代码位置

- **上传处理**: [server/src/controllers/uploadController.js](server/src/controllers/uploadController.js)
- **上传工具**: [server/src/utils/uploader.js](server/src/utils/uploader.js)
- **服务配置**: [server/src/app.js](server/src/app.js)
- **环境变量**: [.env](.env) / [.env.example](.env.example)

### 读取配置的优先级

```javascript
// 优先级从高到低：
1. process.env.UPLOAD_DIR         // 环境变量
2. path.join(process.cwd(), 'uploads')  // 默认值
```

## 权限和安全

### 文件权限要求

确保上传目录有适当的权限：

**macOS/Linux：**
```bash
# 为目录设置权限（Node.js 进程用户可读写）
chmod 755 /path/to/upload/directory

# 如果目录属于其他用户
sudo chown -R $(whoami) /path/to/upload/directory
sudo chmod 755 /path/to/upload/directory
```

### 安全提示

⚠️ **重要安全提示：**

1. **防止路径穿越**: 上传文件名自动生成，防止恶意路径注入
2. **文件大小限制**: 默认 200MB，可在 [server/src/app.js](server/src/app.js) 修改
3. **访问控制**: 删除文件操作需要管理员权限
4. **磁盘空间**: 定期检查上传目录的磁盘使用情况

```javascript
// server/src/app.js 中修改文件大小限制
app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 200 * 1024 * 1024 // 修改这个值
  }
}));
```

## 服务启动和重启

### 开发环境

```bash
cd server
npm run dev
# 或
pnpm dev
```

服务会监听 `UPLOAD_DIR` 的更改并自动重新加载。

### 生产环境

```bash
cd server
npm start
# 或
NODE_ENV=production npm start
```

### 修改配置后的操作

1. 编辑 `.env` 文件
2. 重启后端服务：`npm run dev` 或 `npm start`
3. 前端无需重启（配置对前端无影响）

## 故障排排查

### 问题 1: 上传失败，错误信息 "无法访问目录"

**原因**: 目录不存在或权限不足

**解决**:
```bash
# 创建目录
mkdir -p "/Volumes/大金刚/uploads"

# 检查权限
ls -la "/Volumes/大金刚/"

# 如需要，修改权限
chmod 755 "/Volumes/大金刚/uploads"
```

### 问题 2: 外接硬盘路径失效

**原因**: 外接硬盘断开连接或挂载点改变

**解决**:
```bash
# 重新挂载外接硬盘
diskutil list

# 或重启系统，确保外接硬盘自动挂载
```

### 问题 3: Docker 容器上传文件丢失

**原因**: 未配置卷挂载

**解决**: 在 docker-compose.yml 中添加 volumes:
```yaml
volumes:
  - /Volumes/大金刚/uploads:/app/uploads
```

### 问题 4: 文件上传后无法访问

**原因**: `UPLOAD_BASE_URL` 配置错误或与 Nginx 配置不匹配

**解决**: 检查以下内容
1. 检查 `UPLOAD_BASE_URL` 是否与前端请求 URL 一致
2. 如使用 Nginx，检查 `alias` 或 `root` 配置
3. 查看网络开发工具，确认请求 URL 和实际文件路径

## 最佳实践

✅ **建议做法**

1. **使用绝对路径** - 避免相对路径带来的不确定性
   ```env
   UPLOAD_DIR="/Volumes/大金刚/uploads"  # ✓ 好
   UPLOAD_DIR="./uploads"                # ✗ 避免
   ```

2. **定期备份** - 定期备份上传目录中的文件
   ```bash
   rsync -avz /Volumes/大金刚/uploads/ /backup/uploads/
   ```

3. **监控磁盘空间** - 设置警告阈值
   ```bash
   df -h /Volumes/大金刚/
   ```

4. **清理过期文件** - 定期清理不需要的文件
   ```bash
   # 删除 30 天前的文件
   find /Volumes/大金刚/uploads -type f -mtime +30 -delete
   ```

5. **日志监控** - 检查服务日志了解上传情况
   ```bash
   tail -f /var/log/server.log | grep upload
   ```

## 相关资源

- [上传控制器源码](server/src/controllers/uploadController.js)
- [上传工具类源码](server/src/utils/uploader.js)
- [环境变量示例](.env.example)
- [Docker 部署指南](README.docker.md)

---

有问题？请查看 [主 README 文档](README.md) 或联系项目维护者。
