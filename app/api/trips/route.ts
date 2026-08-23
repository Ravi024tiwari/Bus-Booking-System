import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Trip, Bus, Route } from '@/models';
import { verifyAuth } from '@/lib/auth-proxy';
import mongoose from 'mongoose';

/**
 * POST /api/trips - Schedule a new trip template instance.
 * Permitted roles: operator, admin
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Authenticate user
    const { user, errorResponse } = await verifyAuth(['operator', 'admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { busId, routeId, departureTime, fare } = body;

    // Validate inputs
    if (!busId || !routeId || !departureTime || fare === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: busId, routeId, departureTime, fare.' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(busId) || !mongoose.Types.ObjectId.isValid(routeId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid busId or routeId format.' },
        { status: 400 }
      );
    }

    const parsedDeparture = new Date(departureTime);

    if (isNaN(parsedDeparture.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid departureTime format.' },
        { status: 400 }
      );
    }

    if (parsedDeparture <= new Date()) {
      return NextResponse.json(
        { success: false, message: 'Departure time must be in the future.' },
        { status: 400 }
      );
    }

    if (typeof fare !== 'number' || fare <= 0) {
      return NextResponse.json(
        { success: false, message: 'Fare must be a positive number.' },
        { status: 400 }
      );
    }

    // 2. Fetch the Bus and Route
    const bus = await Bus.findById(busId);
    if (!bus) {
      return NextResponse.json(
        { success: false, message: 'Bus not found.' },
        { status: 404 }
      );
    }

    // Verify the bus belongs to this operator (if role is operator)
    if (user.role === 'operator' && bus.operatorId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Access denied. You can only schedule trips for your own registered buses.' },
        { status: 403 }
      );
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return NextResponse.json(
        { success: false, message: 'Route template not found.' },
        { status: 404 }
      );
    }

    // Calculate arrival time dynamically based on the last stop's arrival offset
    const lastStop = route.stops[route.stops.length - 1];
    if (!lastStop) {
      return NextResponse.json(
        { success: false, message: 'Invalid route stops sequence configurations.' },
        { status: 400 }
      );
    }

    const parsedArrival = new Date(parsedDeparture.getTime() + lastStop.arrivalOffsetMinutes * 60 * 1000);

    // 3. Conflict Prevention: Check if this bus is already scheduled for an overlapping trip
    // Overlap condition:
    // A trip overlaps if: trip.departureTime < newArrival AND trip.arrivalTime > newDeparture
    const overlappingTrip = await Trip.findOne({
      busId,
      status: { $ne: 'CANCELLED' },
      departureTime: { $lt: parsedArrival },
      arrivalTime: { $gt: parsedDeparture }
    });

    if (overlappingTrip) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Bus is already scheduled for an overlapping trip (${overlappingTrip.source} ➔ ${overlappingTrip.destination}) from ${new Date(overlappingTrip.departureTime).toLocaleTimeString()} to ${new Date(overlappingTrip.arrivalTime).toLocaleTimeString()}.` 
        },
        { status: 409 }
      );
    }

    // 4. Create Trip with denormalized fields
    const newTrip = await Trip.create({
      busId,
      routeId,
      busNumber: bus.busNumber,
      busType: bus.type,
      source: route.source,
      destination: route.destination,
      departureTime: parsedDeparture,
      arrivalTime: parsedArrival,
      fare,
      status: 'SCHEDULED'
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Trip scheduled successfully.',
        data: newTrip
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[Create Trip API] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error scheduling trip.' },
      { status: 500 }
    );
  }
}
