import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-proxy';
import dbConnect from '@/lib/db';
import { Trip, Order } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    // 1. Authenticate Admin
    const { user, errorResponse } = await verifyAuth(['admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { tripId } = await params;

    // 2. Fetch Trip details populated with bus and operator
    const trip = await Trip.findById(tripId)
      .populate({
        path: 'busId',
        populate: {
          path: 'operatorId',
          select: 'name email phoneNumber'
        }
      })
      .populate('routeId');

    if (!trip) {
      return NextResponse.json(
        { success: false, message: 'Trip not found.' },
        { status: 404 }
      );
    }

    // 3. Fetch passenger bookings manifest for this trip
    const bookings = await Order.find({ tripId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'passengerId',
        select: 'name email phoneNumber'
      });

    // 4. Compute occupancy and financial aggregates
    const bus = trip.busId as any;
    const capacity = bus?.capacity || 40;
    const confirmedOrders = bookings.filter((b: any) => b.status === 'CONFIRMED');
    const seatsBooked = confirmedOrders.reduce((sum: number, order: any) => sum + (order.seatNumbers?.length || 0), 0);
    const seatsAvailable = Math.max(capacity - seatsBooked, 0);
    const totalEarnings = confirmedOrders.reduce((sum: number, order: any) => sum + order.amount, 0);

    const formattedBookings = bookings.map((booking: any) => {
      const passenger = booking.passengerId;
      return {
        id: booking._id,
        seatNumbers: booking.seatNumbers,
        amount: booking.amount,
        status: booking.status,
        createdAt: booking.createdAt,
        razorpayOrderId: booking.razorpayOrderId || null,
        razorpayPaymentId: booking.razorpayPaymentId || null,
        fromStop: booking.fromStop,
        toStop: booking.toStop,
        passengerDetails: passenger ? {
          id: passenger._id,
          name: passenger.name,
          email: passenger.email,
          phoneNumber: passenger.phoneNumber || 'N/A'
        } : null
      };
    });

    const operator = bus?.operatorId;
    const formattedTrip = {
      id: trip._id,
      busNumber: trip.busNumber,
      busType: trip.busType,
      source: trip.source,
      destination: trip.destination,
      date: trip.date,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      fare: trip.fare,
      status: trip.status,
      capacity,
      seatsBooked,
      seatsAvailable,
      totalEarnings,
      operatorDetails: operator ? {
        id: operator._id,
        name: operator.name,
        email: operator.email,
        phoneNumber: operator.phoneNumber || 'N/A'
      } : null,
      busImages: bus?.images || [],
      routeStops: (trip.routeId as any)?.stops || []
    };

    return NextResponse.json({
      success: true,
      data: {
        trip: formattedTrip,
        bookings: formattedBookings
      }
    });

  } catch (err: any) {
    console.error('[Admin Trip Details API] Fatal error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error retrieving trip manifest.' },
      { status: 500 }
    );
  }
}
