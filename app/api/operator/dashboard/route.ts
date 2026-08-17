import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { verifyAuth } from '@/lib/auth-proxy';
import redis from '@/lib/redis';
import { Bus, Trip, Order, Review, TrackingSession } from '@/models';

// get the dashbboard data for the operator 
export async function GET(req: Request) {
  try {
    // 1. Authenticate and check operator role/status

    const authResult = await verifyAuth(['operator']);

    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }
    const operatorId = authResult.user?.id;

    if (!operatorId) {
      return NextResponse.json(
        { success: false, message: 'Operator credentials could not be resolved.' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // 2. Parse query parameters for filters
    const url = new URL(req.url);//here we are filtering the data from the redis database
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const routeIdParam = url.searchParams.get('routeId');
    const busTypeParam = url.searchParams.get('busType');

    // Default dates: Start of current month to current time
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startDate = startDateParam ? new Date(startDateParam) : defaultStartDate;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEndDate;

    // Calculate dates for the previous comparison period of the same length
    const durationMs = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - durationMs - 1000);
    const prevEndDate = new Date(startDate.getTime() - 1000);

    // 3. Redis Cache check
    const cacheFiltersHash = [
      startDate.toISOString(),
      endDate.toISOString(),
      routeIdParam || 'all',
      busTypeParam || 'all'
    ].join(':');
    const cacheKey = `operator:dashboard:${operatorId}:${cacheFiltersHash}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          success: true,
          cached: true,
          data: JSON.parse(cached)
        });
      }
    } catch (err) {
      console.warn('[Redis] Cache get error (falling back to database):', err);
    }

    // 4. Fetch operator's buses
    const buses = await Bus.find({ operatorId });
    const busIds = buses.map((b) => b._id);

    if (busIds.length === 0) {
      // Return empty structure if operator has no buses
      const emptyData = {
        kpis: {
          totalBookings: 0,
          totalBookingsGrowth: 0,
          activeRoutes: 0,
          activeRoutesGrowth: 0,
          totalRevenue: 0,
          totalRevenueGrowth: 0,
          occupancyRate: 0,
          occupancyRateGrowth: 0,
          avgRating: 0,
          totalReviews: 0,
          ratingGrowth: 0
        },
        routeStatus: [],
        salesTrends: [],
        upcomingSchedules: [],
        driverPerformance: [],
        feedbackOverview: []
      };
      return NextResponse.json({ success: true, cached: false, data: emptyData });
    }

    // 5. Fetch current and previous period trips
    const currentTripQuery: any = { busId: { $in: busIds }, departureTime: { $gte: startDate, $lte: endDate } };
    const prevTripQuery: any = { busId: { $in: busIds }, departureTime: { $gte: prevStartDate, $lte: prevEndDate } };

    if (routeIdParam) {
      currentTripQuery.routeId = new mongoose.Types.ObjectId(routeIdParam);
      prevTripQuery.routeId = new mongoose.Types.ObjectId(routeIdParam);
    }
    if (busTypeParam) {
      currentTripQuery.busType = busTypeParam;
      prevTripQuery.busType = busTypeParam;
    }

    const currentTrips = await Trip.find(currentTripQuery).populate('routeId');
    const prevTrips = await Trip.find(prevTripQuery);

    const currentTripIds = currentTrips.map((t) => t._id);
    const prevTripIds = prevTrips.map((t) => t._id);

    // 6. DB Aggregations: Current vs Previous period Order Stats (Bookings & Revenue)
    const [currentOrderStats] = await Order.aggregate([
      { $match: { tripId: { $in: currentTripIds }, status: 'CONFIRMED' } },
      {
        $group: {
          _id: null,
          bookings: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      }
    ]) || [{ bookings: 0, revenue: 0 }];

    const [prevOrderStats] = await Order.aggregate([
      { $match: { tripId: { $in: prevTripIds }, status: 'CONFIRMED' } },
      {
        $group: {
          _id: null,
          bookings: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      }
    ]) || [{ bookings: 0, revenue: 0 }];

    const totalBookings = currentOrderStats?.bookings || 0;
    const prevBookings = prevOrderStats?.bookings || 0;
    const totalBookingsGrowth = prevBookings > 0 ? Math.round(((totalBookings - prevBookings) / prevBookings) * 100) : 0;

    const totalRevenue = currentOrderStats?.revenue || 0;
    const prevRevenue = prevOrderStats?.revenue || 0;
    const totalRevenueGrowth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

    // 7. DB Aggregations: Active Routes
    const activeCurrentRouteIds = new Set(
      currentTrips
        .filter((t) => ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT'].includes(t.status))
        .map((t) => t.routeId?.toString())
        .filter(Boolean)
    );
    const activePrevRouteIds = new Set(
      prevTrips
        .filter((t) => ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT'].includes(t.status))
        .map((t) => t.routeId?.toString())
        .filter(Boolean)
    );
    const activeRoutes = activeCurrentRouteIds.size;
    const prevActiveRoutes = activePrevRouteIds.size;
    const activeRoutesGrowth = activeRoutes - prevActiveRoutes;

    // 8. DB Aggregations: Occupancy Rates
    // Get booked seats counts
    const [currentSeatsBookedResult] = await Order.aggregate([
      { $match: { tripId: { $in: currentTripIds }, status: 'CONFIRMED' } },
      { $project: { seatCount: { $size: '$seatNumbers' } } },
      { $group: { _id: null, totalSeatsBooked: { $sum: '$seatCount' } } }
    ]) || [{ totalSeatsBooked: 0 }];
    const currentSeatsBooked = currentSeatsBookedResult?.totalSeatsBooked || 0;

    const [prevSeatsBookedResult] = await Order.aggregate([
      { $match: { tripId: { $in: prevTripIds }, status: 'CONFIRMED' } },
      { $project: { seatCount: { $size: '$seatNumbers' } } },
      { $group: { _id: null, totalSeatsBooked: { $sum: '$seatCount' } } }
    ]) || [{ totalSeatsBooked: 0 }];
    const prevSeatsBooked = prevSeatsBookedResult?.totalSeatsBooked || 0;

    let currentCapacity = 0;
    currentTrips.forEach((trip) => {
      const bus = buses.find((b) => b._id.toString() === trip.busId.toString());
      currentCapacity += bus?.capacity || 40;
    });

    let prevCapacity = 0;
    prevTrips.forEach((trip) => {
      const bus = buses.find((b) => b._id.toString() === trip.busId.toString());
      prevCapacity += bus?.capacity || 40;
    });

    const occupancyRate = currentCapacity > 0 ? Math.round((currentSeatsBooked / currentCapacity) * 100) : 0;
    const prevOccupancyRate = prevCapacity > 0 ? Math.round((prevSeatsBooked / prevCapacity) * 100) : 0;
    const occupancyRateGrowth = occupancyRate - prevOccupancyRate;

    // 9. CSAT Ratings & Comments
    const currentReviews = await Review.find({
      busId: { $in: busIds },
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('passengerId', 'name profileImage');

    const totalReviews = currentReviews.length;
    const avgRating = totalReviews > 0 ? parseFloat((currentReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)) : 0;

    const prevReviews = await Review.find({
      busId: { $in: busIds },
      createdAt: { $gte: prevStartDate, $lte: prevEndDate }
    });
    const prevTotalReviews = prevReviews.length;
    const prevAvgRating = prevTotalReviews > 0 ? prevReviews.reduce((sum, r) => sum + r.rating, 0) / prevTotalReviews : 0;
    const ratingGrowth = parseFloat((avgRating - prevAvgRating).toFixed(1));

    // 10. Live Route Status & Telemetry
    const liveTrips = await Trip.find({
      busId: { $in: busIds },
      status: { $in: ['BOARDING', 'DEPARTED', 'IN_TRANSIT'] }
    }).populate('routeId');

    const liveTripIds = liveTrips.map((lt) => lt._id);
    const trackingSessions = await TrackingSession.find({ tripId: { $in: liveTripIds } });

    const routeStatus = await Promise.all(
      liveTrips.map(async (trip) => {
        const session = trackingSessions.find((s) => s.tripId.toString() === trip._id.toString());
        const [passengerStats] = await Order.aggregate([
          { $match: { tripId: trip._id, status: 'CONFIRMED' } },
          { $project: { count: { $size: '$seatNumbers' } } },
          { $group: { _id: null, total: { $sum: '$count' } } }
        ]) || [{ total: 0 }];

        // Check if delayed: SCHEDULED trips past their departure time are delayed.
        const isDelayed = trip.status === 'SCHEDULED' && trip.departureTime < now;

        return {
          tripId: trip._id,
          routeName: trip.routeId
            ? `${(trip.routeId as any).source} to ${(trip.routeId as any).destination}`
            : `${trip.source} to ${trip.destination}`,
          busNumber: trip.busNumber,
          busType: trip.busType,
          status: trip.status,
          passengersCount: passengerStats?.total || 0,
          delayStatus: isDelayed ? 'Delayed' : 'On-time',
          coordinates: session
            ? { latitude: session.latitude, longitude: session.longitude }
            : null
        };
      })
    );

    // 11. Sales & Booking Trends (Grouped by Day)
    const salesTrends = await Order.aggregate([
      { $match: { tripId: { $in: currentTripIds }, status: 'CONFIRMED' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 12. Upcoming Schedules
    const upcomingTrips = await Trip.find({
      busId: { $in: busIds },
      status: 'SCHEDULED',
      departureTime: { $gte: now }
    })
      .sort({ departureTime: 1 })
      .limit(10)
      .populate('routeId');

    const upcomingSchedules = await Promise.all(
      upcomingTrips.map(async (trip) => {
        const bus = buses.find((b) => b._id.toString() === trip.busId.toString());
        const [bookedStats] = await Order.aggregate([
          { $match: { tripId: trip._id, status: 'CONFIRMED' } },
          { $project: { count: { $size: '$seatNumbers' } } },
          { $group: { _id: null, total: { $sum: '$count' } } }
        ]) || [{ total: 0 }];

        const driversMock = ['Karan Connetreton', 'Darris Barrisson', 'Janna Manisoy', 'Daren Pannilcanour'];
        const driverIndex = Math.abs(trip._id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % driversMock.length;
        const driverName = driversMock[driverIndex];

        return {
          tripId: trip._id,
          routeName: trip.routeId
            ? `${(trip.routeId as any).source} to ${(trip.routeId as any).destination}`
            : `${trip.source} to ${trip.destination}`,
          busNumber: trip.busNumber,
          driverName,
          departureTime: trip.departureTime.toISOString(),
          capacity: bus?.capacity || 40,
          occupiedSeats: bookedStats?.total || 0,
          status: trip.status
        };
      })
    );

    // 13. Driver Performance Stats (Generated matching UI structure)
    const driverPerformance = [
      { driverName: 'Karan Connetreton', onTimeRate: 98.0, status: 'Positive' },
      { driverName: 'Darris Barrisson', onTimeRate: 95.0, status: 'Positive' },
      { driverName: 'Janna Manisoy', onTimeRate: 91.0, status: 'Positive' },
      { driverName: 'Daren Pannilcanour', onTimeRate: 88.0, status: 'Rate' }
    ];

    // 14. Feedback Overview (Mapping Review details)
    const feedbackOverview = currentReviews.slice(0, 15).map((rev) => ({
      passengerName: (rev.passengerId as any)?.name || 'Passenger',
      profileImage: (rev.passengerId as any)?.profileImage || '',
      rating: rev.rating,
      comment: rev.comment || 'No comment left.',
      createdAt: rev.createdAt.toISOString()
    }));

    // Unified API payload response
    const dashboardData = {
      kpis: {
        totalBookings,
        totalBookingsGrowth,
        activeRoutes,
        activeRoutesGrowth,
        totalRevenue,
        totalRevenueGrowth,
        occupancyRate,
        occupancyRateGrowth,
        avgRating,
        totalReviews,
        ratingGrowth
      },
      routeStatus,
      salesTrends,
      upcomingSchedules,
      driverPerformance,
      feedbackOverview
    };

    // 15. Save to Redis Cache with TTL of 60 seconds (1 minute)
    try {
      await redis.setex(cacheKey, 60, JSON.stringify(dashboardData));
    } catch (err) {
      console.warn('[Redis] Cache set error:', err);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      data: dashboardData
    });

  } catch (err: any) {
    console.error('[Operator Dashboard API] Fatal Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error rendering operator dashboard.' },
      { status: 500 }
    );
  }
}
