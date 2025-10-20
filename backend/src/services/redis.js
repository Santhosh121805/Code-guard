import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

let redisClient = null;

// Initialize Redis connection
export async function initializeRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    // Handle connection events
    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('Redis ready for operations');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    // Test connection
    await redisClient.ping();
    logger.info('Redis connection test successful');

    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

// Get Redis client instance
export function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

// Close Redis connection
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}

// Cache service class
export class CacheService {
  constructor() {
    this.redis = getRedisClient();
  }

  // Set cache with expiration
  async set(key, value, expireInSeconds = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, expireInSeconds, serializedValue);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  // Get cache
  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache
  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  // Set with no expiration
  async setNoExpire(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.set(key, serializedValue);
      return true;
    } catch (error) {
      logger.error('Cache set no expire error:', error);
      return false;
    }
  }

  // Increment counter
  async increment(key, by = 1) {
    try {
      return await this.redis.incrby(key, by);
    } catch (error) {
      logger.error('Cache increment error:', error);
      return 0;
    }
  }

  // Set expiration on existing key
  async expire(key, seconds) {
    try {
      return await this.redis.expire(key, seconds);
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  // Get multiple keys
  async mget(keys) {
    try {
      const values = await this.redis.mget(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return new Array(keys.length).fill(null);
    }
  }

  // Set multiple keys
  async mset(keyValuePairs, expireInSeconds = 3600) {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const [key, value] of keyValuePairs) {
        const serializedValue = JSON.stringify(value);
        pipeline.setex(key, expireInSeconds, serializedValue);
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  // List operations
  async lpush(key, ...values) {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      return await this.redis.lpush(key, ...serializedValues);
    } catch (error) {
      logger.error('Cache lpush error:', error);
      return 0;
    }
  }

  async rpop(key) {
    try {
      const value = await this.redis.rpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache rpop error:', error);
      return null;
    }
  }

  async lrange(key, start = 0, stop = -1) {
    try {
      const values = await this.redis.lrange(key, start, stop);
      return values.map(v => JSON.parse(v));
    } catch (error) {
      logger.error('Cache lrange error:', error);
      return [];
    }
  }

  // Set operations
  async sadd(key, ...members) {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      return await this.redis.sadd(key, ...serializedMembers);
    } catch (error) {
      logger.error('Cache sadd error:', error);
      return 0;
    }
  }

  async srem(key, ...members) {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      return await this.redis.srem(key, ...serializedMembers);
    } catch (error) {
      logger.error('Cache srem error:', error);
      return 0;
    }
  }

  async smembers(key) {
    try {
      const members = await this.redis.smembers(key);
      return members.map(m => JSON.parse(m));
    } catch (error) {
      logger.error('Cache smembers error:', error);
      return [];
    }
  }

  // Hash operations
  async hset(key, field, value) {
    try {
      const serializedValue = JSON.stringify(value);
      return await this.redis.hset(key, field, serializedValue);
    } catch (error) {
      logger.error('Cache hset error:', error);
      return 0;
    }
  }

  async hget(key, field) {
    try {
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache hget error:', error);
      return null;
    }
  }

  async hgetall(key) {
    try {
      const hash = await this.redis.hgetall(key);
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.error('Cache hgetall error:', error);
      return {};
    }
  }

  // Pattern-based operations
  async keys(pattern) {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      logger.error('Cache keys error:', error);
      return [];
    }
  }

  async deleteByPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('Cache delete by pattern error:', error);
      return 0;
    }
  }
}

// Session management
export class SessionService {
  constructor() {
    this.redis = getRedisClient();
    this.prefix = 'session:';
  }

  async createSession(sessionId, data, expireInSeconds = 3600) {
    try {
      const key = `${this.prefix}${sessionId}`;
      const serializedData = JSON.stringify(data);
      await this.redis.setex(key, expireInSeconds, serializedData);
      return true;
    } catch (error) {
      logger.error('Session create error:', error);
      return false;
    }
  }

  async getSession(sessionId) {
    try {
      const key = `${this.prefix}${sessionId}`;
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Session get error:', error);
      return null;
    }
  }

  async updateSession(sessionId, data, expireInSeconds = 3600) {
    return await this.createSession(sessionId, data, expireInSeconds);
  }

  async deleteSession(sessionId) {
    try {
      const key = `${this.prefix}${sessionId}`;
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Session delete error:', error);
      return false;
    }
  }

  async extendSession(sessionId, expireInSeconds = 3600) {
    try {
      const key = `${this.prefix}${sessionId}`;
      await this.redis.expire(key, expireInSeconds);
      return true;
    } catch (error) {
      logger.error('Session extend error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const redis = new RedisService();