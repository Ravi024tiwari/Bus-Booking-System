import { Queue } from 'bullmq';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let releaseQueue: Queue;

if (process.env.NODE_ENV === 'production') {
  const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
  connection.on('error', (err) => {
    console.error('[BullMQ Redis Connection Error]:', err);
  });
  releaseQueue = new Queue('seat-release-queue', {
    connection,
  });
} else {
  if (!(global as any).releaseQueue) {
    const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
    connection.on('error', (err) => {
      console.error('[BullMQ Redis Connection Error]:', err);
    });
    (global as any).releaseQueue = new Queue('seat-release-queue', {
      connection,
    });
    console.log('[BullMQ] Queue initialized.');
  }
  releaseQueue = (global as any).releaseQueue;
}

export default releaseQueue;
