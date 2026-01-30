# 前端 API 地址环境自适应修复

## 问题

生产环境中上传的文件返回 `localhost` 地址，而不是实际的生产服务器地址。

### 原因

前端代码写死了使用 `VITE_API_BASE_URL_LOCAL` (http://localhost:8998)，这是开发环境的地址。生产环境应该使用 `VITE_API_BASE_URL` (https://serve.giovan.cn)。

## 解决方案

修改前端代码，根据构建环境动态选择 API 地址。

### 修改文件

**文件**: [client/src/pages/admin/components/SettingsPage.vue](client/src/pages/admin/components/SettingsPage.vue)

### 修改内容

#### 1. 导入两个环境变量

```typescript
// ❌ 旧代码：只导入 LOCAL
const { VITE_API_BASE_URL_LOCAL } = import.meta.env

// ✅ 新代码：导入两个环境变量
const { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL } = import.meta.env

// 根据构建环境动态选择
const apiBaseUrl = import.meta.env.PROD ? VITE_API_BASE_URL : VITE_API_BASE_URL_LOCAL
```

#### 2. 上传按钮 action

```vue
<!-- ❌ 旧代码 -->
<el-upload
  :action="`${VITE_API_BASE_URL_LOCAL}/api/upload`"
  ...
/>

<!-- ✅ 新代码 -->
<el-upload
  :action="`${apiBaseUrl}/api/upload`"
  ...
/>
```

#### 3. 上传成功处理

```typescript
// ❌ 旧代码
const handleAvatarSuccess = (response: any) => {
  const data = response?.data || response
  if (data?.url) {
    const url = data.url.startsWith('http') 
      ? data.url 
      : `${VITE_API_BASE_URL_LOCAL}${data.url}`
    form.value.avatar = url
  }
}

// ✅ 新代码
const handleAvatarSuccess = (response: any) => {
  const data = response?.data || response
  if (data?.url) {
    const url = data.url.startsWith('http') 
      ? data.url 
      : `${apiBaseUrl}${data.url}`
    form.value.avatar = url
  }
}
```

## 环境变量说明

| 环境 | 变量 | 值 | 用途 |
|------|------|-----|------|
| 开发 | VITE_API_BASE_URL_LOCAL | http://localhost:8998 | 本地开发时使用 |
| 生产 | VITE_API_BASE_URL | https://serve.giovan.cn | 生产部署时使用 |

## Vite 构建环境检测

Vite 提供 `import.meta.env.PROD` 和 `import.meta.env.DEV` 来检测构建环境：

```typescript
// 生产构建时为 true
import.meta.env.PROD

// 开发模式下为 true
import.meta.env.DEV
```

## 部署步骤

### 1. 提交代码修改

```bash
git add -A
git commit -m "fix: 前端 API 地址根据环境动态选择"
```

### 2. 重新构建并部署

#### Docker 部署

```bash
cd /Users/giovan/Desktop/homePage

# 停止旧容器
docker-compose down

# 重新构建（前端会使用 VITE_API_BASE_URL）
docker-compose up -d --build

# 查看日志
docker-compose logs -f
```

#### 本地开发

```bash
cd client
pnpm dev
```

开发环境仍然会使用 `VITE_API_BASE_URL_LOCAL` (localhost:8998)

## 验证修复

### 生产环境验证

1. 访问 https://serve.giovan.cn
2. 上传一个文件（如头像）
3. 检查网络请求：
   - 上传地址应该是：`https://serve.giovan.cn/api/upload`
   - 返回的 URL 应该是：`/uploads/filename`
4. 前端拼接后的完整 URL 应该是：`https://serve.giovan.cn/uploads/filename`

### 本地开发验证

1. 访问 http://localhost:40000 (前端)
2. 上传一个文件
3. 检查网络请求：
   - 上传地址应该是：`http://localhost:8998/api/upload`
   - 返回的 URL 应该是：`/uploads/filename`
4. 前端拼接后的完整 URL 应该是：`http://localhost:8998/uploads/filename`

## 工作原理

```
┌─────────────────────────────────────────────┐
│           前端构建过程                        │
└─────────────────────────────────────────────┘
          ↓
    npm run build (生产构建)
          ↓
    import.meta.env.PROD = true
          ↓
    apiBaseUrl = VITE_API_BASE_URL
           = "https://serve.giovan.cn"
          ↓
    上传请求发送到：
    https://serve.giovan.cn/api/upload
          ↓
    后端返回：/uploads/filename
          ↓
    前端拼接：https://serve.giovan.cn/uploads/filename
          ↓
          ✅ 正确显示！
```

## 总结

这个修复确保了：
- 💪 **生产环境**：使用实际的域名 (https://serve.giovan.cn)
- 🔧 **开发环境**：继续使用 localhost (http://localhost:8998)
- 🚀 **自动切换**：根据构建环境自动选择，无需手动修改代码

---

现在重新部署即可解决 localhost 问题！
