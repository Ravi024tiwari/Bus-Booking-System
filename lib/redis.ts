import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis;

if (process.env.NODE_ENV === 'production') {
  redis = new Redis(REDIS_URL);
} else {
  if (!(global as any).redis) {
    (global as any).redis = new Redis(REDIS_URL);
    console.log('[Redis] New connection established.');
  }
  redis = (global as any).redis;
}

export default redis;
