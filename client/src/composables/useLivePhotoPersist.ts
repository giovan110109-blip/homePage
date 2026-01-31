import { ref } from 'vue'

const DB_NAME = 'LivePhotoCache'
const STORE_NAME = 'videos'
const DB_VERSION = 1
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24小时

interface CacheEntry {
  photoId: string
  blob: Blob
  timestamp: number
}

let dbInstance: IDBDatabase | null = null

/**
 * IndexedDB 持久化缓存系统
 * 用于跨页面刷新存储 LivePhoto 视频
 */
export const useLivePhotoPersist = () => {
  const isReady = ref(false)

  /**
   * 初始化 IndexedDB
   */
  const initDB = async (): Promise<IDBDatabase> => {
    if (dbInstance) return dbInstance

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('❌ IndexedDB 初始化失败:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        dbInstance = request.result
        console.log('✅ IndexedDB 初始化成功')
        isReady.value = true
        resolve(dbInstance)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // 创建 object store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'photoId' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          console.log('📦 创建 Object Store:', STORE_NAME)
        }
      }
    })
  }

  /**
   * 保存视频到 IndexedDB
   */
  const saveVideo = async (photoId: string, blob: Blob): Promise<boolean> => {
    // ⭐ 关键修复：确保 DB 初始化完成
    if (!dbInstance) {
      console.log('🔄 IndexedDB 正在初始化，等待...')
      try {
        await initDB()
      } catch (error) {
        console.error('❌ IndexedDB 初始化失败:', error)
        return false
      }
    }

    return new Promise((resolve) => {
      try {
        const transaction = dbInstance!.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)

        const entry: CacheEntry = {
          photoId,
          blob,
          timestamp: Date.now()
        }

        console.log(`💾 准备保存到 IndexedDB: ${photoId}`)
        const request = store.put(entry)

        request.onerror = () => {
          console.error('❌ 保存视频失败:', photoId, request.error)
          resolve(false)
        }

        request.onsuccess = () => {
          console.log(`✅ 已保存到 IndexedDB: ${photoId} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`)
          resolve(true)
        }

        transaction.onerror = () => {
          console.error('❌ 事务失败:', transaction.error)
          resolve(false)
        }
      } catch (error) {
        console.error('❌ 保存异常:', error)
        resolve(false)
      }
    })
  }

  /**
   * 从 IndexedDB 读取视频
   */
  const loadVideo = async (photoId: string): Promise<Blob | null> => {
    // ⭐ 关键修复：确保 DB 初始化完成
    if (!dbInstance) {
      console.log('🔄 IndexedDB 正在初始化，等待...')
      try {
        await initDB()
      } catch (error) {
        console.error('❌ IndexedDB 初始化失败:', error)
        return null
      }
    }

    return new Promise((resolve) => {
      try {
        console.log(`🔍 从 IndexedDB 查找: ${photoId}`)
        
        const transaction = dbInstance!.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(photoId)

        request.onerror = () => {
          console.error('❌ 读取视频失败:', photoId, request.error)
          resolve(null)
        }

        request.onsuccess = () => {
          const entry = request.result as CacheEntry | undefined

          if (!entry) {
            console.log(`⚠️ IndexedDB 中无缓存: ${photoId}`)
            resolve(null)
            return
          }

          // 检查是否过期
          const age = Date.now() - entry.timestamp
          if (age > CACHE_EXPIRY) {
            console.log(`⏰ IndexedDB 缓存已过期: ${photoId} (${Math.round(age / 1000 / 60 / 60)}小时)`)
            deleteVideo(photoId).catch(console.error)
            resolve(null)
            return
          }

          console.log(
            `✅ 从 IndexedDB 加载: ${photoId} (${(entry.blob.size / 1024 / 1024).toFixed(2)}MB, 年龄: ${Math.round(age / 1000)}秒)`
          )
          resolve(entry.blob)
        }

        transaction.onerror = () => {
          console.error('❌ 事务读取失败:', transaction.error)
          resolve(null)
        }
      } catch (error) {
        console.error('❌ 读取异常:', error)
        resolve(null)
      }
    })
  }

  /**
   * 删除视频
   */
  const deleteVideo = async (photoId: string): Promise<boolean> => {
    if (!dbInstance) return false

    return new Promise((resolve) => {
      const transaction = dbInstance!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(photoId)

      request.onerror = () => {
        console.error('❌ 删除视频失败:', photoId)
        resolve(false)
      }

      request.onsuccess = () => {
        console.log(`🗑️ 已删除: ${photoId}`)
        resolve(true)
      }
    })
  }

  /**
   * 清理过期缓存
   */
  const cleanupExpired = async (): Promise<number> => {
    if (!dbInstance) return 0

    return new Promise((resolve) => {
      const transaction = dbInstance!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('timestamp')
      
      let deletedCount = 0
      const now = Date.now()
      const cutoff = now - CACHE_EXPIRY

      const range = IDBKeyRange.upperBound(cutoff)
      const request = index.openCursor(range)

      request.onerror = () => {
        console.error('❌ 清理失败')
        resolve(deletedCount)
      }

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          store.delete(cursor.primaryKey)
          deletedCount++
          cursor.continue()
        } else {
          if (deletedCount > 0) {
            console.log(`🧹 清理过期缓存: 删除 ${deletedCount} 个`)
          }
          resolve(deletedCount)
        }
      }
    })
  }

  /**
   * 获取缓存统计
   */
  const getStats = async (): Promise<{
    count: number
    totalSize: number
  }> => {
    if (!dbInstance) return { count: 0, totalSize: 0 }

    return new Promise((resolve) => {
      const transaction = dbInstance!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onerror = () => {
        console.error('❌ 获取统计失败')
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

  /**
   * 清空所有缓存
   */
  const clearAll = async (): Promise<boolean> => {
    if (!dbInstance) return false

    return new Promise((resolve) => {
      const transaction = dbInstance!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onerror = () => {
        console.error('❌ 清空缓存失败')
        resolve(false)
      }

      request.onsuccess = () => {
        console.log('🗑️ 已清空所有缓存')
        resolve(true)
      }
    })
  }

  // 初始化
  console.log('📍 useLivePhotoPersist 正在初始化...')
  initDB().catch(error => {
    console.warn('⚠️ IndexedDB 不可用，将使用内存缓存:', error)
  })

  // 定期清理过期缓存（每小时）
  if (typeof window !== 'undefined') {
    setInterval(() => {
      cleanupExpired().catch(console.error)
    }, 60 * 60 * 1000)
  }

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
