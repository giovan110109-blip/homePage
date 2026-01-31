/**
 * 缓存管理器 - 与 Service Worker 交互
 */

export const cacheManager = {
  /**
   * 检查浏览器是否支持 Service Worker
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator
  },

  /**
   * 注册 Service Worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('当前浏览器不支持 Service Worker')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      })
      return registration
    } catch (error) {
      console.error('[CacheManager] Service Worker 注册失败:', error)
      return null
    }
  },

  /**
   * 获取缓存大小（MB）
   */
  async getCacheSize(): Promise<number> {
    if (!this.isSupported() || !('storage' in navigator) || !('estimate' in navigator.storage)) {
      return 0
    }

    try {
      const estimate = await navigator.storage.estimate()
      const usedMB = (estimate.usage || 0) / (1024 * 1024)
      return Math.round(usedMB * 100) / 100
    } catch {
      return 0
    }
  },

  /**
   * 清空所有缓存
   */
  async clearCache(): Promise<boolean> {
    if (!this.isSupported()) {
      return false
    }

    try {
      // 方案1: 通过 Service Worker 清空
      const registration = await navigator.serviceWorker.ready
      if (registration.active) {
        const channel = new MessageChannel()
        registration.active.postMessage(
          { type: 'CLEAR_CACHE' },
          [channel.port2]
        )

        // 等待 Service Worker 回复
        return await new Promise((resolve) => {
          channel.port1.onmessage = (event) => {
            resolve(event.data.cleared === true)
          }
          // 超时设置
          setTimeout(() => resolve(false), 5000)
        })
      }

      // 方案2: 直接清空所有缓存
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map((cacheName) =>
          cacheName.includes('homepage') ? caches.delete(cacheName) : Promise.resolve()
        )
      )
      return true
    } catch (error) {
      console.error('[CacheManager] 清空缓存失败:', error)
      return false
    }
  },

  /**
   * 清空指定URL的缓存
   */
  async clearUrlCache(url: string): Promise<boolean> {
    if (!this.isSupported()) {
      return false
    }

    try {
      const cache = await caches.open('homepage-images-v3')
      const result = await cache.delete(url)
      console.log(`[CacheManager] 清空 ${url} 的缓存:`, result)
      return result
    } catch (error) {
      console.error('[CacheManager] 清空URL缓存失败:', error)
      return false
    }
  },

  /**
   * 预加载URL到缓存
   */
  async preloadUrl(url: string): Promise<boolean> {
    if (!this.isSupported()) {
      return false
    }

    try {
      const cache = await caches.open('homepage-images-v3')
      const response = await fetch(url)
      if (response.ok) {
        await cache.put(url, response.clone())
        return true
      }
      return false
    } catch (error) {
      console.error('[CacheManager] 预加载失败:', error)
      return false
    }
  }
}
