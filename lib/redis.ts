import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis;

if (process.env.NODE_ENV === 'production') {
  redis = new Redis(REDIS_URL);
  redis.on('error', (err) => {
    console.error('[Redis Client Error]:', err);
  });
} else {
  if (!(global as any).redis) {
    const devRedis = new Redis(REDIS_URL);
    devRedis.on('error', (err) => {
      console.error('[Redis Client Error]:', err);
    });
    (global as any).redis = devRedis;
    console.log('[Redis] New connection established.');
  }
  redis = (global as any).redis;
}

export default redis;
