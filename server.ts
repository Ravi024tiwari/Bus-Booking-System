import './lib/init-env'; // Must be first to configure env and DNS before other imports load
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import mongoose from 'mongoose';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/seatpulse';

// Shared Redis Connection (MaxRetriesPerRequest must be null for BullMQ)
const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

nextApp.prepare().then(async () => {
  const app = express();
  const server = http.createServer(app);

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a room for a specific trip
    socket.on('join-trip', (tripId: string) => {
      socket.join(tripId);
      console.log(`[Socket] Client ${socket.id} joined trip room: ${tripId}`);
    });

    // Leave a trip room
    socket.on('leave-trip', (tripId: string) => {
      socket.leave(tripId);
      console.log(`[Socket] Client ${socket.id} left trip room: ${tripId}`);
    });

    // Driver/Operator updates live location coordinates
    socket.on('update-location', ({ tripId, lat, lng }: { tripId: string; lat: number; lng: number }) => {
      io.to(tripId).emit('location-updated', { lat, lng });
      console.log(`[Socket] Live Location Update -> Trip: ${tripId}, Lat: ${lat}, Lng: ${lng}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  // Share io globally so Server Actions can broadcast events
  (global as any).io = io;

  // Database Connection & Schema Registration
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
      console.log('[Database] Connected to MongoDB.');
      
      // Load schemas dynamically to register models
      try {
        await import('./models');
        console.log('[Database] Registered models from ./models');
      } catch (err) {
        console.warn('[Database] Did not load schemas (will be registered in Phase 2):', err);
      }
    }
  } catch (err) {
    console.error('[Database] MongoDB connection error:', err);
  }

  // Setup BullMQ Worker for release queue
  const releaseWorker = new Worker(
    'seat-release-queue',
    async (job: Job) => {
      const { tripId, seatNo } = job.data;
      console.log(`[BullMQ] Processing seat release job for Trip: ${tripId}, Seat: ${seatNo}`);

      try {
        const SeatState = mongoose.model('SeatState');
        
        // Find if the seat is still in HELD status
        const seatState = await SeatState.findOne({ tripId, seatNumber: seatNo });
        
        if (seatState && seatState.status === 'HELD') {
          // Release seat by deleting the hold record
          await SeatState.deleteOne({ _id: seatState._id });
          console.log(`[BullMQ] Seat ${seatNo} on Trip ${tripId} has been released in DB.`);

          // Delete Redis lock
          const lockKey = `lock:${tripId}:${seatNo}`;
          await redisConnection.del(lockKey);
          console.log(`[BullMQ] Deleted Redis lock key: ${lockKey}`);

          // Broadcast release event to Socket.io clients in the trip room
          io.to(tripId).emit('seat:released', { seatNo });
          console.log(`[Socket] Broadcasted seat:released for Seat: ${seatNo}`);
        } else {
          console.log(`[BullMQ] Seat ${seatNo} on Trip ${tripId} is already booked or not held. Release skipped.`);
        }
      } catch (err) {
        console.error('[BullMQ] Error releasing seat:', err);
        throw err;
      }
    },
    { connection: redisConnection }
  );

  releaseWorker.on('completed', (job) => {
    console.log(`[BullMQ] Job ${job.id} completed successfully.`);
  });

  releaseWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job ${job?.id} failed with error:`, err);
  });

  // Handle all other routing via Next.js
  app.all(/.*/, (req, res) => {
    return nextHandler(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
