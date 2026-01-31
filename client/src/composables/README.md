# LivePhoto 缓存系统

## 功能特性

✅ **智能缓存管理**
- 24小时缓存有效期
- 最多缓存50个视频
- 自动清理过期缓存（每10分钟）

✅ **高性能加载**
- 流式下载支持大文件
- 实时进度反馈
- 断点续传支持
- 30秒下载超时

✅ **容错机制**
- 最多重试3次
- 指数退避算法
- 视频格式验证

✅ **内存优化**
- Blob缓存减少网络请求
- URL自动释放防止内存泄漏
- LRU淘汰策略

## 使用方法

### 1. 在组件中使用

```vue
<template>
  <LivePhoto
    :image-url="photo.imageUrl"
    :video-url="photo.videoUrl"
    :is-live="true"
    :photo-id="photo._id"
  />
</template>
```

### 2. 缓存 API

```typescript
import { useLivePhotoCache } from '@/composables/useLivePhotoCache'

const { loadLivePhoto, getState, getStats, clearCache } = useLivePhotoCache()

// 加载视频
const blob = await loadLivePhoto(videoUrl, photoId)

// 获取状态
const state = getState(photoId).value
console.log(state.progress) // 0-100

// 获取统计
const stats = getStats()
console.log(stats.totalSizeMB) // 缓存占用空间

// 清空缓存
clearCache()
```

## 缓存状态

```typescript
interface LivePhotoState {
  isProcessing: boolean   // 是否正在下载
  progress: number        // 下载进度 0-100
  videoBlob: Blob | null  // 缓存的视频数据
  error: string | null    // 错误信息
  lastAccessed: number    // 最后访问时间
  retryCount: number      // 重试次数
}
```

## 性能优势

| 指标 | 无缓存 | 有缓存 |
|------|--------|--------|
| 首次加载 | 2-5秒 | 2-5秒 |
| 重复播放 | 2-5秒 | **<100ms** |
| 网络请求 | 每次 | **0次** |
| 内存占用 | 0MB | ~50-200MB |

## 注意事项

1. **必须传入 photoId**：用于缓存标识，建议使用数据库ID
2. **自动清理**：24小时后自动清理，无需手动管理
3. **内存限制**：最多缓存50个视频，超出后按LRU淘汰
4. **preload="none"**：视频标签使用 `preload="none"` 避免自动下载

## 调试

```javascript
// 查看缓存统计
const { getStats } = useLivePhotoCache()
console.log(getStats())
// { total: 15, processed: 12, processing: 1, failed: 2, totalSizeMB: 45.6 }

// 查看单个视频状态
const { getState } = useLivePhotoCache()
const state = getState('photo123').value
console.log(state)
```
