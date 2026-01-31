# 图片缓存系统实现说明

## 概述
参考 chronoframe 项目的 `ImageLoaderManager`，为 homePage 项目实现了一套完整的图片缓存系统。该系统使用 LRU (Least Recently Used) 缓存策略来优化图片加载性能。

---

## 核心组件

### 1. **LRU 缓存类** (`client/src/utils/lru.ts`)
- **LRUCache<K, V>**: 通用 LRU 缓存实现
- **特性**:
  - 支持自定义最大容量
  - 自动淘汰最旧的缓存项
  - 支持 evict 回调（用于清理资源）
  - 访问时自动标记为最近使用

### 2. **图片加载管理器** (`client/src/utils/image-loader.ts`)
- **ImageLoaderManager**: 管理图片加载和缓存
- **功能**:
  - 从网络加载图片 Blob
  - 创建 Object URL 用于前端显示
  - 维护 LRU 内存缓存（最多 6 张图片）
  - 自动释放淘汰的 Blob URL
  - 支持加载进度回调

- **缓存策略**:
  ```
  加载流程:
  1. 检查内存缓存
     ✓ 命中 → 直接返回 Object URL (🟢 最快)
     ✗ 未命中 → 继续

  2. 从网络下载图片 Blob
     ✓ 成功 → 创建 Object URL → 存入缓存

  3. 如果缓存满（6 张）
     → 删除最旧的 → 释放其 Object URL
  ```

### 3. **Vue Composable** (`client/src/composables/useImageLoader.ts`)
- **useImageLoader()**: 在 Vue 组件中使用缓存
- **API**:
  ```typescript
  const { 
    loadImage,           // 加载图片
    getCacheStats,       // 获取缓存统计
    clearCache,          // 清空缓存
    cleanup              // 清理资源
  } = useImageLoader()
  ```

### 4. **LazyImage 组件更新** (`client/src/components/LazyImage.vue`)
- **改进**:
  - 集成 useImageLoader composable
  - 当图片即将显示时预加载到缓存
  - 使用缓存的 Object URL 而不是原始 URL
  - 支持 WebP 版本的自动加载

- **加载流程**:
  ```
  1. 显示 ThumbHash 占位符 (模糊缩略图)
  2. 开始加载实际图片
  3. 调用 preloadWebpImage() 预加载到缓存
  4. 使用缓存的 Object URL 显示图片
  5. 监听 src 变化重新加载
  ```

---

## 使用示例

### 在组件中加载图片
```vue
<script setup lang="ts">
import { useImageLoader } from "@/composables/useImageLoader"

const { loadImage, getCacheStats } = useImageLoader()

// 加载图片
const imageUrl = await loadImage(src, {
  onProgress: (progress) => {
    console.log(`📥 加载进度: ${progress.toFixed(0)}%`)
  },
  onError: () => {
    console.warn('⚠️ 加载失败')
  },
})

// 获取缓存统计
const stats = getCacheStats()
console.log(`💾 缓存: ${stats.count}/${stats.maxSize}`)
</script>
```

---

## 缓存统计

### GalleryView 中的实时显示
- 在右上角显示当前缓存状态
- 格式: `📸 图片缓存: 2/6`
- 提供 `🗑️ 清空` 按钮清空所有缓存

### 控制台诊断工具
```javascript
// 显示缓存统计
window.__imageCacheDiagnostics.showStats()

// 显示帮助信息
window.__imageCacheDiagnostics.help()
```

---

## 日志输出示例

### 首次加载
```
📥 开始加载图片: https://example.com/photo.webp
💾 已缓存图片: ... | 大小: 0.45MB
✅ 图片加载完成: ... (0.45MB)
```

### 缓存命中
```
✅ 图片缓存命中: https://example.com/photo.webp
```

### 缓存淘汰
```
🗑️ 已释放 Blob URL - https://old.com/image.webp (size-limit) | 大小: 0.60MB
```

---

## 性能优化

### 缓存命中率
- **首次加载**: 1 次网络请求 → Blob 下载 → Object URL 创建 → 缓存存储
- **后续相同图片**: 0 次网络请求 → 直接返回 Object URL (内存缓存)
- **缓存淘汰**: 超过 6 张图片时，最旧的被自动删除

### 内存管理
- **Object URL**: 自动释放已淘汰的 Blob URL
- **Blob 对象**: 随 LRU 淘汰自动清理
- **最大占用**: ~6 张图片 × 平均 0.5MB = ~3MB 内存

### 带宽优化
- **缓存重用**: 避免重复下载相同图片
- **WebP 优先**: 自动使用压缩更好的 WebP 格式
- **延迟加载**: 只在图片即将显示时加载

---

## 与现有系统的集成

### LazyImage 组件
- ✅ ThumbHash 占位符（模糊预览）
- ✅ WebP 格式自动转换
- ✅ 图片缓存系统（本次新增）

### LivePhoto 组件
- ✅ 视频缓存系统（之前实现的 useLivePhotoCache）
- ✅ IndexedDB 持久化（useLivePhotoPersist）

### 整体流程
```
页面加载
  ├─ 获取照片列表
  ├─ 为每张 LazyImage
  │  ├─ 加载 ThumbHash → 显示占位符
  │  ├─ 加载实际图片 → 缓存到内存 LRU
  │  └─ 显示图片
  └─ 如果是 LivePhoto
     ├─ 加载视频 → 缓存到内存 + IndexedDB
     └─ 支持播放
```

---

## 配置参数

### LRU 缓存大小
- **当前**: 6 张图片
- **位置**: `client/src/utils/image-loader.ts` 第 32 行
- **修改**: `new LRUCache<string, ImageLoaderCacheResult>(6, ...)`

### 预加载延迟
- **当前**: 50ms
- **位置**: `client/src/components/LazyImage.vue` preloadWebpImage 函数
- **作用**: 避免阻塞主线程

---

## 调试和监控

### 启用详细日志
所有操作都有对应的 console.log 输出，包括:
- 📥 加载开始/完成
- ✅ 缓存命中
- 💾 缓存存储
- 🗑️ 缓存释放
- ❌ 错误信息

### 性能监测
```javascript
// 页面加载完成后
const stats = window.__imageCacheDiagnostics
stats.showStats()

// 或在 GalleryView 中观察右上角的缓存统计
```

---

## 后续优化空间

### 可考虑的改进
1. **IndexedDB 持久化**: 跨页面刷新保留缓存（类似 LivePhoto 视频缓存）
2. **ServiceWorker 集成**: 离线模式支持
3. **缓存预热**: 页面加载时预加载热门图片
4. **智能淘汰**: 基于图片大小而不是固定数量
5. **缓存策略切换**: 支持 LRU/LFU/FIFO 等多种策略
6. **加密存储**: 对敏感图片进行加密缓存

---

## 总结

这个图片缓存系统提供了:
- ✅ 高效的 LRU 缓存机制
- ✅ 自动的 Blob URL 生命周期管理
- ✅ 与 LazyImage 组件的无缝集成
- ✅ 实时的缓存统计显示
- ✅ 详细的调试日志输出
- ✅ 简洁的 Vue Composable API

参考了 chronoframe 项目的最佳实践，结合 homePage 的具体需求进行实现。
