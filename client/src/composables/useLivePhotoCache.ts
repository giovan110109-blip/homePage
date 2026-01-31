import { ref, computed, readonly } from 'vue'
import { useLivePhotoPersist } from './useLivePhotoPersist'

interface LivePhotoState {
  isProcessing: boolean
  progress: number
  videoBlob: Blob | null
  error: string | null
  lastAccessed: number
  retryCount: number
}

// 全局缓存存储
const livePhotoCache = ref<Map<string, LivePhotoState>>(new Map())

// 正在进行的下载请求（去重）
const downloadingRequests = new Map<string, Promise<Blob | null>>()

export const useLivePhotoCache = () => {
  const MAX_RETRIES = 3
  const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24小时
  const MAX_CACHE_SIZE = 50 // 最多缓存50个视频
  const DOWNLOAD_TIMEOUT = 30000 // 30秒下载超时

  // 持久化缓存
  const persist = useLivePhotoPersist()

  /**
   * 加载并缓存 LivePhoto 视频
   */
  const loadLivePhoto = async (videoUrl: string, photoId: string): Promise<Blob | null> => {
    // 🚀 请求去重：如果已经在下载，直接返回现有的 Promise
    if (downloadingRequests.has(photoId)) {
      console.log(`♻️ 请求去重: ${photoId} (复用现有请求)`)
      return downloadingRequests.get(photoId)!
    }

    // 第1步：检查内存缓存
    const cached = livePhotoCache.value.get(photoId)
    const now = Date.now()

    if (cached?.videoBlob && (now - cached.lastAccessed) < CACHE_EXPIRY) {
      cached.lastAccessed = now
      console.log(`✅ 内存缓存命中: ${photoId}`, {
        size: (cached.videoBlob.size / 1024 / 1024).toFixed(2) + 'MB',
        age: Math.round((now - cached.lastAccessed) / 1000) + 's'
      })
      return cached.videoBlob
    }

    // 第2步：检查 IndexedDB（持久化缓存）
    console.log(`🔍 检查 IndexedDB: ${photoId}`)
    const persistedBlob = await persist.loadVideo(photoId)
    if (persistedBlob) {
      // 恢复到内存缓存
      const state: LivePhotoState = {
        isProcessing: false,
        progress: 100,
        videoBlob: persistedBlob,
        error: null,
        lastAccessed: now,
        retryCount: 0
      }
      livePhotoCache.value.set(photoId, state)
      console.log(`📥 已从 IndexedDB 恢复: ${photoId}`)
      return persistedBlob
    }

    // 第3步：等待正在处理的任务
    if (cached?.isProcessing) {
      console.log(`⏳ 等待处理: ${photoId}`)
      return waitForProcessing(photoId)
    }

    // 第4步：检查重试次数
    const currentRetry = cached?.retryCount || 0
    if (currentRetry >= MAX_RETRIES) {
      console.warn(`❌ 重试次数已满: ${photoId}`)
      return null
    }

    // 创建并缓存此请求的 Promise
    const loadPromise = (async () => {
      // 第5步：初始化处理状态
      const state: LivePhotoState = {
        isProcessing: true,
        progress: 0,
        videoBlob: null,
        error: null,
        lastAccessed: now,
        retryCount: currentRetry
      }
      livePhotoCache.value.set(photoId, state)
      console.log(`🔄 开始加载: ${photoId} (尝试 ${currentRetry + 1}/${MAX_RETRIES})`)

      try {
        // 下载视频
        const blob = await downloadVideo(videoUrl, (progress) => {
          state.progress = progress
          livePhotoCache.value.set(photoId, { ...state })
        })

        console.log(`📥 下载完成: ${photoId} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`)

        // 验证视频
        await validateVideo(blob)
        console.log(`✓ 验证通过: ${photoId}`)

        // 缓存成功
        state.isProcessing = false
        state.progress = 100
        state.videoBlob = blob
        state.error = null
        state.lastAccessed = now
        livePhotoCache.value.set(photoId, { ...state })

        console.log(`💾 已缓存: ${photoId}`)

        // 保存到 IndexedDB（必须等待完成）
        const saved = await persist.saveVideo(photoId, blob)
        console.log(`${saved ? '✅' : '⚠️'} IndexedDB 持久化: ${photoId}`)

        // 清理过期缓存
        cleanupCache()

        return blob
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // 重试逻辑
        if (currentRetry < MAX_RETRIES - 1) {
          console.warn(`⚠️ 加载失败 (${currentRetry + 1}/${MAX_RETRIES}): ${errorMessage}`)
          state.retryCount = currentRetry + 1
          state.isProcessing = false
          state.error = `重试中 (${currentRetry + 1}/${MAX_RETRIES})`
          livePhotoCache.value.set(photoId, { ...state })
          
          // 指数退避
          const delay = Math.min(1000 * Math.pow(2, currentRetry), 5000)
          console.log(`⏸️ 延迟 ${delay}ms 后重试...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          // 移除请求记录，以允许重试
          downloadingRequests.delete(photoId)
          
          return loadLivePhoto(videoUrl, photoId)
        }
        
        // 最终失败
        state.isProcessing = false
        state.error = errorMessage
        state.lastAccessed = now
        livePhotoCache.value.set(photoId, { ...state })
        console.error(`❌ 加载失败 (最终): ${photoId}`, error)
        return null
      } finally {
        // 清理请求记录
        downloadingRequests.delete(photoId)
      }
    })()

    // 缓存此请求
    downloadingRequests.set(photoId, loadPromise)

    return loadPromise
  }

  /**
   * 下载视频（带进度）
   */
  const downloadVideo = async (
    url: string, 
    onProgress: (progress: number) => void
  ): Promise<Blob> => {
    console.log(`📡 开始下载: ${url}`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT)
    
    try {
      const response = await fetch(url, {
        signal: controller.signal
        // 移除 Cache-Control 头以避免 CORS 预检失败
      })
      
      clearTimeout(timeoutId)
      
      console.log(`✅ 响应状态: ${response.status}, Content-Length: ${response.headers.get('content-length')}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      onProgress(10)

      // 流式下载
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response reader')

      const chunks: Uint8Array[] = []
      const contentLength = parseInt(response.headers.get('content-length') || '0')
      let receivedLength = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        chunks.push(value)
        receivedLength += value.length
        
        if (contentLength > 0) {
          const progress = 10 + (receivedLength / contentLength) * 80 // 10-90%
          onProgress(Math.round(progress))
        }
      }

      onProgress(90)
      const blob = new Blob(chunks, { type: 'video/mp4' })
      console.log(`✅ 下载完成: ${(blob.size / 1024 / 1024).toFixed(2)}MB`)
      return blob
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 验证视频可播放性
   */
  const validateVideo = (blob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const video = document.createElement('video')
      
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url)
        reject(new Error('Video validation timeout'))
      }, 5000)
      
      video.onloadedmetadata = () => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        resolve()
      }
      
      video.onerror = () => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        reject(new Error('Invalid video format'))
      }
      
      video.src = url
      video.load()
    })
  }

  /**
   * 等待正在处理的任务
   */
  const waitForProcessing = (photoId: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 30000) // 30秒超时
      
      const checkInterval = setInterval(() => {
        const state = livePhotoCache.value.get(photoId)
        if (state && !state.isProcessing) {
          clearInterval(checkInterval)
          clearTimeout(timeout)
          resolve(state.videoBlob)
        }
      }, 100)
    })
  }

  /**
   * 清理过期缓存
   */
  const cleanupCache = () => {
    const now = Date.now()
    const entries = Array.from(livePhotoCache.value.entries())
    
    // 清理过期条目
    entries.forEach(([photoId, state]) => {
      if (now - state.lastAccessed > CACHE_EXPIRY) {
        livePhotoCache.value.delete(photoId)
      }
    })
    
    // 限制缓存大小
    if (livePhotoCache.value.size > MAX_CACHE_SIZE) {
      const sorted = entries
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
        .slice(0, livePhotoCache.value.size - MAX_CACHE_SIZE)
      
      sorted.forEach(([photoId]) => {
        livePhotoCache.value.delete(photoId)
      })
    }
  }

  /**
   * 批量预加载
   */
  const preloadVideos = async (
    videos: Array<{ id: string; videoUrl: string }>,
    maxConcurrent = 2
  ) => {
    for (let i = 0; i < videos.length; i += maxConcurrent) {
      const batch = videos.slice(i, i + maxConcurrent)
      await Promise.allSettled(
        batch.map(video => loadLivePhoto(video.videoUrl, video.id))
      )
      
      if (i + maxConcurrent < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  /**
   * 获取处理状态
   */
  const getState = (photoId: string) => {
    return computed(() => livePhotoCache.value.get(photoId) || null)
  }

  /**
   * 获取缓存统计
   */
  const getStats = () => {
    let processed = 0
    let processing = 0
    let failed = 0
    let totalSize = 0
    
    livePhotoCache.value.forEach(state => {
      if (state.videoBlob) {
        processed++
        totalSize += state.videoBlob.size
      } else if (state.isProcessing) {
        processing++
      } else if (state.error) {
        failed++
      }
    })
    
    return {
      total: livePhotoCache.value.size,
      processed,
      processing,
      failed,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
    }
  }

  /**
   * 清空所有缓存
   */
  const clearCache = () => {
    livePhotoCache.value.clear()
    console.log('LivePhoto cache cleared')
  }

  // 定期清理（每10分钟）
  if (typeof window !== 'undefined') {
    setInterval(cleanupCache, 10 * 60 * 1000)
  }

  return {
    loadLivePhoto,
    preloadVideos,
    getState,
    getStats,
    clearCache,
    cache: readonly(livePhotoCache),
    // 持久化接口
    persist
  }
}
