import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-proxy';
import dbConnect from '@/lib/db';
import { Trip, Order, Bus } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Authenticate Admin User
    const { user, errorResponse } = await verifyAuth(['admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    await dbConnect();

    // 2. Parse Query Parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'today' | 'upcoming' | 'previous'
    const skip = (page - 1) * limit;

    let tripFilter: any = {};
    const now = new Date();

    // Calculate today's date string in YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // 3. Construct Date Filters for Trip-based Queries
    if (filter === 'today') {
      tripFilter = { date: todayStr };
    } else if (filter === 'upcoming') {
      tripFilter = { 
        departureTime: { $gt: now },
        date: { $ne: todayStr }
      };
    } else if (filter === 'previous') {
      tripFilter = { 
        departureTime: { $lt: now },
        date: { $ne: todayStr }
      };
    }

    // 4. Fetch Paginated Trips with populated bus, route, and operator information
    const trips = await Trip.find(tripFilter)
      .sort({ departureTime: filter === 'previous' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'busId',
        populate: {
          path: 'operatorId',
          select: 'name email phoneNumber'
        }
      })
      .populate('routeId');

    const total = await Trip.countDocuments(tripFilter);
    const hasMore = skip + trips.length < total;

    // 5. Gather booked seat counts for each trip in parallel
    const formattedTrips = await Promise.all(trips.map(async (trip: any) => {
      const bus = trip.busId;
      const operator = bus?.operatorId;

      // Extract Cloudinary bus images safely
      let busImages: string[] = [];
      if (bus && Array.isArray(bus.images) && bus.images.length > 0) {
        busImages = bus.images.filter(Boolean);
      } else if (bus && typeof bus.images === 'string' && bus.images) {
        busImages = [bus.images];
      } else if (trip.busId) {
        try {
          const directBus = await Bus.findById(trip.busId).lean() as any;
          if (directBus && Array.isArray(directBus.images) && directBus.images.length > 0) {
            busImages = directBus.images.filter(Boolean);
          }
        } catch (_) {}
      }

      // Calculate seats booked for this trip (only confirmed bookings count)
      const confirmedOrders = await Order.find({ tripId: trip._id, status: 'CONFIRMED' });
      const seatsBooked = confirmedOrders.reduce((sum: number, order: any) => sum + (order.seatNumbers?.length || 0), 0);

      const route = trip.routeId as any;
      const viaStops = trip.viaStops || (route?.stops ? route.stops.map((s: any) => s.stationName) : []);

      return {
        id: trip._id,
        busNumber: trip.busNumber,
        busType: trip.busType,
        source: trip.source,
        destination: trip.destination,
        viaStops,
        date: trip.date,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        fare: trip.fare,
        offerPercentage: trip.offerPercentage || 0,
        status: trip.status,
        capacity: bus?.capacity || 40,
        seatsBooked,
        averageRating: trip.averageRating || 0,
        totalReviews: trip.totalReviews || 0,
        busImages,
        operatorDetails: operator ? {
          id: operator._id,
          name: operator.name,
          email: operator.email,
          phoneNumber: operator.phoneNumber || 'N/A'
        } : null
      };
    }));

    return NextResponse.json({
      success: true,
      data: formattedTrips,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    });

  } catch (err: any) {
    console.error('[Admin Trips GET API] Fatal error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching operator trips.' },
      { status: 500 }
    );
  }
}
