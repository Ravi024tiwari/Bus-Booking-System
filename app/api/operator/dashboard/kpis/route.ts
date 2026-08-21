import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import redis from '@/lib/redis';
import { Trip, Order, Review } from '@/models';
import { getOperatorContext } from '../helper';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const context = await getOperatorContext();
    if (context.errorResponse) {
      return context.errorResponse;
    }
    const { operatorId, buses, busIds } = context;

    if (!operatorId || !busIds || busIds.length === 0) {
      return NextResponse.json({
        success: true,
        cached: false,
        data: {
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
        }
      });
    }

    const url = new URL(req.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const routeIdParam = url.searchParams.get('routeId');
    const busTypeParam = url.searchParams.get('busType');

    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startDate = startDateParam ? new Date(startDateParam) : defaultStartDate;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEndDate;

    const durationMs = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - durationMs - 1000);
    const prevEndDate = new Date(startDate.getTime() - 1000);

    // Redis cache key for KPIs
    const cacheFiltersHash = [
      startDate.toISOString(),
      endDate.toISOString(),
      routeIdParam || 'all',
      busTypeParam || 'all'
    ].join(':');
    const cacheKey = `operator:dashboard:kpis:${operatorId}:${cacheFiltersHash}`;

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
      console.warn('[Redis] Cache get error for KPIs (falling back to database):', err);
    }

    const currentTripQuery: any = { busId: { $in: busIds }, departureTime: { $gte: startDate, $lte: endDate } };
    const prevTripQuery: any = { busId: { $in: busIds }, departureTime: { $gte: prevStartDate, $lte: prevEndDate } };

    if (routeIdParam) {
      currentTripQuery.routeId = new mongoose.Types.ObjectId(routeIdParam);
      prevTripQuery.routeId = new mongoose.Types.ObjectId(routeIdParam);
    }
    if (busTypeParam && busTypeParam !== 'all') {
      currentTripQuery.busType = busTypeParam;
      prevTripQuery.busType = busTypeParam;
    }

    const currentTrips = await Trip.find(currentTripQuery).populate('routeId');
    const prevTrips = await Trip.find(prevTripQuery);

    const currentTripIds = currentTrips.map((t) => t._id);
    const prevTripIds = prevTrips.map((t) => t._id);

    // 1. Order stats
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

    // 2. Active routes
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

    // 3. Occupancy Rate
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

    // 4. CSAT Reviews rating
    const currentReviews = await Review.find({
      busId: { $in: busIds },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalReviews = currentReviews.length;
    const avgRating = totalReviews > 0 ? parseFloat((currentReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)) : 0;

    const prevReviews = await Review.find({
      busId: { $in: busIds },
      createdAt: { $gte: prevStartDate, $lte: prevEndDate }
    });
    const prevTotalReviews = prevReviews.length;
    const prevAvgRating = prevTotalReviews > 0 ? prevReviews.reduce((sum, r) => sum + r.rating, 0) / prevTotalReviews : 0;
    const ratingGrowth = parseFloat((avgRating - prevAvgRating).toFixed(1));

    const kpiData = {
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
    };

    // Cache for 60 seconds
    try {
      await redis.setex(cacheKey, 60, JSON.stringify(kpiData));
    } catch (err) {
      console.warn('[Redis] Cache set error for KPIs:', err);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      data: kpiData
    });

  } catch (err: any) {
    console.error('[Operator KPIs API] Fatal Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error rendering KPIs.' },
      { status: 500 }
    );
  }
}
