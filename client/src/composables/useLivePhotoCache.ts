import { ref, computed, readonly, onScopeDispose } from 'vue'
import { useLivePhotoPersist } from './useLivePhotoPersist'
import { APP_CONFIG } from '@/config'

interface LivePhotoState {
  isProcessing: boolean
  progress: number
  videoBlob: Blob | null
  error: string | null
  lastAccessed: number
  retryCount: number
}

type LivePhotoLoadPriority = 'foreground' | 'background'

interface LivePhotoLoadOptions {
  priority?: LivePhotoLoadPriority
  persistToDisk?: boolean
}

interface DownloadRequest {
  promise: Promise<Blob | null>
  controller: AbortController
  priority: LivePhotoLoadPriority
}

const livePhotoCache = ref<Map<string, LivePhotoState>>(new Map())
const preloadSuspended = ref(false)
const downloadingRequests = new Map<string, DownloadRequest>()
const backgroundDownloadLimit = APP_CONFIG.livePhoto.preloadBatchSize
const backgroundWaitQueue: Array<(release: (() => void) | null) => void> = []

let activeBackgroundDownloads = 0

let cleanupTimer: ReturnType<typeof setInterval> | null = null
let refCount = 0

export const useLivePhotoCache = () => {
  const config = APP_CONFIG.cache.livePhoto
  const persist = useLivePhotoPersist()

  const isAbortError = (error: unknown) => {
    return (
      (error instanceof DOMException && error.name === 'AbortError') ||
      (error instanceof Error && error.name === 'AbortError')
    )
  }

  const createBackgroundRelease = () => {
    activeBackgroundDownloads += 1
    let released = false

    return () => {
      if (released) {
        return
      }

      released = true
      activeBackgroundDownloads = Math.max(0, activeBackgroundDownloads - 1)
      flushBackgroundQueue()
    }
  }

  const clearBackgroundQueue = () => {
    while (backgroundWaitQueue.length > 0) {
      const resolve = backgroundWaitQueue.shift()
      resolve?.(null)
    }
  }

  const flushBackgroundQueue = () => {
    if (preloadSuspended.value) {
      clearBackgroundQueue()
      return
    }

    while (
      activeBackgroundDownloads < backgroundDownloadLimit &&
      backgroundWaitQueue.length > 0
    ) {
      const resolve = backgroundWaitQueue.shift()
      resolve?.(createBackgroundRelease())
    }
  }

  const acquireBackgroundSlot = (): Promise<(() => void) | null> => {
    if (preloadSuspended.value) {
      return Promise.resolve(null)
    }

    if (activeBackgroundDownloads < backgroundDownloadLimit) {
      return Promise.resolve(createBackgroundRelease())
    }

    return new Promise((resolve) => {
      backgroundWaitQueue.push(resolve)
    })
  }

  const loadLivePhoto = async (
    videoUrl: string,
    photoId: string,
    options: LivePhotoLoadOptions = {},
  ): Promise<Blob | null> => {
    const priority = options.priority ?? 'foreground'
    const persistToDisk = options.persistToDisk ?? true

    if (priority === 'background' && preloadSuspended.value) {
      return null
    }

    const activeRequest = downloadingRequests.get(photoId)
    if (activeRequest) {
      if (priority === 'foreground' && activeRequest.priority === 'background') {
        activeRequest.priority = 'foreground'
      }

      return activeRequest.promise
    }

    const cached = livePhotoCache.value.get(photoId)
    const now = Date.now()

    if (cached?.videoBlob && (now - cached.lastAccessed) < config.cacheExpiry) {
      cached.lastAccessed = now
      return cached.videoBlob
    }

    const persistedBlob = await persist.loadVideo(photoId)
    if (persistedBlob) {
      const state: LivePhotoState = {
        isProcessing: false,
        progress: 100,
        videoBlob: persistedBlob,
        error: null,
        lastAccessed: now,
        retryCount: 0
      }
      livePhotoCache.value.set(photoId, state)
      return persistedBlob
    }

    if (cached?.isProcessing) {
      return waitForProcessing(photoId)
    }

    const currentRetry = cached?.retryCount || 0
    if (currentRetry >= config.maxRetries) {
      return null
    }

    const controller = new AbortController()
    const request: DownloadRequest = {
      controller,
      priority,
      promise: Promise.resolve(null),
    }

    const loadPromise = (async () => {
      let releaseBackgroundSlot: (() => void) | null = null
      const state: LivePhotoState = {
        isProcessing: true,
        progress: 0,
        videoBlob: null,
        error: null,
        lastAccessed: now,
        retryCount: currentRetry
      }
      livePhotoCache.value.set(photoId, state)

      try {
        if (priority === 'background') {
          releaseBackgroundSlot = await acquireBackgroundSlot()

          if (!releaseBackgroundSlot || preloadSuspended.value) {
            state.isProcessing = false
            state.progress = 0
            state.error = null
            state.lastAccessed = Date.now()
            livePhotoCache.value.set(photoId, { ...state })
            return null
          }
        }

        const blob = await downloadVideo(videoUrl, (progress) => {
          state.progress = progress
          livePhotoCache.value.set(photoId, { ...state })
        }, controller.signal)

        await validateVideo(blob)

        state.isProcessing = false
        state.progress = 100
        state.videoBlob = blob
        state.error = null
        state.lastAccessed = now
        livePhotoCache.value.set(photoId, { ...state })

        if (persistToDisk) {
          await persist.saveVideo(photoId, blob)
        }

        cleanupCache()

        return blob
      } catch (error) {
        if (isAbortError(error)) {
          state.isProcessing = false
          state.progress = 0
          state.error = null
          state.lastAccessed = Date.now()
          livePhotoCache.value.set(photoId, { ...state })
          return null
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        if (currentRetry < config.maxRetries - 1) {
          state.retryCount = currentRetry + 1
          state.isProcessing = false
          state.error = `重试中 (${currentRetry + 1}/${config.maxRetries})`
          livePhotoCache.value.set(photoId, { ...state })
          
          const delay = Math.min(1000 * Math.pow(2, currentRetry), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          downloadingRequests.delete(photoId)
          
          return loadLivePhoto(videoUrl, photoId, { priority, persistToDisk })
        }
        
        state.isProcessing = false
        state.error = errorMessage
        state.lastAccessed = now
        livePhotoCache.value.set(photoId, { ...state })
        return null
      } finally {
        releaseBackgroundSlot?.()
        downloadingRequests.delete(photoId)
      }
    })()

    request.promise = loadPromise
    downloadingRequests.set(photoId, request)

    return loadPromise
  }

  const downloadVideo = async (
    url: string, 
    onProgress: (progress: number) => void,
    signal?: AbortSignal,
  ): Promise<Blob> => {
    const controller = new AbortController()
    const handleAbort = () => controller.abort()
    signal?.addEventListener('abort', handleAbort, { once: true })
    const timeoutId = setTimeout(() => controller.abort(), config.downloadTimeout)
    
    try {
      const response = await fetch(url, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      onProgress(10)

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response reader')

      const chunks: Uint8Array[] = []
      const contentLength = parseInt(response.headers.get('content-length') || '0')
      let receivedLength = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        chunks.push(value as Uint8Array)
        receivedLength += value.length
        
        if (contentLength > 0) {
          const progress = 10 + (receivedLength / contentLength) * 80
          onProgress(Math.round(progress))
        }
      }

      onProgress(90)
      const blob = new Blob(chunks as any, { type: 'video/mp4' })
      return blob
    } finally {
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', handleAbort)
    }
  }

  const validateVideo = (blob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const video = document.createElement('video')
      
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url)
        reject(new Error('Video validation timeout'))
      }, config.validationTimeout)
      
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

  const waitForProcessing = (photoId: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
      let checkInterval: ReturnType<typeof setInterval> | null = null
      const timeout = setTimeout(() => {
        if (checkInterval) {
          clearInterval(checkInterval)
          checkInterval = null
        }
        resolve(null)
      }, config.downloadTimeout)
      
      checkInterval = setInterval(() => {
        const state = livePhotoCache.value.get(photoId)
        if (state && !state.isProcessing) {
          if (checkInterval) {
            clearInterval(checkInterval)
            checkInterval = null
          }
          clearTimeout(timeout)
          resolve(state.videoBlob)
        }
      }, 100)
    })
  }

  const cleanupCache = () => {
    const now = Date.now()
    const entries = Array.from(livePhotoCache.value.entries())
    
    entries.forEach(([photoId, state]) => {
      if (now - state.lastAccessed > config.cacheExpiry) {
        livePhotoCache.value.delete(photoId)
      }
    })
    
    if (livePhotoCache.value.size > config.maxCacheSize) {
      const sorted = entries
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
        .slice(0, livePhotoCache.value.size - config.maxCacheSize)
      
      sorted.forEach(([photoId]) => {
        livePhotoCache.value.delete(photoId)
      })
    }
  }

  const preloadVideos = async (
    videos: Array<{ id: string; videoUrl: string }>,
    maxConcurrent = APP_CONFIG.livePhoto.preloadBatchSize
  ) => {
    for (let i = 0; i < videos.length; i += maxConcurrent) {
      const batch = videos.slice(i, i + maxConcurrent)
      await Promise.allSettled(
        batch.map(video => loadLivePhoto(video.videoUrl, video.id, { priority: 'background' }))
      )
      
      if (i + maxConcurrent < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  const preloadVideosInViewport = async (
    videos: Array<{ id: string; videoUrl: string; isVisible?: boolean }>,
    options: {
      maxConcurrent?: number
      prioritizeVisible?: boolean
      prefetchDistance?: number
    } = {}
  ) => {
    const { maxConcurrent = APP_CONFIG.livePhoto.preloadBatchSize, prioritizeVisible = true, prefetchDistance = APP_CONFIG.livePhoto.prefetchDistance } = options
    
    const liveVideos = videos.filter(video => video.videoUrl)
    
    if (prioritizeVisible) {
      const visibleVideos = liveVideos.filter(video => video.isVisible)
      const nearbyVideos = liveVideos.filter(video => !video.isVisible).slice(0, prefetchDistance)
      
      if (visibleVideos.length > 0) {
        await processBatch(visibleVideos, maxConcurrent)
      }
      
      if (nearbyVideos.length > 0) {
        processBatch(nearbyVideos, Math.min(maxConcurrent, 1))
      }
    } else {
      await processBatch(liveVideos, maxConcurrent)
    }
  }

  const processBatch = async (
    videos: Array<{ id: string; videoUrl: string }>,
    maxConcurrent: number
  ) => {
    for (let i = 0; i < videos.length; i += maxConcurrent) {
      const batch = videos.slice(i, i + maxConcurrent)
      await Promise.allSettled(
        batch.map(video => loadLivePhoto(video.videoUrl, video.id, { priority: 'background' }))
      )
      
      if (i + maxConcurrent < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  const getState = (photoId: string) => {
    return computed(() => livePhotoCache.value.get(photoId) || null)
  }

  const suspendPreloads = () => {
    preloadSuspended.value = true
    clearBackgroundQueue()

    downloadingRequests.forEach((request, photoId) => {
      if (request.priority !== 'background') {
        return
      }

      request.controller.abort()

      const state = livePhotoCache.value.get(photoId)
      if (!state) {
        return
      }

      state.isProcessing = false
      state.progress = 0
      state.error = null
      state.lastAccessed = Date.now()
      livePhotoCache.value.set(photoId, { ...state })
    })
  }

  const resumePreloads = () => {
    preloadSuspended.value = false
    flushBackgroundQueue()
  }

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

  const clearCache = () => {
    livePhotoCache.value.clear()
  }

  const startCleanupTimer = () => {
    if (cleanupTimer) return
    cleanupTimer = setInterval(cleanupCache, config.cleanupInterval)
  }

  const stopCleanupTimer = () => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer)
      cleanupTimer = null
    }
  }

  if (typeof window !== 'undefined') {
    refCount++
    startCleanupTimer()

    onScopeDispose(() => {
      refCount--
      if (refCount <= 0) {
        stopCleanupTimer()
        refCount = 0
      }
    })
  }

  return {
    loadLivePhoto,
    preloadVideos,
    preloadVideosInViewport,
    suspendPreloads,
    resumePreloads,
    preloadSuspended: readonly(preloadSuspended),
    getState,
    getStats,
    clearCache,
    cache: readonly(livePhotoCache),
    persist
  }
}
