const redis = require('redis');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || 6379),
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis 重连次数过多，停止重连');
        return new Error('Redis 重连失败');
      }
      const delay = Math.min(retries * 100, 3000);
      console.log(`Redis 重连中... (第 ${retries} 次，延迟 ${delay}ms)`);
      return delay;
    },
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || 0),
});

let isConnected = false;

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
  isConnected = false;
});

client.on('connect', () => {
  console.log('Redis Client Connected');
  isConnected = true;
});

client.on('ready', () => {
  console.log('Redis Client Ready');
  isConnected = true;
});

client.on('end', () => {
  console.log('Redis Client Connection Ended');
  isConnected = false;
});

client.on('reconnecting', () => {
  console.log('Redis Client Reconnecting...');
  isConnected = false;
});

class CacheService {
  async _ensureConnected() {
    if (!isConnected) {
      console.log('Waiting for Redis connection...');
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (isConnected) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
  }

  async get(key) {
    try {
      await this._ensureConnected();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      await this._ensureConnected();
      await client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      await this._ensureConnected();
      await client.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  async delPattern(pattern) {
    try {
      await this._ensureConnected();
      const keys = await client.keys(pattern);
      if (keys.length) {
        await client.del(keys);
      }
    } catch (error) {
      console.error('Cache delPattern error:', error);
    }
  }

  async exists(key) {
    try {
      await this._ensureConnected();
      return await client.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async incr(key, ttl = 300) {
    try {
      await this._ensureConnected();
      const value = await client.incr(key);
      if (value === 1) {
        await client.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  }

  async expire(key, ttl) {
    try {
      await this._ensureConnected();
      await client.expire(key, ttl);
    } catch (error) {
      console.error('Cache expire error:', error);
    }
  }

  async getOrSet(key, fetchFn, ttl = 300) {
    try {
      await this._ensureConnected();
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }
      const value = await fetchFn();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      return await fetchFn();
    }
  }
}

module.exports = new CacheService();