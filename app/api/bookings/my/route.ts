import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { Order } from '@/models';

export async function GET() {
  try {
    await dbConnect();

    // 1. Authenticate Passenger from secure Cookie
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
        { success: false, message: 'Invalid session token.' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // 2. Fetch Passenger bookings and populate Trip info
    const bookings = await Order.find({ passengerId: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'tripId',
        populate: {
          path: 'busId',
          select: 'busNumber type operatorId'
        }
      });

    const formattedBookings = bookings.map((booking: any) => {
      const trip = booking.tripId;
      const bus = trip?.busId;
      
      return {
        id: booking._id,
        seatNumbers: booking.seatNumbers,
        amount: booking.amount,
        status: booking.status,
        createdAt: booking.createdAt,
        razorpayPaymentId: booking.razorpayPaymentId || null,
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
      data: formattedBookings
    });

  } catch (err: any) {
    console.error('[My Bookings API] Fatal error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching your bookings.' },
      { status: 500 }
    );
  }
}
