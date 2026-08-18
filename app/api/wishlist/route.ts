import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { Wishlist } from '@/models';
import { wishlistSchema } from '@/lib/validations';

/**
 * GET /api/wishlist - Retrieve all wishlist items for the logged-in passenger.
 */
export async function GET() {
  try {
    await dbConnect();

    // 1. Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET!;
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

    // 2. Fetch Wishlist entries and populate Trip details
    const wishlistItems = await Wishlist.find({ passengerId: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'tripId',
        populate: {
          path: 'busId',
          select: 'busNumber type operatorId'
        }
      });

    const formattedItems = wishlistItems.map((item: any) => {
      const trip = item.tripId;
      const bus = trip?.busId;

      return {
        id: item._id,
        createdAt: item.createdAt,
        tripDetails: trip ? {
          id: trip._id,
          source: trip.source,
          destination: trip.destination,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          fare: trip.fare,
          busNumber: bus?.busNumber || trip.busNumber,
          busType: bus?.type || trip.busType,
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedItems
    });

  } catch (err: any) {
    console.error('[Wishlist GET API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error loading wishlist.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wishlist - Save a trip to the passenger's wishlist.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET!;
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

    // 2. Parse & validate request body
    const body = await req.json();
    const validation = wishlistSchema.safeParse(body);

    if (!validation.success) {
      const errMsg = validation.error.issues[0]?.message || 'Invalid wishlist payload';
      return NextResponse.json(
        { success: false, message: errMsg },
        { status: 400 }
      );
    }

    const { tripId } = validation.data;

    // 3. Create wishlist entry (handling unique constraints gracefully)
    try {
      const item = await Wishlist.create({
        passengerId: userId,
        tripId
      });

      return NextResponse.json({
        success: true,
        message: 'Trip added to wishlist successfully.',
        data: {
          id: item._id,
          tripId: item.tripId,
          createdAt: item.createdAt
        }
      });
    } catch (dbErr: any) {
      if (dbErr.code === 11000) {
        return NextResponse.json(
          { success: false, message: 'This trip is already in your wishlist.' },
          { status: 409 }
        );
      }
      throw dbErr;
    }

  } catch (err: any) {
    console.error('[Wishlist POST API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error saving to wishlist.' },
      { status: 500 }
    );
  }
}
