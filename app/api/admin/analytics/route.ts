import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import redis from '@/lib/redis';
import { User, Bus, Trip, Order } from '@/models';
import { verifyAuth } from '@/lib/auth-proxy';

/**
 * GET /api/admin/analytics
 * Admin-only route to retrieve high-level dashboard analytics and statistics.
 * Aggregates revenue, passenger and operator counts, daily trends (for charts),
 * top-performing routes and operators, and recent bookings.
 * 
 * Supports cache bypass via search param: ?refresh=true
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user as admin
    const { user, errorResponse } = await verifyAuth(['admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const bypassCache = searchParams.get('refresh') === 'true';
    const cacheKey = 'admin:analytics:dashboard';

    // 2. Try fetching from Redis Cache if not bypassing
    if (!bypassCache) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          console.log('[Admin Analytics API] Cache hit');
          return NextResponse.json({
            success: true,
            data: JSON.parse(cachedData),
            cached: true
          });
        }
      } catch (redisErr) {
        console.warn('[Admin Analytics API] Redis fetch error:', redisErr);
      }
    }

    await dbConnect();

    // 3. Overview Statistics
    // Passengers Count
    const totalPassengers = await User.countDocuments({ role: 'passenger' });

    // Operators Count by status
    const operatorStatsGroup = await User.aggregate([
      { $match: { role: 'operator' } },
      {
        $group: {
          _id: '$operatorApprovalStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const operators = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    operatorStatsGroup.forEach((group: any) => {
      const count = group.count;
      const status = group._id;
      if (status === 'PENDING') operators.pending = count;
      else if (status === 'APPROVED') operators.approved = count;
      else if (status === 'REJECTED') operators.rejected = count;
      operators.total += count;
    });

    // Buses Count
    const totalBuses = await Bus.countDocuments();

    // Active Trips Count (scheduled/boarding/in transit/departed)
    const activeTrips = await Trip.countDocuments({
      status: { $in: ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT'] }
    });

    // Gross Revenue & Total Bookings (from Confirmed Orders)
    const orderStats = await Order.aggregate([
      { $match: { status: 'CONFIRMED' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = orderStats[0]?.totalRevenue || 0;
    const totalBookings = orderStats[0]?.totalBookings || 0;
    const platformCommission = totalRevenue * 0.10; // 10% platform commission

    // 4. Daily Trend Data (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrendRaw = await Order.aggregate([
      {
        $match: {
          status: 'CONFIRMED',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          bookingsCount: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      }
    ]);

    // Format daily trend to match frontend charts (e.g. { date: 'YYYY-MM-DD', bookings: X, revenue: Y })
    const dailyTrend = dailyTrendRaw.map((item: any) => {
      const { year, month, day } = item._id;
      const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        date: formattedDate,
        bookings: item.bookingsCount,
        revenue: item.revenue
      };
    });

    // 5. Top Performing Routes (Limit 5)
    const topRoutesRaw = await Order.aggregate([
      { $match: { status: 'CONFIRMED' } },
      {
        $group: {
          _id: { from: '$fromStop', to: '$toStop' },
          bookingsCount: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      },
      { $sort: { bookingsCount: -1 } },
      { $limit: 5 }
    ]);

    const topRoutes = topRoutesRaw.map((route: any) => ({
      route: `${route._id.from} ➔ ${route._id.to}`,
      bookings: route.bookingsCount,
      revenue: route.totalRevenue
    }));

    // 6. Top Performing Operators (Limit 5)
    const topOperatorsRaw = await Order.aggregate([
      { $match: { status: 'CONFIRMED' } },
      {
        $lookup: {
          from: 'trips',
          localField: 'tripId',
          foreignField: '_id',
          as: 'trip'
        }
      },
      { $unwind: '$trip' },
      {
        $lookup: {
          from: 'buses',
          localField: 'trip.busId',
          foreignField: '_id',
          as: 'bus'
        }
      },
      { $unwind: '$bus' },
      {
        $lookup: {
          from: 'users',
          localField: 'bus.operatorId',
          foreignField: '_id',
          as: 'operator'
        }
      },
      { $unwind: '$operator' },
      {
        $group: {
          _id: '$operator._id',
          name: { $first: '$operator.name' },
          email: { $first: '$operator.email' },
          bookingsCount: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    const topOperators = topOperatorsRaw.map((op: any) => ({
      id: op._id.toString(),
      name: op.name,
      email: op.email,
      bookings: op.bookingsCount,
      revenue: op.totalRevenue
    }));

    // 7. Recent Bookings (Limit 5)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('passengerId', 'name email')
      .populate({
        path: 'tripId',
        select: 'source destination departureTime fare busNumber'
      });

    const recentBookings = recentOrders.map((order: any) => ({
      id: order._id.toString(),
      passenger: order.passengerId ? {
        id: order.passengerId._id.toString(),
        name: order.passengerId.name,
        email: order.passengerId.email
      } : null,
      trip: order.tripId ? {
        id: order.tripId._id.toString(),
        source: order.tripId.source,
        destination: order.tripId.destination,
        departureTime: order.tripId.departureTime,
        busNumber: order.tripId.busNumber
      } : null,
      seatNumbers: order.seatNumbers,
      amount: order.amount,
      status: order.status,
      fromStop: order.fromStop,
      toStop: order.toStop,
      createdAt: order.createdAt
    }));

    const resultData = {
      overview: {
        totalRevenue,
        platformCommission,
        totalBookings,
        totalPassengers,
        operators,
        totalBuses,
        activeTrips
      },
      dailyTrend,
      topRoutes,
      topOperators,
      recentBookings
    };

    // 8. Save to Redis Cache (5 minutes TTL = 300 seconds)
    try {
      await redis.set(cacheKey, JSON.stringify(resultData), 'EX', 300);
      console.log('[Admin Analytics API] Saved analytics to Redis cache');
    } catch (redisErr) {
      console.warn('[Admin Analytics API] Redis save error:', redisErr);
    }

    return NextResponse.json({
      success: true,
      data: resultData,
      cached: false
    });

  } catch (error: any) {
    console.error('[Admin Analytics GET API] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error generating analytics.' },
      { status: 500 }
    );
  }
}
