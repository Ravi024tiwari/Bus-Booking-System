import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import redis from '@/lib/redis';
import { Trip, Order } from '@/models';
import { getOperatorContext } from '../helper';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const context = await getOperatorContext();
    if (context.errorResponse) {
      return context.errorResponse;
    }
    const { operatorId, busIds } = context;

    if (!operatorId || !busIds || busIds.length === 0) {
      return NextResponse.json({
        success: true,
        cached: false,
        data: []
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

    const cacheFiltersHash = [
      startDate.toISOString(),
      endDate.toISOString(),
      routeIdParam || 'all',
      busTypeParam || 'all'
    ].join(':');
    const cacheKey = `operator:dashboard:sales-trends:${operatorId}:${cacheFiltersHash}`;

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
      console.warn('[Redis] Cache get error for sales trends:', err);
    }

    const currentTripQuery: any = { busId: { $in: busIds }, departureTime: { $gte: startDate, $lte: endDate } };

    if (routeIdParam) {
      currentTripQuery.routeId = new mongoose.Types.ObjectId(routeIdParam);
    }
    if (busTypeParam && busTypeParam !== 'all') {
      currentTripQuery.busType = busTypeParam;
    }

    const currentTrips = await Trip.find(currentTripQuery);
    const currentTripIds = currentTrips.map((t) => t._id);

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

    try {
      await redis.setex(cacheKey, 60, JSON.stringify(salesTrends));
    } catch (err) {
      console.warn('[Redis] Cache set error for sales trends:', err);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      data: salesTrends
    });

  } catch (err: any) {
    console.error('[Operator Sales Trends API] Fatal Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error rendering sales trends.' },
      { status: 500 }
    );
  }
}
