import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Trip, SeatState } from '@/models';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const source = searchParams.get('source');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date'); // Expecting format: YYYY-MM-DD
    const busTypeFilter = searchParams.get('type'); // Optional filter: AC Sleeper, AC Seater, etc.
    const minPrice = searchParams.get('minPrice'); // Optional
    const maxPrice = searchParams.get('maxPrice'); // Optional
    const sortBy = searchParams.get('sortBy'); // Optional: priceAsc, priceDesc, departure

    // 1. Mandatory Parameters Validation
    if (!source || !destination || !date) {
      return NextResponse.json(
        { success: false, message: 'Source, destination, and date parameters are required.' },
        { status: 400 }
      );
    }

    // 2. Build Date Range (00:00:00 to 23:59:59 of selected date in local/specified day timezone)
    const searchDate = new Date(date);
    if (isNaN(searchDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 3. Build Mongo Query Filters
    const query: any = {
      source: { $regex: new RegExp(`^${source.trim()}$`, 'i') },
      destination: { $regex: new RegExp(`^${destination.trim()}$`, 'i') },
      departureTime: { $gte: startOfDay, $lte: endOfDay }
    };

    if (busTypeFilter) {
      query.busType = busTypeFilter;
    }

    if (minPrice || maxPrice) {
      query.fare = {};
      if (minPrice) query.fare.$gte = parseFloat(minPrice);
      if (maxPrice) query.fare.$lte = parseFloat(maxPrice);
    }

    // 4. Determine Mongoose Sorting
    let sortOptions: any = { departureTime: 1 }; // Default: Departure time ascending
    if (sortBy === 'priceAsc') {
      sortOptions = { fare: 1 };
    } else if (sortBy === 'priceDesc') {
      sortOptions = { fare: -1 };
    } else if (sortBy === 'departure') {
      sortOptions = { departureTime: 1 };
    }

    // 5. Fetch Matching Trips
    const trips = await Trip.find(query)
      .sort(sortOptions)
      .populate({
        path: 'busId',
        populate: {
          path: 'operatorId',
          select: 'name'
        }
      });

    // 6. Augment results with Real-time seat counts
    const results = await Promise.all(
      trips.map(async (trip: any) => {
        const bus = trip.busId;
        const totalSeats = bus ? bus.capacity : 40; // Default fallback

        // Count seats that are HELD or BOOKED
        // Active holds are only valid if heldUntil is in the future
        const now = new Date();
        const occupiedSeats = await SeatState.countDocuments({
          tripId: trip._id,
          $or: [
            { status: 'BOOKED' },
            { 
              status: 'HELD', 
              heldUntil: { $gt: now } 
            }
          ]
        });

        const availableSeats = Math.max(0, totalSeats - occupiedSeats);

        return {
          id: trip._id,
          busId: bus?._id,
          operatorName: bus?.operatorId?.name || 'Royal Travels',
          busNumber: trip.busNumber,
          busType: trip.busType,
          source: trip.source,
          destination: trip.destination,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          fare: trip.fare,
          totalSeats,
          availableSeats,
          rating: 4.5, // Default rating (can tie to reviews average in the future)
          amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'Blanket'] // Standard amenities
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (err: any) {
    console.error('[Search API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error executing search.' },
      { status: 500 }
    );
  }
}
