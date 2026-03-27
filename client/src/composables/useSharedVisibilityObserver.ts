type VisibilityCallback = () => void

interface SharedVisibilityObserverOptions {
  rootMargin?: string
  threshold?: number
}

interface ObserverBucket {
  observer: IntersectionObserver
  callbacks: Map<Element, VisibilityCallback>
}

const DEFAULT_ROOT_MARGIN = "300px 0px"
const DEFAULT_THRESHOLD = 0
const observerBuckets = new Map<string, ObserverBucket>()

const getBucketKey = (options: SharedVisibilityObserverOptions) => {
  const rootMargin = options.rootMargin || DEFAULT_ROOT_MARGIN
  const threshold = options.threshold ?? DEFAULT_THRESHOLD
  return `${rootMargin}::${threshold}`
}

const getObserverBucket = (options: SharedVisibilityObserverOptions = {}) => {
  if (typeof window === "undefined") {
    return null
  }

  const bucketKey = getBucketKey(options)
  const existingBucket = observerBuckets.get(bucketKey)
  if (existingBucket) {
    return existingBucket
  }

  const callbacks = new Map<Element, VisibilityCallback>()
  const rootMargin = options.rootMargin || DEFAULT_ROOT_MARGIN
  const threshold = options.threshold ?? DEFAULT_THRESHOLD

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue

        const callback = callbacks.get(entry.target)
        if (callback) {
          callback()
        }

        callbacks.delete(entry.target)
        observer.unobserve(entry.target)
      }

      if (callbacks.size === 0) {
        observer.disconnect()
        observerBuckets.delete(bucketKey)
      }
    },
    {
      rootMargin,
      threshold,
    },
  )

  const bucket = { observer, callbacks }
  observerBuckets.set(bucketKey, bucket)

  return bucket
}

export const observeSharedVisibility = (
  element: Element,
  callback: VisibilityCallback,
  options: SharedVisibilityObserverOptions = {},
) => {
  const bucket = getObserverBucket(options)
  if (!bucket) {
    callback()
    return () => {}
  }

  bucket.callbacks.set(element, callback)
  bucket.observer.observe(element)

  return () => {
    bucket.callbacks.delete(element)
    bucket.observer.unobserve(element)

    if (bucket.callbacks.size === 0) {
      bucket.observer.disconnect()
      observerBuckets.delete(getBucketKey(options))
    }
  }
}
