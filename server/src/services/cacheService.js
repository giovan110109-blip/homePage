const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || 0),
});

class CacheService {
  async get(key) {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      await client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      await client.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  async delPattern(pattern) {
    try {
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
      return await client.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async incr(key, ttl = 300) {
    try {
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
      await client.expire(key, ttl);
    } catch (error) {
      console.error('Cache expire error:', error);
    }
  }

  async getOrSet(key, fetchFn, ttl = 300) {
    try {
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

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('Redis Client Connected');
});

client.on('ready', () => {
  console.log('Redis Client Ready');
});

module.exports = new CacheService();