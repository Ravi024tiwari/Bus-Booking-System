'use server';

import dbConnect from '../../lib/db';
import redis from '../../lib/redis';
import releaseQueue from '../../lib/queue';
import { SeatState, Trip } from '../../models';

/**
 * Secures a temporary 5-minute hold on a seat for a specific segment on a trip.
 */
export async function holdSeat(
  tripId: string,
  seatNumber: string,
  userId: string,
  fromStop: string,
  toStop: string
) {
  try {
    await dbConnect();

    // 1. Fetch trip and populate route stops to resolve segment sequence range
    const trip = await Trip.findById(tripId).populate('routeId');
    if (!trip) {
      return { success: false, message: 'Selected trip does not exist.' };
    }

    const route = trip.routeId as any;
    if (!route || !route.stops) {
      return { success: false, message: 'Associated route stops not found.' };
    }

    const boardingStop = route.stops.find(
      (s: any) => s.stopName.toLowerCase() === fromStop.toLowerCase().trim()
    );
    const droppingStop = route.stops.find(
      (s: any) => s.stopName.toLowerCase() === toStop.toLowerCase().trim()
    );

    if (!boardingStop || !droppingStop) {
      return {
        success: false,
        message: 'Boarding or dropping point does not exist on this route.',
      };
    }

    const fromSequence = boardingStop.sequence;
    const toSequence = droppingStop.sequence;

    if (fromSequence >= toSequence) {
      return {
        success: false,
        message: 'Invalid boarding and dropping stop order.',
      };
    }

    // 2. Acquire a short-lived Redis mutex lock for race-condition prevention during DB check/write
    const mutexKey = `lock:mutex:${tripId}:${seatNumber}`;
    const acquired = await (redis as any).set(mutexKey, userId, 'NX', 'EX', 5);

    if (!acquired) {
      return {
        success: false,
        message: 'Seat is currently being locked by another user. Please retry.',
      };
    }

    const now = new Date();

    try {
      // 3. Query MongoDB SeatState for overlapping bookings or active holds
      const overlapping = await SeatState.findOne({
        tripId,
        seatNumber,
        $or: [
          { status: 'BOOKED' },
          { status: 'HELD', heldUntil: { $gt: now } },
        ],
        fromSequence: { $lt: toSequence },
        toSequence: { $gt: fromSequence },
      });

      if (overlapping) {
        await redis.del(mutexKey);
        if (overlapping.status === 'BOOKED') {
          return {
            success: false,
            message: 'This seat is already booked on this segment.',
          };
        }
        return {
          success: false,
          message: 'This seat is currently held by another passenger on this segment.',
        };
      }

      // 4. Create the segment hold record in MongoDB
      const heldUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

      await SeatState.create({
        tripId,
        seatNumber,
        status: 'HELD',
        heldBy: userId,
        heldUntil,
        fromSequence,
        toSequence,
      });

      // 5. Release Redis Mutex immediately
      await redis.del(mutexKey);

      // 6. Schedule delayed seat release in BullMQ using segment-specific jobId
      const jobId = `release-${tripId}-${seatNumber}-${fromSequence}-${toSequence}`;
      const existingJob = await releaseQueue.getJob(jobId);
      if (existingJob) {
        await existingJob.remove();
      }

      await releaseQueue.add(
        'seat-release',
        { tripId, seatNo: seatNumber, fromSequence, toSequence },
        { delay: 300 * 1000, jobId } // 5 minutes in milliseconds
      );
      console.log(`[HoldSeat] Scheduled BullMQ release job: ${jobId}`);

      // 7. Broadcast WebSocket state update to active clients
      const io = (global as any).io;
      if (io) {
        io.to(tripId).emit('seat:held', {
          seatNo: seatNumber,
          heldBy: userId,
          fromSequence,
          toSequence,
        });
        console.log(
          `[HoldSeat] Socket broadcast seat:held for seat: ${seatNumber} (${fromSequence}->${toSequence})`
        );
      }

      return {
        success: true,
        message: 'Seat secured for 5 minutes.',
        heldUntil: heldUntil.toISOString(),
      };
    } catch (dbErr: any) {
      await redis.del(mutexKey);
      console.error('[HoldSeat] MongoDB write error:', dbErr);
      return {
        success: false,
        message: 'Concurrency issue locking seat. Please try again.',
      };
    }
  } catch (err: any) {
    console.error('[HoldSeat] Fatal holding error:', err);
    return {
      success: false,
      message: 'Internal server error while holding seat.',
    };
  }
}

/**
 * Explicitly releases a held seat for a segment.
 */
export async function releaseSeat(
  tripId: string,
  seatNumber: string,
  userId: string,
  fromStop: string,
  toStop: string
) {
  try {
    await dbConnect();

    // 1. Resolve stop sequences
    const trip = await Trip.findById(tripId).populate('routeId');
    if (!trip) {
      return { success: false, message: 'Selected trip does not exist.' };
    }

    const route = trip.routeId as any;
    if (!route || !route.stops) {
      return { success: false, message: 'Associated route stops not found.' };
    }

    const boardingStop = route.stops.find(
      (s: any) => s.stopName.toLowerCase() === fromStop.toLowerCase().trim()
    );
    const droppingStop = route.stops.find(
      (s: any) => s.stopName.toLowerCase() === toStop.toLowerCase().trim()
    );

    if (!boardingStop || !droppingStop) {
      return { success: true, message: 'Stops not found, seat hold released.' };
    }

    const fromSequence = boardingStop.sequence;
    const toSequence = droppingStop.sequence;

    // 2. Retrieve and verify the specific hold record in MongoDB
    const seatState = await SeatState.findOne({
      tripId,
      seatNumber,
      fromSequence,
      toSequence,
    });

    if (!seatState) {
      return { success: true, message: 'Seat hold is already cleared.' };
    }

    if (seatState.status === 'BOOKED') {
      return { success: false, message: 'Cannot release a booked seat.' };
    }

    if (seatState.heldBy && seatState.heldBy.toString() !== userId) {
      return {
        success: false,
        message: 'Cannot release a hold owned by another user.',
      };
    }

    // 3. Remove hold record from MongoDB
    await SeatState.deleteOne({ _id: seatState._id });

    // 4. Cancel the scheduled release queue job
    const jobId = `release-${tripId}-${seatNumber}-${fromSequence}-${toSequence}`;
    const job = await releaseQueue.getJob(jobId);
    if (job) {
      await job.remove();
      console.log(`[ReleaseSeat] Cancelled BullMQ job: ${jobId}`);
    }

    // 5. Broadcast WebSocket release update
    const io = (global as any).io;
    if (io) {
      io.to(tripId).emit('seat:released', {
        seatNo: seatNumber,
        fromSequence,
        toSequence,
      });
      console.log(
        `[ReleaseSeat] Socket broadcast seat:released for seat: ${seatNumber} (${fromSequence}->${toSequence})`
      );
    }

    return { success: true, message: 'Seat hold released successfully.' };
  } catch (err: any) {
    console.error('[ReleaseSeat] Fatal release error:', err);
    return {
      success: false,
      message: 'Internal server error while releasing seat.',
    };
  }
}
