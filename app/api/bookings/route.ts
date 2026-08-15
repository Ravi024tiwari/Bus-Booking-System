import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import dbConnect from '@/lib/db';
import { Trip, SeatState, Order } from '@/models';

// Initialize Razorpay client only if keys are present in env
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret && !keyId.includes('YOUR_KEY_ID')) {
    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }
  return null;
};

export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Authenticate user from secure Cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to create a booking.' },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session.' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // 2. Parse request payload
    const { tripId, seatNumbers, passengerDetails } = await req.json();

    if (!tripId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Trip ID and list of seat numbers are required.' },
        { status: 400 }
      );
    }

    // 3. Retrieve trip details and calculate price
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json(
        { success: false, message: 'Selected trip does not exist.' },
        { status: 404 }
      );
    }

    const totalAmount = trip.fare * seatNumbers.length;

    // 4. Validate that all requested seats are currently held by THIS user
    const now = new Date();
    for (const seatNo of seatNumbers) {
      const heldState = await SeatState.findOne({
        tripId,
        seatNumber: seatNo,
        status: 'HELD',
        heldBy: userId,
        heldUntil: { $gt: now }
      });

      if (!heldState) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Seat ${seatNo} is no longer locked by you. It may have expired. Please lock it again.` 
          },
          { status: 400 }
        );
      }
    }

    // 5. Create local order record in MONGODB
    const localOrder = await Order.create({
      passengerId: userId,
      tripId,
      seatNumbers,
      amount: totalAmount,
      status: 'PENDING'
    });

    // 6. Initialize payment gateway transaction
    const razorpay = getRazorpayInstance();
    let razorpayOrderId = `rp_mock_order_${localOrder._id}`;

    if (razorpay) {
      try {
        const rpOrder = await razorpay.orders.create({
          amount: Math.round(totalAmount * 100), // convert to paise
          currency: 'INR',
          receipt: localOrder._id.toString()
        });
        razorpayOrderId = rpOrder.id;
      } catch (rpErr: any) {
        console.error('[Razorpay Order Creation Failed]', rpErr);
        // Clean up created pending order on gateway failures
        await Order.deleteOne({ _id: localOrder._id });
        return NextResponse.json(
          { success: false, message: 'Failed to initialize payment gateway order.' },
          { status: 500 }
        );
      }
    } else {
      console.log('[Booking API] Razorpay keys not set or set to defaults. Falling back to Developer Mock Payments.');
    }

    // 7. Update booking details with Razorpay Order ID
    localOrder.razorpayOrderId = razorpayOrderId;
    localOrder.status = 'PAYMENT_PENDING';
    await localOrder.save();

    return NextResponse.json({
      success: true,
      data: {
        bookingId: localOrder._id,
        tripId: trip._id,
        seatNumbers: localOrder.seatNumbers,
        amount: localOrder.amount,
        status: localOrder.status,
        razorpayOrderId: localOrder.razorpayOrderId,
        passengerName: decoded.name,
        passengerEmail: decoded.email
      }
    });

  } catch (err: any) {
    console.error('[Bookings API] Fatal booking generation error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error while processing booking request.' },
      { status: 500 }
    );
  }
}
