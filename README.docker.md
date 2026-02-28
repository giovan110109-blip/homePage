# Docker 部署指南

## 快速开始

### 1. 环境准备

确保已安装：
- Docker (>= 20.10)
- Docker Compose (>= 2.0)

### 2. 配置环境变量

```bash
# 1. 在根目录创建 .env 文件（用于 docker-compose）
cp .env.example .env

# 2. 编辑 .env 文件，设置 MongoDB 用户名和密码
MONGO_USERNAME=admin
MONGO_PASSWORD=your_secure_password

# 3. 在 server 目录配置应用环境变量
cd server
cp .env.example .env  # 如果有的话
# 编辑 server/.env，配置数据库连接等信息
# MONGODB_URI=mongodb://admin:your_secure_password@mongodb:27017/homepage?authSource=admin
```

### 3. 构建和启动

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 仅查看某个服务的日志
docker-compose logs -f client
docker-compose logs -f server
```

### 4. 访问应用

- 前端：http://localhost:40000
- 后端 API：http://localhost:8998

## 测试环境部署

测试环境使用独立端口，共用正式环境的配置：

| 服务 | 正式环境 | 测试环境 |
|------|----------|----------|
| 前端 | `40000:80` | `40001:80` |
| 后端 | `8998:8998` | `8999:8998` |

```bash
# 启动测试环境
docker-compose -f docker-compose.test.yml up -d --build

# 查看测试环境日志
docker-compose -f docker-compose.test.yml logs -f

# 停止测试环境
docker-compose -f docker-compose.test.yml down
```

测试环境访问地址：
- 前端：http://localhost:40001
- 后端 API：http://localhost:8999

## 常用命令

```bash
# 停止所有服务
docker-compose down

# 停止并删除所有数据（包括数据库）
docker-compose down -v

# 重新构建镜像
docker-compose build

# 重新构建并启动
docker-compose up -d --build

# 查看运行状态
docker-compose ps

# 进入容器
docker-compose exec server sh
docker-compose exec client sh

# 重启某个服务
docker-compose restart server
```

## 单独构建和运行

### Client

```bash
cd client
docker build -t homepage-client .
docker run -d -p 3000:80 --name homepage-client homepage-client
```

### Server

```bash
cd server
docker build -t homepage-server .
docker run -d -p 8998:8998 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  --name homepage-server \
  homepage-server
```

## 生产部署建议

1. **使用专用的 MongoDB 服务**：生产环境建议使用云 MongoDB 服务（如 MongoDB Atlas）
2. **配置 HTTPS**：使用 Nginx 或 Traefik 作为反向代理，配置 SSL 证书
3. **环境变量安全**：不要将 `.env` 文件提交到版本控制，使用密钥管理服务
4. **资源限制**：在 docker-compose.yml 中添加资源限制
5. **日志管理**：配置日志驱动和日志轮转
6. **健康检查**：添加健康检查确保服务可用性

### 添加资源限制示例

```yaml
services:
  server:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 故障排除

### 端口被占用
```bash
# 修改 docker-compose.yml 中的端口映射
# "3000:80" 改为 "3001:80"
```

### 数据库连接失败
```bash
# 检查 MongoDB 是否正常启动
docker-compose logs mongodb

# 检查 server/.env 中的数据库连接字符串
# 确保使用服务名 'mongodb' 而不是 'localhost'
```

### 查看容器内文件
```bash
docker-compose exec server ls -la
docker-compose exec client ls -la /usr/share/nginx/html
```
