class MemoryCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.timers = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.delete(key);
      return null;
    }
    
    this._updateAccessOrder(key);
    return item.value;
  }

  set(key, value, ttlSeconds = 300) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictLRU();
    }

    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
    this._updateAccessOrder(key);

    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);
    this.timers.set(key, timer);

    return value;
  }

  _updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  _evictLRU() {
    if (this.accessOrder.length === 0) return;
    
    const lruKey = this.accessOrder.shift();
    if (lruKey && this.cache.has(lruKey)) {
      this.delete(lruKey);
      console.log(`[Cache] LRU 淘汰: ${lruKey}`);
    }
  }

  delete(key) {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
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
    this.accessOrder = [];
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

  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: this.keys()
    };
  }
}

const cache = new MemoryCache(parseInt(process.env.CACHE_MAX_SIZE) || 1000);

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
