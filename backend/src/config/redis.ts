import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Redis error:', err.message);
});

export async function connectRedis(): Promise<void> {
  try {
    if (redis.status === 'wait') {
      await redis.connect();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Redis unavailable, continuing without cache.');
  }
}

export default redis;
