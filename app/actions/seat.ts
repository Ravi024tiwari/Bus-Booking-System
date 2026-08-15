'use server';

import dbConnect from '../../lib/db';
import redis from '../../lib/redis';
import releaseQueue from '../../lib/queue';
import { SeatState, Trip } from '../../models';

/**
 * Secures a temporary 5-minute hold on a seat on a specific trip.
 */
export async function holdSeat(tripId: string, seatNumber: string, userId: string) {
  try {
    await dbConnect();

    // 1. Check if the seat is already occupied or held in MongoDB
    const existingState = await SeatState.findOne({ tripId, seatNumber });
    
    if (existingState) {
      if (existingState.status === 'BOOKED') {
        return { success: false, message: 'This seat is already booked.' };
      }
      
      if (existingState.status === 'HELD') {
        // If the hold has expired, we can clear it and proceed
        if (existingState.heldUntil && new Date(existingState.heldUntil) < new Date()) {
          await SeatState.deleteOne({ _id: existingState._id });
        } else {
          return { success: false, message: 'This seat is currently held by another passenger.' };
        }
      }
    }

    // 2. Acquire a distributed lock in Redis for race condition defense
    // Key: lock:tripId:seatNumber, Value: userId, EX: 300 seconds
    const lockKey = `lock:${tripId}:${seatNumber}`;
    const acquired = await redis.set(lockKey, userId, 'NX', 'EX', 300);

    if (!acquired) {
      return { success: false, message: 'Seat is currently selected by another user.' };
    }

    // 3. Create the hold record in MongoDB
    const heldUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    
    try {
      await SeatState.create({
        tripId,
        seatNumber,
        status: 'HELD',
        heldBy: userId,
        heldUntil,
      });
    } catch (dbErr: any) {
      // If MongoDB unique constraint fails, roll back Redis lock
      await redis.del(lockKey);
      console.warn(`[HoldSeat] MongoDB unique index block. Seat: ${seatNumber}`);
      return { success: false, message: 'Seat selected by another user at the same millisecond.' };
    }

    // 4. Schedule delayed seat release in BullMQ
    const jobId = `release:${tripId}:${seatNumber}`;
    // Remove existing release job if any exists to avoid duplicate firings
    const existingJob = await releaseQueue.getJob(jobId);
    if (existingJob) {
      await existingJob.remove();
    }

    await releaseQueue.add(
      'seat-release',
      { tripId, seatNo: seatNumber },
      { delay: 300 * 1000, jobId } // 5 minutes in milliseconds
    );
    console.log(`[HoldSeat] Scheduled BullMQ release job: ${jobId}`);

    // 5. Broadcast WebSocket state update
    const io = (global as any).io;
    if (io) {
      io.to(tripId).emit('seat:held', { seatNo: seatNumber, heldBy: userId });
      console.log(`[HoldSeat] Socket broadcast seat:held for seat: ${seatNumber}`);
    }

    return { 
      success: true, 
      message: 'Seat secured for 5 minutes.', 
      heldUntil: heldUntil.toISOString() 
    };

  } catch (err: any) {
    console.error('[HoldSeat] Fatal holding error:', err);
    return { success: false, message: 'Internal server error while holding seat.' };
  }
}

/**
 * Explicitly releases a held seat (e.g. user deselects seat before checking out).
 */
export async function releaseSeat(tripId: string, seatNumber: string, userId: string) {
  try {
    await dbConnect();

    // 1. Retrieve the hold record in MongoDB
    const seatState = await SeatState.findOne({ tripId, seatNumber });

    if (!seatState) {
      return { success: true, message: 'Seat is already available.' };
    }

    // Only allow releasing if it is held (not booked) and held by this specific user
    if (seatState.status === 'BOOKED') {
      return { success: false, message: 'Cannot release a booked seat.' };
    }

    if (seatState.heldBy && seatState.heldBy.toString() !== userId) {
      return { success: false, message: 'Cannot release a hold owned by another user.' };
    }

    // 2. Remove hold record from MongoDB
    await SeatState.deleteOne({ _id: seatState._id });

    // 3. Delete Redis lock key
    const lockKey = `lock:${tripId}:${seatNumber}`;
    await redis.del(lockKey);

    // 4. Cancel the scheduled release queue job
    const jobId = `release:${tripId}:${seatNumber}`;
    const job = await releaseQueue.getJob(jobId);
    if (job) {
      await job.remove();
      console.log(`[ReleaseSeat] Cancelled BullMQ job: ${jobId}`);
    }

    // 5. Broadcast WebSocket release update
    const io = (global as any).io;
    if (io) {
      io.to(tripId).emit('seat:released', { seatNo: seatNumber });
      console.log(`[ReleaseSeat] Socket broadcast seat:released for seat: ${seatNumber}`);
    }

    return { success: true, message: 'Seat released successfully.' };

  } catch (err: any) {
    console.error('[ReleaseSeat] Fatal release error:', err);
    return { success: false, message: 'Internal server error while releasing seat.' };
  }
}
