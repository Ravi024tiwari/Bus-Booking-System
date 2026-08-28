import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Trip, Bus, Route, User, Notification } from '@/models';
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
    const { busId, routeId, date, departureTime, fare, offerPercentage, offerLimit } = body;

    // Validate inputs
    if (!busId || !routeId || !date || !departureTime || fare === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: busId, routeId, date, departureTime, fare.' },
        { status: 400 }
      );
    }

    let parsedOfferPercentage = 0;
    let parsedOfferLimit = 0;

    if (offerPercentage !== undefined && offerPercentage !== null && offerPercentage !== '') {
      parsedOfferPercentage = Number(offerPercentage);
      if (isNaN(parsedOfferPercentage) || parsedOfferPercentage < 0 || parsedOfferPercentage > 100) {
        return NextResponse.json(
          { success: false, message: 'Offer percentage must be a number between 0 and 100.' },
          { status: 400 }
        );
      }
    }

    if (offerLimit !== undefined && offerLimit !== null && offerLimit !== '') {
      parsedOfferLimit = Number(offerLimit);
      if (isNaN(parsedOfferLimit) || parsedOfferLimit < 0) {
        return NextResponse.json(
          { success: false, message: 'Offer limit must be a non-negative number.' },
          { status: 400 }
        );
      }
    }

    if (!mongoose.Types.ObjectId.isValid(busId) || !mongoose.Types.ObjectId.isValid(routeId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid busId or routeId format.' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, message: 'Date must be in YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    let parsedDeparture: Date;
    const cleanDepTime = departureTime.trim();

    // Check if it's a simple 12-hour or 24-hour time format
    const match12 = cleanDepTime.toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    const match24 = cleanDepTime.match(/^(\d{1,2}):(\d{2})$/);

    if (match12 || match24) {
      let hours = 0;
      let minutes = 0;
      if (match12) {
        hours = parseInt(match12[1], 10);
        minutes = parseInt(match12[2], 10);
        const ampm = match12[3];
        if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
          return NextResponse.json({ success: false, message: 'Invalid departure time values.' }, { status: 400 });
        }
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      } else if (match24) {
        hours = parseInt(match24[1], 10);
        minutes = parseInt(match24[2], 10);
        if (hours < 0 || hours >= 24 || minutes < 0 || minutes > 59) {
          return NextResponse.json({ success: false, message: 'Invalid departure time values.' }, { status: 400 });
        }
      }

      // Combine date and time timezone-safely
      const [year, month, day] = date.split('-').map(Number);
      parsedDeparture = new Date(year, month - 1, day, hours, minutes);
    } else {
      parsedDeparture = new Date(departureTime);
    }

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
      date,
      departureTime: parsedDeparture,
      arrivalTime: parsedArrival,
      fare,
      offerPercentage: parsedOfferPercentage,
      offerLimit: parsedOfferLimit,
      offerBookedCount: 0,
      status: 'SCHEDULED'
    });

    // Create Notification for Admins and Broadcast via Socket.io
    try {
      const admins = await User.find({ role: 'admin' }, '_id');
      if (admins.length > 0) {
        const operatorName = user.name;
        const notificationTitle = 'New Trip Scheduled';
        const notificationMessage = `${operatorName} has scheduled a new trip: ${route.source} ➔ ${route.destination} on ${date}.`;
        
        const notificationPromises = admins.map(async (admin) => {
          return Notification.create({
            userId: admin._id,
            type: 'TRIP_ADDED',
            title: notificationTitle,
            message: notificationMessage,
          });
        });
        await Promise.all(notificationPromises);
        
        const io = (global as any).io;
        if (io) {
          io.to('admin').emit('admin:notification', {
            type: 'TRIP_ADDED',
            title: notificationTitle,
            message: notificationMessage,
            createdAt: new Date(),
          });
          console.log(`[Socket] Broadcasted new trip alert to admin room: ${route.source} -> ${route.destination}`);
        }
      }
    } catch (notifErr) {
      console.error('[Create Trip] Failed to create or broadcast notification:', notifErr);
    }

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
