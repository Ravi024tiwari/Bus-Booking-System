import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Trip, SeatState, Bus } from '@/models';
import { verifyAuth } from '@/lib/auth-proxy';

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

    // Format occupied seats as a key-value lookup: { "L-1A": { status: "BOOKED" }, "2C": { status: "HELD" } }
    const occupiedSeats: Record<string, { status: string; heldBy?: string; heldUntil?: string }> = {};
    activeSeats.forEach((seat: any) => {
      occupiedSeats[seat.seatNumber] = {
        status: seat.status,
        heldBy: seat.heldBy?.toString(),
        heldUntil: seat.heldUntil?.toISOString()
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

    const body = await req.json();
    const { status } = body;

    const allowedStatuses = ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED'];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // 2. Fetch the Trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json(
        { success: false, message: 'Trip not found.' },
        { status: 404 }
      );
    }

    // 3. Verify operator owns the bus for this trip
    if (user.role === 'operator') {
      const bus = await Bus.findById(trip.busId);
      if (!bus || bus.operatorId.toString() !== user.id) {
        return NextResponse.json(
          { success: false, message: 'Access denied. You can only update trips for your own buses.' },
          { status: 403 }
        );
      }
    }

    // 4. Update status
    trip.status = status as any;
    await trip.save();

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

