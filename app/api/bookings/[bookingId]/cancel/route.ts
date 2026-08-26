import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import redis from '@/lib/redis';
import releaseQueue from '@/lib/queue';
import { Order, SeatState, Trip } from '@/models';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    await dbConnect();
    const { bookingId } = await params;

    // 1. Authenticate Passenger
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
        { success: false, message: 'Invalid session token.' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // 2. Fetch Order
    const order = await Order.findById(bookingId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Booking not found.' },
        { status: 404 }
      );
    }

    // Ensure the booking belongs to this user (unless admin)
    if (order.passengerId.toString() !== userId && decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to cancel this booking.' },
        { status: 403 }
      );
    }

    // Allow cancelling if it is CONFIRMED or PAYMENT_PENDING
    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, message: 'Booking is already cancelled.' },
        { status: 400 }
      );
    }

    // 3. Clear Seat Bookings & Locks in Database
    // Release specific segments in MongoDB SeatState
    await SeatState.deleteMany({
      tripId: order.tripId,
      seatNumber: { $in: order.seatNumbers },
      fromSequence: order.fromSequence,
      toSequence: order.toSequence
    });

    // Cancel matching segment BullMQ release jobs
    for (const seatNo of order.seatNumbers) {
      const jobId = `release:${order.tripId}:${seatNo}:${order.fromSequence}:${order.toSequence}`;
      const job = await releaseQueue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    }

    // 4. Update local order status to CANCELLED
    const oldStatus = order.status;
    order.status = 'CANCELLED';
    await order.save();

    // If order was CONFIRMED and had a discount applied, decrement offerBookedCount on Trip
    if (oldStatus === 'CONFIRMED' && order.discountedSeatsCount && order.discountedSeatsCount > 0) {
      await Trip.findByIdAndUpdate(order.tripId, {
        $inc: { offerBookedCount: -order.discountedSeatsCount }
      });
      console.log(`[Cancel Booking] Decremented offerBookedCount by ${order.discountedSeatsCount} for Trip ${order.tripId}`);
    }

    // 5. Broadcast Socket.io state changes (so seats turn green for other active users)
    const io = (global as any).io;
    if (io) {
      order.seatNumbers.forEach((seatNo) => {
        io.to(order.tripId.toString()).emit('seat:released', { seatNo });
      });
      console.log(`[Cancel Booking] Broadcasted releases for seats: ${order.seatNumbers}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully. Seats are now available.',
      data: {
        bookingId: order._id,
        status: order.status
      }
    });

  } catch (err: any) {
    console.error('[Cancel Booking API] Fatal cancellation error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing cancellation.' },
      { status: 500 }
    );
  }
}
