import { NextResponse } from 'next/server';
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

    const cacheKey = `operator:dashboard:route-status:${operatorId}`;

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
      console.warn('[Redis] Cache get error for route status:', err);
    }

    const now = new Date();
    const liveTrips = await Trip.find({
      busId: { $in: busIds },
      status: { $in: ['BOARDING', 'DEPARTED', 'IN_TRANSIT'] }
    }).populate('routeId');

    const routeStatus = await Promise.all(
      liveTrips.map(async (trip) => {
        const [passengerStats] = await Order.aggregate([
          { $match: { tripId: trip._id, status: 'CONFIRMED' } },
          { $project: { count: { $size: '$seatNumbers' } } },
          { $group: { _id: null, total: { $sum: '$count' } } }
        ]) || [{ total: 0 }];

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
          delayStatus: isDelayed ? 'Delayed' : 'On-time'
        };
      })
    );

    // Cache route status for a short duration (10 seconds)
    try {
      await redis.setex(cacheKey, 10, JSON.stringify(routeStatus));
    } catch (err) {
      console.warn('[Redis] Cache set error for route status:', err);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      data: routeStatus
    });

  } catch (err: any) {
    console.error('[Operator Route Status API] Fatal Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error rendering route status.' },
      { status: 500 }
    );
  }
}
