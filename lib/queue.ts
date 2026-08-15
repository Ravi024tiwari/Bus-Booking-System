import { Queue } from 'bullmq';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let releaseQueue: Queue;

if (process.env.NODE_ENV === 'production') {
  releaseQueue = new Queue('seat-release-queue', {
    connection: new Redis(REDIS_URL, { maxRetriesPerRequest: null }),
  });
} else {
  if (!(global as any).releaseQueue) {
    (global as any).releaseQueue = new Queue('seat-release-queue', {
      connection: new Redis(REDIS_URL, { maxRetriesPerRequest: null }),
    });
    console.log('[BullMQ] Queue initialized.');
  }
  releaseQueue = (global as any).releaseQueue;
}

export default releaseQueue;
