import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import redis from '@/lib/redis';
import { Trip, SeatState, Bus } from '@/models';
import { verifyAuth } from '@/lib/auth-proxy';

// Zod validation schema for updating trip status
const updateStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED'], {
    message: 'Status must be SCHEDULED, BOARDING, DEPARTED, IN_TRANSIT, ARRIVED, or CANCELLED',
  }),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await dbConnect();
    const { tripId } = await params;

    // 1. Fetch Trip details and populate the associated Bus & Operator
    const trip = await Trip.findById(tripId).populate({
      path: 'busId',
      populate: {
        path: 'operatorId',
        select: 'name'
      }
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, message: 'Scheduled trip not found.' },
        { status: 404 }
      );
    }

    const bus = trip.busId as any;

    // 2. Fetch occupied/held seat states
    const now = new Date();
    const activeSeats = await SeatState.find({
      tripId,
      $or: [
        { status: 'BOOKED' },
        { 
          status: 'HELD', 
          heldUntil: { $gt: now } 
        }
      ]
    });

    // Format occupied seats as a key-value lookup with segment sequence bounds
    const occupiedSeats: Record<string, { status: string; heldBy?: string; heldUntil?: string; fromSequence: number; toSequence: number }> = {};
    activeSeats.forEach((seat: any) => {
      occupiedSeats[seat.seatNumber] = {
        status: seat.status,
        heldBy: seat.heldBy?.toString(),
        heldUntil: seat.heldUntil?.toISOString(),
        fromSequence: seat.fromSequence,
        toSequence: seat.toSequence
      };
    });

    // 3. Define Boarding and Dropping points dynamically based on cities
    const boardingPoints = [
      { id: 'bp-1', name: `${trip.source} Main Bus Stand`, time: '10:00 PM' },
      { id: 'bp-2', name: `${trip.source} VIP Road Crossing`, time: '10:15 PM' }
    ];

    const droppingPoints = [
      { id: 'dp-1', name: `${trip.destination} Bypass Highway`, time: '11:15 PM' },
      { id: 'dp-2', name: `${trip.destination} Central Bus Stop`, time: '11:30 PM' }
    ];

    const cancellationPolicy = [
      { timeFrame: 'Before 24 hours of departure', refundPercentage: '90%' },
      { timeFrame: 'Between 12 to 24 hours of departure', refundPercentage: '50%' },
      { timeFrame: 'Less than 12 hours of departure', refundPercentage: '0% (No Refund)' }
    ];

    const amenities = bus?.type?.includes('AC')
      ? ['WiFi', 'Charging Port', 'AC', 'Water Bottle', 'Blanket']
      : ['Charging Port', 'Water Bottle'];

    // 4. Return unified JSON payload
    return NextResponse.json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          source: trip.source,
          destination: trip.destination,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          fare: trip.fare,
          offerId: trip.offerId || null,
          offerPercentage: trip.offerPercentage || 0,
          offerLimit: trip.offerLimit || 0,
          offerBookedCount: trip.offerBookedCount || 0,
          status: trip.status || 'SCHEDULED'
        },
        bus: {
          id: bus?._id,
          busNumber: bus?.busNumber,
          type: bus?.type,
          capacity: bus?.capacity,
          rows: bus?.rows || 10,
          cols: bus?.cols || 4,
          sleeperSeats: bus?.sleeperSeats || [],
          operatorName: bus?.operatorId?.name || 'Royal Travels',
          amenities
        },
        occupiedSeats,
        boardingPoints,
        droppingPoints,
        cancellationPolicy
      }
    });

  } catch (err: any) {
    console.error(`[Trip Details API] Error loading Trip ${params}:`, err);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching trip details.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/trips/[tripId] - Update trip status.
 * Permitted roles: operator, admin
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await dbConnect();
    const { tripId } = await params;

    // 1. Authenticate approved operator or admin
    const { user, errorResponse } = await verifyAuth(['operator', 'admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    // 2. Parse and validate body
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const validation = updateStatusSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid input data';
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    // 3. Fetch the Trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json(
        { success: false, message: 'Trip not found.' },
        { status: 404 }
      );
    }

    const bus = await Bus.findById(trip.busId);
    if (!bus) {
      return NextResponse.json(
        { success: false, message: 'Associated bus not found.' },
        { status: 404 }
      );
    }

    // 4. Verify operator owns the bus for this trip
    let operatorId = bus.operatorId.toString();
    if (user.role === 'operator') {
      if (operatorId !== user.id) {
        return NextResponse.json(
          { success: false, message: 'Access denied. You can only update trips for your own buses.' },
          { status: 403 }
        );
      }
    }

    // 5. Production-Grade State Transition Validation
    const currentStatus = trip.status;

    // If status is already the requested status, return early
    if (currentStatus === status) {
      return NextResponse.json({
        success: true,
        message: `Trip is already in ${status} status.`,
        data: trip
      });
    }

    // Terminal states cannot be altered
    if (currentStatus === 'ARRIVED' || currentStatus === 'CANCELLED') {
      return NextResponse.json({
        success: false,
        message: `Cannot change status of a trip that is already ${currentStatus}.`
      }, { status: 400 });
    }

    // Allowed transition map (Strict forward-only state machine)
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      SCHEDULED: ['BOARDING', 'CANCELLED'],
      BOARDING: ['DEPARTED', 'CANCELLED'],
      DEPARTED: ['IN_TRANSIT'],
      IN_TRANSIT: ['ARRIVED'],
      ARRIVED: [],
      CANCELLED: [],
    };

    const validNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!validNext.includes(status)) {
      return NextResponse.json({
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${status}'. Allowed next: ${validNext.join(', ') || 'None (Locked)'}.`
      }, { status: 400 });
    }

    // Time-based validation checks
    const now = new Date();
    if (status === 'BOARDING') {
      // Boarding cannot be opened more than 2 hours before scheduled departure
      const twoHoursBefore = new Date(trip.departureTime.getTime() - 2 * 60 * 60 * 1000);
      if (now < twoHoursBefore) {
        return NextResponse.json({
          success: false,
          message: 'Boarding can only be initiated within 2 hours of scheduled departure time.'
        }, { status: 400 });
      }
    }

    // 6. Update status
    trip.status = status as any;
    await trip.save();

    // 7. Broadcast Socket.io state changes (real-time customer tracking view)
    const io = (global as any).io;
    if (io) {
      io.to(tripId).emit('trip:status-updated', { tripId, status });
      console.log(`[Trip Status Update] Socket.io broadcasted status ${status} for trip ${tripId}`);
    }

    // 7. Invalidate operator dashboard Redis caches
    try {
      const stream = redis.scanStream({
        match: `operator:dashboard:*:${operatorId}*`,
      });

      stream.on('data', async (keys) => {
        if (keys.length) {
          const pipeline = redis.pipeline();
          keys.forEach((key: string) => pipeline.del(key));
          await pipeline.exec();
          console.log(`[Trip Status Update] Invalidated operator dashboard cache keys:`, keys);
        }
      });
    } catch (redisErr) {
      console.warn('[Trip Status Update] Redis cache invalidation error:', redisErr);
    }

    return NextResponse.json({
      success: true,
      message: `Trip status updated to ${status} successfully.`,
      data: trip
    });

  } catch (error: any) {
    console.error('[Update Trip API] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error updating trip status.' },
      { status: 500 }
    );
  }
}

