import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
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

    const cacheKey = `operator:dashboard:driver-performance:${operatorId}`;

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
      console.warn('[Redis] Cache get error for driver performance:', err);
    }

    // Driver performance (mock/computed data matching UI structure)
    const driverPerformance = [
      { driverName: 'Karan Connetreton', onTimeRate: 98.0, status: 'Positive' },
      { driverName: 'Darris Barrisson', onTimeRate: 95.0, status: 'Positive' },
      { driverName: 'Janna Manisoy', onTimeRate: 91.0, status: 'Positive' },
      { driverName: 'Daren Pannilcanour', onTimeRate: 88.0, status: 'Rate' }
    ];

    try {
      // Cache driver performance data for 1 hour (3600 seconds)
      await redis.setex(cacheKey, 3600, JSON.stringify(driverPerformance));
    } catch (err) {
      console.warn('[Redis] Cache set error for driver performance:', err);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      data: driverPerformance
    });

  } catch (err: any) {
    console.error('[Operator Driver Performance API] Fatal Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error rendering driver performance.' },
      { status: 500 }
    );
  }
}
