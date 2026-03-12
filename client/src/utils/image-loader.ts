import { LRUCache } from './lru'
import { APP_CONFIG } from '@/config'

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

const config = APP_CONFIG.cache.image

const normalImageCache: LRUCache<string, ImageLoaderCacheResult> = new LRUCache<
  string,
  ImageLoaderCacheResult
>(config.maxSize, (cacheItem) => {
  try {
    URL.revokeObjectURL(cacheItem.blobSrc)
  } catch {
    // ignore
  }
})

export class ImageLoaderManager {
  private lastXHR: XMLHttpRequest | null = null
  private timer: ReturnType<typeof setTimeout> | null = null

  private async isValidImageBlob(blob: Blob): Promise<boolean> {
    if (blob.size === 0) return false
    if (!blob.type.startsWith('image/')) return false
    return true
  }

  async loadImage(
    src: string,
    callbacks: ImageLoaderCallbacks = {},
  ): Promise<ImageLoaderResult> {
    const { onProgress, onError, onUpdateLoadingState } = callbacks

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
                onError?.()
                onUpdateLoadingState?.({
                  isVisible: false,
                })
                this.timer = null
                reject(new Error('Invalid image format'))
                return
              }

              const processResult = await this.processNormalImage(
                blob,
                src,
                callbacks,
              )
              this.timer = null
              resolve(processResult)
            } catch (err) {
              onError?.()
              onUpdateLoadingState?.({
                isVisible: false,
              })
              this.timer = null
              reject(err)
            }
          } else {
            onError?.()
            onUpdateLoadingState?.({
              isVisible: false,
            })
            this.timer = null
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
          onError?.()
          onUpdateLoadingState?.({
            isVisible: false,
          })
          this.timer = null
          reject(new Error(`Failed to load image`))
        }

        xhr.send()

        this.lastXHR = xhr
      }, config.loadDelay)
    })
  }

  async processNormalImage(
    blob: Blob,
    originalUrl: string,
    callbacks: ImageLoaderCallbacks,
  ): Promise<ImageLoaderResult> {
    const { onUpdateLoadingState } = callbacks
    const cacheKey = originalUrl
    const cacheResult = normalImageCache.get(cacheKey)

    if (cacheResult) {
      onUpdateLoadingState?.({
        isVisible: false,
      })
      return {
        blobSrc: cacheResult.blobSrc,
        size: cacheResult.originalSize,
      }
    }

    const url = URL.createObjectURL(blob)

    const result: ImageLoaderCacheResult = {
      blobSrc: url,
      originalSize: blob.size,
      format: blob.type,
      blob,
    }

    normalImageCache.set(cacheKey, result)
    onUpdateLoadingState?.({
      isVisible: false,
    })

    return {
      blobSrc: url,
      size: blob.size,
    }
  }

  getCacheStats() {
    return {
      count: normalImageCache.size,
      maxSize: config.maxSize,
    }
  }

  clearCache(): void {
    normalImageCache.clear()
  }

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

export const imageLoaderManager = new ImageLoaderManager()
