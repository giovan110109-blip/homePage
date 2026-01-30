# Docker 上传文件问题诊断和修复

## 问题分析

您反馈上传文件没有保存到 `/Volumes/大金刚/uploads`。经过诊断，问题如下：

### 根本原因

Docker 容器的卷挂载配置有误：

**❌ 错误配置**：
```yaml
volumes:
  - ./server/uploads:/app/uploads
```

这会导致：
- 文件实际保存到主机的 `./server/uploads` 目录
- 容器内的 `UPLOAD_DIR=/Volumes/大金刚/uploads` 无法正确访问外接硬盘
- 外接硬盘上的文件夹仍然是空的

### 正确的配置流程

1. **Docker 容器内部**: 使用容器内的路径 `/app/uploads`
2. **卷挂载**: 将主机的外接硬盘路径映射到容器内部
3. **环境变量**: 在 docker-compose.yml 中覆盖 `UPLOAD_DIR` 为 `/app/uploads`

## 修复步骤

### 第一步：停止旧容器

```bash
cd /Users/giovan/Desktop/homePage
docker-compose down
```

输出应该显示：
```
Removing homepage-server
Removing homepage-client
Network homepage-network is external, skipping
```

### 第二步：验证修改

已完成的修改：

✅ **docker-compose.yml**
- 更新卷挂载为：`- /Volumes/大金刚/uploads:/app/uploads`
- 添加环境变量覆盖：`UPLOAD_DIR=/app/uploads`

✅ **.env**
- 保持原有配置（用于本地开发）

### 第三步：重新构建并启动

```bash
cd /Users/giovan/Desktop/homePage
docker-compose up -d --build
```

查看日志确认启动成功：
```bash
docker-compose logs -f server
```

应该看到类似输出：
```
homepage-server  | Server running at http://localhost:8998
```

### 第四步：验证修复

```bash
# 检查容器是否正在运行
docker ps | grep server

# 检查卷挂载是否正确
docker inspect homepage-server | grep -A 10 "Mounts"
```

输出应显示：
```json
"Mounts": [
  {
    "Type": "bind",
    "Source": "/Volumes/大金刚/uploads",
    "Destination": "/app/uploads",
    "Mode": "rw",
    "RW": true,
    "Propagation": "rprivate"
  }
]
```

### 第五步：测试上传

1. 打开浏览器访问：http://localhost:40000/admin
2. 进入系统设置
3. 上传头像或其他文件
4. 检查文件是否出现在 `/Volumes/大金刚/uploads/`

```bash
# 查看上传的文件
ls -lah "/Volumes/大金刚/uploads/"

# 应该看到类似输出
# -rw-r--r--  1 giovan  staff   12K Jan 30 13:00 1707028800-abc123def.jpg
```

## 工作流程说明

### 本地开发模式

```
前端上传文件
  ↓
POST /api/upload
  ↓
后端接收文件流
  ↓
保存到 UPLOAD_DIR ("/Volumes/大金刚/uploads")
  ↓
返回相对路径 "/uploads/filename"
  ↓
前端构建完整 URL "http://localhost:8998/uploads/filename"
  ↓
显示在页面上
```

### Docker 部署模式

```
前端上传文件 (容器内)
  ↓
POST /api/upload
  ↓
后端接收文件流 (容器内)
  ↓
保存到 UPLOAD_DIR ="/app/uploads" (容器内路径)
  ↓
实际保存位置: /Volumes/大金刚/uploads (主机路径，通过 volume 挂载)
  ↓
返回相对路径 "/uploads/filename"
  ↓
前端构建完整 URL
  ↓
显示在页面上
```

## 关键配置对比

| 配置项 | 本地开发 | Docker 容器 |
|-------|--------|-----------|
| UPLOAD_DIR | `/Volumes/大金刚/uploads` | `/app/uploads` |
| 实际文件位置 | `/Volumes/大金刚/uploads` | 通过 volume 挂载到 `/Volumes/大金刚/uploads` |
| 来源 | .env 环境变量 | docker-compose.yml environment |

## 如果仍有问题

### 问题 1: 容器无法启动

```bash
# 查看完整错误日志
docker-compose logs server

# 检查外接硬盘是否正常挂载
mount | grep "大金刚"

# 或列出外接硬盘
diskutil list
```

### 问题 2: 外接硬盘断开连接

如果外接硬盘掉线，需要：
1. 重新连接外接硬盘
2. 重启 Docker 容器

```bash
docker-compose restart server
```

### 问题 3: 权限问题

```bash
# 检查目录权限
ls -la "/Volumes/大金刚/"

# 修改权限（如需要）
chmod 755 "/Volumes/大金刚/uploads"
```

### 问题 4: Docker Desktop 卷挂载问题（Mac）

在 Docker Desktop 的设置中检查：
- Preferences → Resources → File Sharing
- 确保 `/Volumes` 已经被共享

## 验证清单

部署完成后，请逐项验证：

- [ ] 容器成功启动（`docker ps` 显示 homepage-server）
- [ ] 卷挂载正确（`docker inspect` 显示正确的 Source 和 Destination）
- [ ] 环境变量正确（`docker inspect` 显示 `UPLOAD_DIR=/app/uploads`）
- [ ] 能访问前端（http://localhost:40000）
- [ ] 能访问后端 API（http://localhost:8998）
- [ ] 上传文件成功
- [ ] 文件出现在 `/Volumes/大金刚/uploads/`
- [ ] 图片正确显示

## 相关文件

- [docker-compose.yml](docker-compose.yml) - 已修改的 Docker 编排配置
- [.env](.env) - 环境变量配置
- [README.docker.md](README.docker.md) - Docker 部署指南

---

现在请执行上述步骤，问题应该会得到解决！
