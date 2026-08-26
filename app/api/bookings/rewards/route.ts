import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { Order } from '@/models';

export async function GET(req: Request) {
  try {
    await dbConnect();

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

    // 2. Fetch Passenger bookings that received discounts (where discountAmount > 0)
    // Only count CONFIRMED bookings as successfully claimed rewards
    const discountedBookings = await Order.find({ 
      passengerId: userId, 
      discountAmount: { $gt: 0 },
      status: 'CONFIRMED'
    })
    .sort({ createdAt: -1 })
    .populate({
      path: 'tripId',
      populate: {
        path: 'busId',
        select: 'busNumber type operatorId'
      }
    });

    // 3. Compute aggregate stats
    const totalSavings = discountedBookings.reduce((sum, booking) => sum + (booking.discountAmount || 0), 0);
    const claimedCount = discountedBookings.length;

    // 4. Format bookings for Redux consumption
    const formattedRewardsList = discountedBookings.map((booking: any) => {
      const trip = booking.tripId;
      const bus = trip?.busId;
      
      const formattedDate = trip ? new Date(trip.departureTime).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      }) : '';
      
      const formattedTime = trip ? new Date(trip.departureTime).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit'
      }) : '';

      return {
        id: booking._id,
        seatNumbers: booking.seatNumbers,
        amount: booking.amount,
        discountAmount: booking.discountAmount || 0,
        discountedSeatsCount: booking.discountedSeatsCount || 0,
        status: booking.status,
        createdAt: booking.createdAt,
        razorpayOrderId: booking.razorpayOrderId || null,
        razorpayPaymentId: booking.razorpayPaymentId || null,
        fromStop: booking.fromStop,
        toStop: booking.toStop,
        
        source: trip?.source || booking.fromStop,
        destination: trip?.destination || booking.toStop,
        date: formattedDate,
        time: formattedTime,
        seat: booking.seatNumbers.join(', '),
        busType: bus?.type || trip?.busType || 'AC Sleeper',
        fare: booking.amount,
        pnr: booking.razorpayOrderId || booking._id.toString().substring(0, 10).toUpperCase(),
        
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
      data: {
        rewardsList: formattedRewardsList,
        totalSavings,
        claimedCount
      }
    });

  } catch (err: any) {
    console.error('[Rewards API] Fatal error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching rewards.' },
      { status: 500 }
    );
  }
}
