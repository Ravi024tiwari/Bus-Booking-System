import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Bus, Review, Trip, User, Order } from '@/models';
import { verifyAuth } from '@/lib/auth-proxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/operator/reviews - Fetch all customer reviews for the logged-in operator's buses/trips.
 */
export async function GET(req: Request) {
  try {
    await dbConnect();

    // 1. Authenticate operator
    const { user, errorResponse } = await verifyAuth(['operator', 'admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    // 2. Query all buses owned by this operator
    const operatorBuses = await Bus.find({ operatorId: user.id }).select('_id busNumber type images').lean();
    const busIds = operatorBuses.map((b: any) => b._id);

    if (busIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          reviews: [],
          stats: {
            totalReviews: 0,
            averageRating: 0,
            ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            positivePercentage: 0
          }
        }
      });
    }

    // 3. Query all reviews for this operator's buses with full populated data
    const reviews = await Review.find({ busId: { $in: busIds } })
      .sort({ createdAt: -1 })
      .populate({
        path: 'passengerId',
        select: 'name email profileImage avatar createdAt'
      })
      .populate({
        path: 'tripId',
        select: 'source destination date departureTime arrivalTime fare busNumber busType status'
      })
      .populate({
        path: 'busId',
        select: 'busNumber type images'
      })
      .populate({
        path: 'bookingId',
        select: 'seatNumbers amount'
      })
      .lean();

    // 4. Calculate aggregate statistics
    const totalReviews = reviews.length;
    let ratingSum = 0;
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;

    const formattedReviews = reviews.map((r: any) => {
      const passenger = r.passengerId;
      const trip = r.tripId;
      const bus = r.busId;
      const booking = r.bookingId;
      const rating = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      
      ratingSum += r.rating || 0;
      if (ratingCounts[rating] !== undefined) {
        ratingCounts[rating] += 1;
      }

      const passengerAvatar = passenger?.profileImage || passenger?.avatar || '/images/rohit-avatar.jpg';

      return {
        id: r._id.toString(),
        rating: r.rating,
        comment: r.comment || '',
        createdAt: r.createdAt,
        passenger: {
          id: passenger?._id?.toString() || '',
          name: passenger?.name || 'Verified Passenger',
          email: passenger?.email || '',
          avatar: passengerAvatar
        },
        trip: trip ? {
          id: trip._id.toString(),
          source: trip.source,
          destination: trip.destination,
          date: trip.date,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          fare: trip.fare,
          busNumber: trip.busNumber,
          busType: trip.busType,
          status: trip.status
        } : null,
        bus: bus ? {
          id: bus._id.toString(),
          busNumber: bus.busNumber,
          type: bus.type,
          image: bus.images?.[0] || '/images/volvo.png'
        } : null,
        booking: booking ? {
          seatNumbers: booking.seatNumbers || [],
          amount: booking.amount || 0
        } : null
      };
    });

    const averageRating = totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0;
    const positiveCount = (ratingCounts[5] || 0) + (ratingCounts[4] || 0);
    const positivePercentage = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        reviews: formattedReviews,
        stats: {
          totalReviews,
          averageRating,
          ratingCounts,
          positivePercentage
        }
      }
    });
  } catch (error: any) {
    console.error('[Operator Reviews GET API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch operator reviews.' },
      { status: 500 }
    );
  }
}
