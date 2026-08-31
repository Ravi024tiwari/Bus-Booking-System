import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import redis from '@/lib/redis';
import { Order, Review, Trip } from '@/models';
import { reviewSchema } from '@/lib/validations';

/**
 * POST /api/reviews - Submit a passenger feedback review for a bus.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Authenticate passenger
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // 2. Validate request payload
    const body = await req.json();
    const validation = reviewSchema.safeParse(body);

    if (!validation.success) {
      const errMsg = validation.error.issues[0]?.message || 'Invalid review payload';
      return NextResponse.json(
        { success: false, message: errMsg },
        { status: 400 }
      );
    }

    const { bookingId, rating, comment } = validation.data;

    // 3. Verify that the booking exists, belongs to the passenger, and is CONFIRMED
    const order = await Order.findOne({ _id: bookingId, passengerId: userId });
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'No matching booking found for your account.' },
        { status: 404 }
      );
    }

    if (order.status !== 'CONFIRMED') {
      return NextResponse.json(
        { success: false, message: 'Reviews can only be submitted for paid/confirmed bookings.' },
        { status: 400 }
      );
    }

    // 4. Retrieve associated Trip & Bus details
    const trip = await Trip.findById(order.tripId).populate('busId');
    if (!trip) {
      return NextResponse.json(
        { success: false, message: 'The associated trip details were not found.' },
        { status: 404 }
      );
    }

    const bus = trip.busId as any;
    if (!bus) {
      return NextResponse.json(
        { success: false, message: 'The bus assigned to this trip was not found.' },
        { status: 404 }
      );
    }

    const busId = bus._id;
    const operatorId = bus.operatorId;

    // 5. Create or Update Review (guaranteed unique per passengerId + bookingId)
    try {
      const review = await Review.findOneAndUpdate(
        { passengerId: userId, bookingId: order._id },
        {
          passengerId: userId,
          tripId: trip._id,
          busId,
          bookingId: order._id,
          rating,
          comment: comment || ''
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // 6. Atomically recalculate average rating & total reviews for the Trip
      const stats = await Review.aggregate([
        { $match: { tripId: trip._id } },
        {
          $group: {
            _id: '$tripId',
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : rating;
      const totalReviews = stats.length > 0 ? stats[0].totalReviews : 1;

      // Update Trip record with computed verified aggregate
      await Trip.findByIdAndUpdate(trip._id, {
        averageRating: avgRating,
        totalReviews: totalReviews
      });

      // 7. Invalidate operator dashboard, bus details, and trips Redis caches
      const busDetailsCacheKey = `bus:details:${busId}`;
      try {
        await redis.del(busDetailsCacheKey);
        
        // Scan and delete all dashboard cache variations for the operator
        const stream = redis.scanStream({
          match: `operator:dashboard:${operatorId}:*`,
        });

        stream.on('data', async (keys) => {
          if (keys.length) {
            const pipeline = redis.pipeline();
            keys.forEach((key: string) => pipeline.del(key));
            await pipeline.exec();
          }
        });
      } catch (redisErr) {
        console.warn('[Review API] Redis cache invalidation warning:', redisErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Thank you for your rating! Feedback submitted successfully.',
        data: {
          id: review._id,
          rating: review.rating,
          comment: review.comment,
          tripAverageRating: avgRating,
          tripTotalReviews: totalReviews,
          createdAt: review.createdAt
        }
      });

    } catch (dbErr: any) {
      console.error('[Review API DB Error]:', dbErr);
      throw dbErr;
    }

  } catch (err: any) {
    console.error('[Review API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error submitting review.' },
      { status: 500 }
    );
  }
}
