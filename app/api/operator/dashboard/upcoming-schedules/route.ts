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
    const { operatorId, buses, busIds } = context;

    if (!operatorId || !busIds || busIds.length === 0) {
      return NextResponse.json({
        success: true,
        cached: false,
        data: []
      });
    }

    const cacheKey = `operator:dashboard:upcoming-schedules:${operatorId}`;

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
      console.warn('[Redis] Cache get error for upcoming schedules:', err);
    }

    const now = new Date();
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

    try {
      await redis.setex(cacheKey, 60, JSON.stringify(upcomingSchedules));
    } catch (err) {
      console.warn('[Redis] Cache set error for upcoming schedules:', err);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      data: upcomingSchedules
    });

  } catch (err: any) {
    console.error('[Operator Upcoming Schedules API] Fatal Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error rendering upcoming schedules.' },
      { status: 500 }
    );
  }
}
