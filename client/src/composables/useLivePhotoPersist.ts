import { ref, onUnmounted } from 'vue'
import { APP_CONFIG } from '@/config'

interface CacheEntry {
  photoId: string
  blob: Blob
  timestamp: number
}

let dbInstance: IDBDatabase | null = null
let cleanupInterval: ReturnType<typeof setInterval> | null = null

export const useLivePhotoPersist = () => {
  const config = APP_CONFIG.db.livePhoto
  const cacheConfig = APP_CONFIG.cache.livePhoto
  const isReady = ref(false)

  const initDB = async (): Promise<IDBDatabase> => {
    if (dbInstance) return dbInstance

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(config.name, config.version)

      request.onerror = () => {
        reject(request.error)
      }

      request.onsuccess = () => {
        dbInstance = request.result
        isReady.value = true
        resolve(dbInstance)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(config.storeName)) {
          const store = db.createObjectStore(config.storeName, { keyPath: 'photoId' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  const saveVideo = async (photoId: string, blob: Blob): Promise<boolean> => {
    if (!dbInstance) {
      try {
        await initDB()
      } catch {
        return false
      }
    }

    return new Promise((resolve) => {
      try {
        const transaction = dbInstance!.transaction([config.storeName], 'readwrite')
        const store = transaction.objectStore(config.storeName)

        const entry: CacheEntry = {
          photoId,
          blob,
          timestamp: Date.now()
        }

        const request = store.put(entry)

        request.onerror = () => {
          resolve(false)
        }

        request.onsuccess = () => {
          resolve(true)
        }

        transaction.onerror = () => {
          resolve(false)
        }
      } catch {
        resolve(false)
      }
    })
  }

  const loadVideo = async (photoId: string): Promise<Blob | null> => {
    if (!dbInstance) {
      try {
        await initDB()
      } catch {
        return null
      }
    }

    return new Promise((resolve) => {
      try {
        const transaction = dbInstance!.transaction([config.storeName], 'readonly')
        const store = transaction.objectStore(config.storeName)
        const request = store.get(photoId)

        request.onerror = () => {
          resolve(null)
        }

        request.onsuccess = () => {
          const entry = request.result as CacheEntry | undefined

          if (!entry) {
            resolve(null)
            return
          }

          const age = Date.now() - entry.timestamp
          if (age > cacheConfig.cacheExpiry) {
            deleteVideo(photoId).catch(() => {})
            resolve(null)
            return
          }

          resolve(entry.blob)
        }

        transaction.onerror = () => {
          resolve(null)
        }
      } catch {
        resolve(null)
      }
    })
  }

  const deleteVideo = async (photoId: string): Promise<boolean> => {
    if (!dbInstance) return false

    return new Promise((resolve) => {
      const transaction = dbInstance!.transaction([config.storeName], 'readwrite')
      const store = transaction.objectStore(config.storeName)
      const request = store.delete(photoId)

      request.onerror = () => {
        resolve(false)
      }

      request.onsuccess = () => {
        resolve(true)
      }
    })
  }

  const cleanupExpired = async (): Promise<number> => {
    if (!dbInstance) return 0

    return new Promise((resolve) => {
      const transaction = dbInstance!.transaction([config.storeName], 'readwrite')
      const store = transaction.objectStore(config.storeName)
      const index = store.index('timestamp')
      
      let deletedCount = 0
      const cutoff = Date.now() - cacheConfig.cacheExpiry

      const range = IDBKeyRange.upperBound(cutoff)
      const request = index.openCursor(range)

      request.onerror = () => {
        resolve(deletedCount)
      }

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          store.delete(cursor.primaryKey)
          deletedCount++
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }
    })
  }

  const getStats = async (): Promise<{
    count: number
    totalSize: number
  }> => {
    if (!dbInstance) return { count: 0, totalSize: 0 }

    return new Promise((resolve) => {
      const transaction = dbInstance!.transaction([config.storeName], 'readonly')
      const store = transaction.objectStore(config.storeName)
      const request = store.getAll()

      request.onerror = () => {
        resolve({ count: 0, totalSize: 0 })
      }

      request.onsuccess = () => {
        const entries = request.result as CacheEntry[]
        let totalSize = 0
        entries.forEach(entry => {
          totalSize += entry.blob.size
        })

        resolve({
          count: entries.length,
          totalSize
        })
      }
    })
  }

  const clearAll = async (): Promise<boolean> => {
    if (!dbInstance) return false

    return new Promise((resolve) => {
      const transaction = dbInstance!.transaction([config.storeName], 'readwrite')
      const store = transaction.objectStore(config.storeName)
      const request = store.clear()

      request.onerror = () => {
        resolve(false)
      }

      request.onsuccess = () => {
        resolve(true)
      }
    })
  }

  initDB().catch(() => {})

  if (typeof window !== 'undefined' && !cleanupInterval) {
    cleanupInterval = setInterval(() => {
      cleanupExpired().catch(() => {})
    }, 60 * 60 * 1000)
  }

  onUnmounted(() => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
  })

  return {
    isReady,
    saveVideo,
    loadVideo,
    deleteVideo,
    cleanupExpired,
    getStats,
    clearAll
  }
}
