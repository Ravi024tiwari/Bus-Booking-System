import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { Review } from '@/models';
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

    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startDate = startDateParam ? new Date(startDateParam) : defaultStartDate;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEndDate;

    const cacheFiltersHash = [
      startDate.toISOString(),
      endDate.toISOString()
    ].join(':');
    const cacheKey = `operator:dashboard:feedback:${operatorId}:${cacheFiltersHash}`;

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
      console.warn('[Redis] Cache get error for feedback:', err);
    }

    const currentReviews = await Review.find({
      busId: { $in: busIds },
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('passengerId', 'name profileImage');

    const feedbackOverview = currentReviews.slice(0, 15).map((rev) => ({
      passengerName: (rev.passengerId as any)?.name || 'Passenger',
      profileImage: (rev.passengerId as any)?.profileImage || '',
      rating: rev.rating,
      comment: rev.comment || 'No comment left.',
      createdAt: rev.createdAt.toISOString()
    }));

    try {
      // Cache feedback overview for 5 minutes (300 seconds)
      await redis.setex(cacheKey, 300, JSON.stringify(feedbackOverview));
    } catch (err) {
      console.warn('[Redis] Cache set error for feedback:', err);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      data: feedbackOverview
    });

  } catch (err: any) {
    console.error('[Operator Feedback API] Fatal Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error rendering feedback.' },
      { status: 500 }
    );
  }
}
