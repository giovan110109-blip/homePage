import { LRUCache } from './lru'

export interface ImageLoaderState {
  isVisible: boolean
  isHeic?: boolean
  progress?: number
  bytesLoaded?: number
  bytesTotal?: number
  isConverting?: boolean
  message?: string
  codec?: string
}

export interface ImageLoaderCallbacks {
  onProgress?: (progress: number) => void
  onError?: () => void
  onUpdateLoadingState?: (state: Partial<ImageLoaderState>) => void
}

export interface ImageLoaderResult {
  blobSrc: string
  resultUrl?: string
  size: number
}

export interface ImageLoaderCacheResult {
  blobSrc: string
  originalSize: number
  format: string
  blob: Blob
}

// 图片缓存 (LRU，20 个图片 - 增加缓存容量避免频繁加载)
const normalImageCache: LRUCache<string, ImageLoaderCacheResult> = new LRUCache<
  string,
  ImageLoaderCacheResult
>(20, (cacheItem, cacheKey, reason) => {
  try {
    URL.revokeObjectURL(cacheItem.blobSrc)
    console.log(
      `🗑️ 已释放 Blob URL - ${cacheKey} (${reason}) | 大小: ${(cacheItem.originalSize / 1024 / 1024).toFixed(2)}MB`
    )
  } catch (err) {
    console.warn(`❌ Blob URL 释放失败 (${cacheKey}):`, err)
  }
})

/**
 * 图片加载管理器
 * 支持内存 LRU 缓存和 Blob 对象管理
 */
export class ImageLoaderManager {
  private lastXHR: XMLHttpRequest | null = null
  private timer: ReturnType<typeof setTimeout> | null = null

  /**
   * 验证是否是有效的图片 Blob
   */
  private async isValidImageBlob(blob: Blob): Promise<boolean> {
    if (blob.size === 0) return false

    // 检查 MIME 类型
    if (!blob.type.startsWith('image/')) {
      return false
    }

    return true
  }

  /**
   * 加载图片 (带缓存)
   */
  async loadImage(
    src: string,
    callbacks: ImageLoaderCallbacks = {},
  ): Promise<ImageLoaderResult> {
    const { onProgress, onError, onUpdateLoadingState } = callbacks

    // 检查内存缓存
    const cached = normalImageCache.get(src)
    if (cached) {
      onUpdateLoadingState?.({
        isVisible: false,
      })
      return {
        blobSrc: cached.blobSrc,
        size: cached.originalSize,
      }
    }

    onUpdateLoadingState?.({
      isVisible: true,
    })

    return new Promise((resolve, reject) => {
      this.timer = setTimeout(async () => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', src)
        xhr.responseType = 'blob'

        xhr.onload = async () => {
          if (xhr.status === 200) {
            try {
              const blob = xhr.response as Blob

              if (!(await this.isValidImageBlob(blob))) {
                console.warn(`⚠️ 无效的图片格式: ${src}`)
                onError?.()
                onUpdateLoadingState?.({
                  isVisible: false,
                })
                reject(new Error('Invalid image format'))
                return
              }

              const processResult = await this.processNormalImage(
                blob,
                src,
                callbacks,
              )
              resolve(processResult)
            } catch (err) {
              console.error(`❌ 处理图片失败: ${src}`, err)
              onError?.()
              onUpdateLoadingState?.({
                isVisible: false,
              })
              reject(err)
            }
          } else {
            console.error(`❌ 图片加载失败: ${xhr.status}`)
            onError?.()
            onUpdateLoadingState?.({
              isVisible: false,
            })
            reject(new Error(`Failed to load image: ${xhr.status}`))
          }
        }

        xhr.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100
            onProgress?.(progress)
            onUpdateLoadingState?.({
              progress,
              bytesLoaded: event.loaded,
              bytesTotal: event.total,
            })
          }
        }

        xhr.onerror = () => {
          console.error(`❌ 图片加载网络错误: ${src}`)
          onError?.()
          onUpdateLoadingState?.({
            isVisible: false,
          })
          reject(new Error(`Failed to load image`))
        }

        xhr.send()

        this.lastXHR = xhr
      }, 300)
    })
  }

  /**
   * 处理普通图片（创建缓存）
   */
  async processNormalImage(
    blob: Blob,
    originalUrl: string,
    callbacks: ImageLoaderCallbacks,
  ): Promise<ImageLoaderResult> {
    const { onUpdateLoadingState } = callbacks
    const cacheKey = originalUrl
    const cacheResult = normalImageCache.get(cacheKey)

    if (cacheResult) {
      console.log(`✅ 从缓存返回: ${cacheKey}`)
      onUpdateLoadingState?.({
        isVisible: false,
      })
      return {
        blobSrc: cacheResult.blobSrc,
        size: cacheResult.originalSize,
      }
    }

    // 创建 Object URL
    const url = URL.createObjectURL(blob)

    const result: ImageLoaderCacheResult = {
      blobSrc: url,
      originalSize: blob.size,
      format: blob.type,
      blob,
    }

    // 缓存结果
    normalImageCache.set(cacheKey, result)
    onUpdateLoadingState?.({
      isVisible: false,
    })

    return {
      blobSrc: url,
      size: blob.size,
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      count: normalImageCache.size,
      maxSize: 20,
    }
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    normalImageCache.clear()
    console.log('🗑️ 已清空所有图片缓存')
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.lastXHR) {
      this.lastXHR.abort()
      this.lastXHR = null
    }

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}

// 全局单例
export const imageLoaderManager = new ImageLoaderManager()
