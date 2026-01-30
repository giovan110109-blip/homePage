# 快速修复执行指南

## 问题
上传文件没有保存到 `/Volumes/大金刚/uploads`

## 原因
Docker 容器的卷挂载配置错误，导致文件保存到了项目目录而不是外接硬盘

## 解决方案（3 个命令）

### 1️⃣ 停止旧容器

```bash
cd /Users/giovan/Desktop/homePage
docker-compose down
```

### 2️⃣ 重新构建并启动

```bash
docker-compose up -d --build
```

### 3️⃣ 验证启动成功

```bash
docker-compose logs -f server
```

看到 "Server running at http://localhost:8998" 则成功

## 验证修复

```bash
# 上传一个文件，然后检查
ls -lah "/Volumes/大金刚/uploads/"

# 应该看到新上传的文件
```

## 修改内容

### docker-compose.yml 的关键改动

**卷挂载**：
```yaml
volumes:
  - /Volumes/大金刚/uploads:/app/uploads  # ✅ 正确：主机路径映射到容器路径
```

**环境变量**：
```yaml
environment:
  - UPLOAD_DIR=/app/uploads  # ✅ 正确：容器内部路径
  - UPLOAD_BASE_URL=/uploads
```

## 完成了什么

✅ 修改了 docker-compose.yml
  - 更正卷挂载路径
  - 添加环境变量覆盖

✅ 创建了修复文档 (DOCKER_UPLOAD_FIX.md)

---

**现在就可以执行这 3 个命令重启容器了！**
