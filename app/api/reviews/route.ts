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

    // 5. Create Review (handling unique constraint per bookingId)
    try {
      const review = await Review.create({
        passengerId: userId,
        busId,
        bookingId,
        rating,
        comment
      });

      // 6. Invalidate operator dashboard & bus details Redis caches
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
            keys.forEach((key) => pipeline.del(key));
            await pipeline.exec();
            console.log(`[Review API] Invalidated operator dashboard cache keys:`, keys);
          }
        });
      } catch (redisErr) {
        console.warn('[Review API] Redis cache invalidation warning:', redisErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Thank you for your feedback! Review submitted successfully.',
        data: {
          id: review._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt
        }
      });

    } catch (dbErr: any) {
      if (dbErr.code === 11000) {
        return NextResponse.json(
          { success: false, message: 'You have already submitted a review for this booking.' },
          { status: 409 }
        );
      }
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
