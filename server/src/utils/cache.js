class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key, value, ttlSeconds = 300) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });

    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);
    this.timers.set(key, timer);

    return value;
  }

  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
  }

  has(key) {
    return this.get(key) !== null;
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  size() {
    return this.cache.size;
  }
}

const cache = new MemoryCache();

const cacheMiddleware = (keyGenerator, ttlSeconds = 300) => {
  return async (ctx, next) => {
    const key = typeof keyGenerator === 'function' ? keyGenerator(ctx) : keyGenerator;
    
    if (ctx.method !== 'GET') {
      return await next();
    }

    const cached = cache.get(key);
    if (cached) {
      ctx.set('X-Cache', 'HIT');
      ctx.body = cached;
      return;
    }

    await next();

    if (ctx.status === 200 && ctx.body) {
      ctx.set('X-Cache', 'MISS');
      cache.set(key, ctx.body, ttlSeconds);
    }
  };
};

const invalidateCache = (pattern) => {
  if (typeof pattern === 'string') {
    cache.delete(pattern);
  } else if (pattern instanceof RegExp) {
    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
      }
    }
  }
};

module.exports = {
  cache,
  cacheMiddleware,
  invalidateCache,
  MemoryCache
};
