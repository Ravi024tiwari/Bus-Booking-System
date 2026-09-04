import './lib/init-env'; // Must be first to configure env and DNS before other imports load
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import next from 'next';
import mongoose from 'mongoose';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/seatpulse';

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
