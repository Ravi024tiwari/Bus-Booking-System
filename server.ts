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
redisConnection.on('error', (err) => {
  console.error('[Redis Shared Connection Error]:', err);
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

  // Keep track of the last time we updated MongoDB for each trip to throttle DB writes
  const lastDbUpdateTimes = new Map<string, number>();

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
    socket.on('update-location', async ({ tripId, lat, lng }: { tripId: string; lat: number; lng: number }) => {
      try {
        const redisKey = `trip:${tripId}:location`;
        
        // 1. Store in Redis instantly (cache)
        await redisConnection.hset(redisKey, {
          latitude: lat.toString(),
          longitude: lng.toString(),
          updatedAt: Date.now().toString(),
        });
        
        // Expire after 24 hours
        await redisConnection.expire(redisKey, 86400);

        // 2. Throttle MongoDB write-back to every 1 minute (60000ms)
        const now = Date.now();
        const lastUpdate = lastDbUpdateTimes.get(tripId) || 0;
        if (now - lastUpdate >= 60000) {
          lastDbUpdateTimes.set(tripId, now);

          // Update MongoDB asynchronously without blocking client broadcast
          const TrackingSessionModel = mongoose.models.TrackingSession || mongoose.model('TrackingSession');
          if (TrackingSessionModel) {
            TrackingSessionModel.findOneAndUpdate(
              { tripId: new mongoose.Types.ObjectId(tripId) },
              {
                latitude: lat,
                longitude: lng,
                updatedAt: new Date(now),
              },
              { upsert: true, new: true }
            )
              .then(() => {
                console.log(`[Socket/DB] Throttled DB write successful for Trip: ${tripId}`);
              })
              .catch((err) => {
                console.error(`[Socket/DB] Error updating TrackingSession for Trip ${tripId}:`, err);
              });
          }
        }
      } catch (err) {
        console.error('[Socket] Live Location Update tracking error:', err);
      }

      // Broadcast coordinates to all clients in the trip room
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

  //BullMQ Worker for the release queue

  // Setup BullMQ Worker for release queue
  const releaseWorker = new Worker(
    'seat-release-queue',
    async (job: Job) => {
      const { tripId, seatNo, fromSequence, toSequence } = job.data;
      console.log(`[BullMQ] Processing seat release job for Trip: ${tripId}, Seat: ${seatNo} (${fromSequence}->${toSequence})`);

      try {
        const SeatState = mongoose.model('SeatState');
        
        // Find if the seat is still in HELD status matching the segment
        const seatState = await SeatState.findOne({ 
          tripId, 
          seatNumber: seatNo,
          fromSequence,
          toSequence
        });
        
        if (seatState && seatState.status === 'HELD') {
          // Release seat by deleting the hold record
          await SeatState.deleteOne({ _id: seatState._id });
          console.log(`[BullMQ] Seat ${seatNo} on Trip ${tripId} (${fromSequence}->${toSequence}) has been released in DB.`);

          // Broadcast release event to Socket.io clients in the trip room
          io.to(tripId).emit('seat:released', { seatNo, fromSequence, toSequence });
          console.log(`[Socket] Broadcasted seat:released for Seat: ${seatNo} (${fromSequence}->${toSequence})`);
        } else {
          console.log(`[BullMQ] Seat ${seatNo} on Trip ${tripId} (${fromSequence}->${toSequence}) is already booked or not held. Release skipped.`);
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

  // Fast health-check endpoint for Render keep-alive / uptime pings
  app.all('/health', (req, res) => {
    res.status(200).send('OK');
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
