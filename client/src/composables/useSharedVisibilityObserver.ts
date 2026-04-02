type VisibilityCallback = (
  isVisible: boolean,
  entry: IntersectionObserverEntry,
) => void

interface SharedVisibilityObserverOptions {
  rootMargin?: string
  threshold?: number
  once?: boolean
}

interface ObserverBucket {
  observer: IntersectionObserver
  callbacks: Map<
    Element,
    {
      callback: VisibilityCallback
      once: boolean
    }
  >
}

type VisibilitySubscription = ObserverBucket['callbacks'] extends Map<Element, infer T>
  ? T
  : never

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

  const callbacks = new Map<Element, VisibilitySubscription>()
  const rootMargin = options.rootMargin || DEFAULT_ROOT_MARGIN
  const threshold = options.threshold ?? DEFAULT_THRESHOLD

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const subscription = callbacks.get(entry.target)
        if (!subscription) continue

        subscription.callback(entry.isIntersecting, entry)

        if (subscription.once && entry.isIntersecting) {
          callbacks.delete(entry.target)
          observer.unobserve(entry.target)
        }
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
    callback(true, {} as IntersectionObserverEntry)
    return () => {}
  }

  bucket.callbacks.set(element, {
    callback,
    once: options.once ?? true,
  })
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
