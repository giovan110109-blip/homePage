const CACHE_NAME = 'homepage-images-v3'
const CACHE_API_NAME = 'homepage-api-v1'
const MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000 // 30天

// 需要缓存的域名
const ALLOWED_HOSTS = [
  'serve.giovan.cn',
  'localhost',
  '127.0.0.1'
]


/**
 * 检查是否应该缓存图片
 */
function shouldCacheImage(url) {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()
    
    // 检查扩展名 - 添加视频格式支持
    if (!/\.(jpg|jpeg|png|webp|heic|mp4|mov|m4v|avi|webm)$/i.test(pathname)) {
      return false
    }
    
    // 检查域名
    const isAllowed = ALLOWED_HOSTS.some(host => 
      urlObj.hostname === host || urlObj.hostname.endsWith('.' + host)
    )
    
    return isAllowed
  } catch (error) {
    return false
  }
}

/**
 * 检查是否应该缓存 API
 */
function shouldCacheAPI(url) {
  try {
    const urlObj = new URL(url)
    
    // 只缓存 photos API
    if (urlObj.pathname.includes('/api/photos')) {
      return true
    }
    
    return false
  } catch (error) {
    return false
  }
}

/**
 * Install
 */
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

/**
 * Activate
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if ((name !== CACHE_NAME && name.startsWith('homepage-images')) ||
              (name !== CACHE_API_NAME && name.startsWith('homepage-api'))) {
            return caches.delete(name)
          }
        })
      )
    })
  )
  self.clients.claim()
})

/**
 * Fetch - 核心缓存逻辑
 */
self.addEventListener('fetch', (event) => {
  const { request } = event

  // 只处理 GET 请求
  if (request.method !== 'GET') {
    return
  }

  // 调试：打印所有 GET 请求
  const url = new URL(request.url)
  if (url.hostname.includes('giovan') || url.hostname.includes('localhost')) {
  }

  // 检查是否需要缓存 API
  if (shouldCacheAPI(request.url)) {
    event.respondWith(
      caches.open(CACHE_API_NAME).then(async (cache) => {
        try {
          // 1. 先查缓存
          const cachedResponse = await cache.match(request)
          if (cachedResponse) {
            // 后台更新缓存
            fetch(request).then(response => {
              if (response && response.status === 200) {
                cache.put(request, response.clone())
              }
            }).catch(() => {})
            return cachedResponse
          }

          // 2. 缓存未命中，从网络获取
          const networkResponse = await fetch(request)

          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone())
          }

          return networkResponse
        } catch (error) {
          // 3. 网络失败，尝试返回缓存
          const cachedResponse = await cache.match(request)
          if (cachedResponse) {
            return cachedResponse
          }
          throw error
        }
      })
    )
    return
  }

  // 检查是否需要缓存图片
  if (!shouldCacheImage(request.url)) {
    return
  }


  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      
      try {
        // 1. 先查缓存
        const cachedResponse = await cache.match(request)
        if (cachedResponse) {
          return cachedResponse
        }

        // 2. 缓存未命中，从网络获取
        const networkResponse = await fetch(request)
        

        // 3. 缓存响应
        // 注意：opaque 响应 (跨域无 CORS) 的 ok=false, status=0，但可以缓存和使用
        // 只要 fetch 成功（没抛异常），就保存响应
        if (networkResponse) {
          try {
            // 4. 保存到缓存 (clone 以便同时返回和缓存)
            await cache.put(request, networkResponse.clone())
          } catch (cacheError) {
            // 忽略缓存错误
            console.warn('[SW] ⚠️ 缓存失败:', request.url, cacheError)
          }
        }

        return networkResponse
      } catch (error) {
        // 尝试返回缓存
        const cachedResponse = await cache.match(request)
        if (cachedResponse) {
          console.log('[SW] 🔄 网络失败，使用缓存:', request.url)
          return cachedResponse
        }
        console.error('[SW] ❌ 加载失败:', request.url, error)
        throw error
      }
    })()
  )
})

/**
 * Message - 清空缓存
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    Promise.all([
      caches.delete(CACHE_NAME),
      caches.delete(CACHE_API_NAME)
    ]).then(() => {
      event.ports[0].postMessage({ cleared: true })
    })
  }
})
