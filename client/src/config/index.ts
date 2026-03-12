export const APP_CONFIG = {
  app: {
    name: 'HomePage',
    version: '1.0.0',
  },

  cache: {
    livePhoto: {
      maxRetries: 3,
      cacheExpiry: 24 * 60 * 60 * 1000,
      maxCacheSize: 50,
      downloadTimeout: 30000,
      validationTimeout: 5000,
      cleanupInterval: 10 * 60 * 1000,
    },
    image: {
      maxSize: 100,
      loadDelay: 300,
    },
    geocoding: {
      cacheExpiry: 24 * 60 * 60 * 1000,
      maxCacheSize: 1000,
    },
  },

  db: {
    livePhoto: {
      name: 'LivePhotoCache',
      storeName: 'videos',
      version: 1,
    },
  },

  livePhoto: {
    longPressDelay: 350,
    playTimeout: 3000,
    stopDelay: 300,
    preloadBatchSize: 2,
    prefetchDistance: 3,
  },

  gallery: {
    maxPhotos: 10000,
    preloadDistance: 3,
  },

  auth: {
    loginCountdown: 300,
    qrPollInterval: 3000,
    maxAttempts: 5,
    lockoutTime: 15 * 60 * 1000,
  },

  map: {
    defaultCenter: [104.066, 30.573] as [number, number],
    defaultZoom: 4,
  },

  upload: {
    maxConcurrent: 4,
    pollInterval: 5000,
  },

  throttle: {
    scrollDebounce: 100,
    resizeDebounce: 200,
  },
} as const

export type AppConfig = typeof APP_CONFIG
