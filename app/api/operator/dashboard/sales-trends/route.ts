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

    const currentTripQuery: any = { busId: { $in: busIds } };

    if (routeIdParam) {
      currentTripQuery.routeId = new mongoose.Types.ObjectId(routeIdParam);
    }
    if (busTypeParam && busTypeParam !== 'all') {
      currentTripQuery.busType = busTypeParam;
    }

    const currentTrips = await Trip.find(currentTripQuery).select('_id');
    const currentTripIds = currentTrips.map((t) => t._id);

    if (currentTripIds.length === 0) {
      return NextResponse.json({
        success: true,
        cached: false,
        data: []
      });
    }

    const salesTrendsRaw = await Order.aggregate([
      { 
        $match: { 
          tripId: { $in: currentTripIds }, 
          status: 'CONFIRMED',
          createdAt: { $gte: startDate, $lte: endDate }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$amount' },
          seats: { $sum: { $size: { $ifNull: ['$seatNumbers', []] } } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Build continuous date map if date range is <= 62 days
    const trendsMap = new Map<string, { bookings: number; revenue: number; seats: number }>();
    salesTrendsRaw.forEach((item) => {
      trendsMap.set(item._id, {
        bookings: item.bookings || 0,
        revenue: item.revenue || 0,
        seats: item.seats || 0
      });
    });

    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    let finalSalesTrends = salesTrendsRaw;

    if (diffDays > 0 && diffDays <= 62) {
      const filledList: any[] = [];
      const curr = new Date(startDate);
      while (curr <= endDate) {
        const dateStr = curr.toISOString().split('T')[0];
        const item = trendsMap.get(dateStr) || { bookings: 0, revenue: 0, seats: 0 };
        filledList.push({
          _id: dateStr,
          ...item
        });
        curr.setDate(curr.getDate() + 1);
      }
      finalSalesTrends = filledList;
    }

    try {
      await redis.setex(cacheKey, 60, JSON.stringify(finalSalesTrends));
    } catch (err) {
      console.warn('[Redis] Cache set error for sales trends:', err);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      data: finalSalesTrends
    });

  } catch (err: any) {
    console.error('[Operator Sales Trends API] Fatal Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error rendering sales trends.' },
      { status: 500 }
    );
  }
}
