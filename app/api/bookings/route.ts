import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import dbConnect from '@/lib/db';
import { Trip, SeatState, Order } from '@/models';
import { bookingSchema } from '@/lib/validations';


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

    const jwtSecret = process.env.JWT_SECRET!;
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

    // 2. Parse and validate request payload using Zod
    const body = await req.json();
    const result = bookingSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || 'Invalid booking data';
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }

    const { tripId, seatNumbers, passengerDetails, fromStop, toStop } = result.data;

    // 3. Retrieve trip details, populate route, and calculate price for the segment stops
    const trip = await Trip.findById(tripId).populate('routeId');
    if (!trip) {
      return NextResponse.json(
        { success: false, message: 'Selected trip does not exist.' },
        { status: 404 }
      );
    }

    const route = trip.routeId as any;
    if (!route || !route.stops) {
      return NextResponse.json(
        { success: false, message: 'Associated route stops not found.' },
        { status: 400 }
      );
    }

    const boardingStop = route.stops.find(
      (s: any) => s.stopName.toLowerCase() === fromStop.toLowerCase().trim()
    );
    const droppingStop = route.stops.find(
      (s: any) => s.stopName.toLowerCase() === toStop.toLowerCase().trim()
    );

    if (!boardingStop || !droppingStop) {
      return NextResponse.json(
        { success: false, message: 'Selected boarding or dropping point does not exist on this route.' },
        { status: 400 }
      );
    }

    const fromSequence = boardingStop.sequence;
    const toSequence = droppingStop.sequence;

    if (fromSequence >= toSequence) {
      return NextResponse.json(
        { success: false, message: 'Boarding stop must be located before the dropping stop.' },
        { status: 400 }
      );
    }

    // Dynamic segment pricing
    let segmentFare = 0;
    route.stops.forEach((stop: any) => {
      if (stop.sequence > fromSequence && stop.sequence <= toSequence) {
        segmentFare += stop.fareFromPreviousStop;
      }
    });

    if (segmentFare === 0) {
      segmentFare = trip.fare; // fallback to full trip fare
    }

    // Apply operator offer if present on the trip
    let discountedSeatsCount = 0;
    let discountAmount = 0;
    let totalAmount = segmentFare * seatNumbers.length;

    if (trip.offerPercentage && trip.offerPercentage > 0 && trip.offerLimit && trip.offerLimit > 0) {
      // Find how many discounted seats are already CONFIRMED or active PAYMENT_PENDING (within last 10 minutes)
      const activeDiscountedOrders = await Order.find({
        tripId: trip._id,
        status: { $in: ['CONFIRMED', 'PAYMENT_PENDING'] },
        $or: [
          { status: 'CONFIRMED' },
          { 
            status: 'PAYMENT_PENDING', 
            createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) } 
          }
        ]
      });

      const alreadyAllocated = activeDiscountedOrders.reduce(
        (sum: number, ord: any) => sum + (ord.discountedSeatsCount || 0), 
        0
      );
      const remainingOfferSeats = Math.max(0, trip.offerLimit - alreadyAllocated);

      if (remainingOfferSeats > 0) {
        discountedSeatsCount = Math.min(seatNumbers.length, remainingOfferSeats);
        const discountPerSeat = segmentFare * (trip.offerPercentage / 100);
        discountAmount = Math.round(discountPerSeat * discountedSeatsCount);
        totalAmount = (segmentFare * seatNumbers.length) - discountAmount;
      }
    }

    // 4. Validate that all requested seats are currently held by THIS user on this specific segment
    const now = new Date();
    for (const seatNo of seatNumbers) {
      const heldState = await SeatState.findOne({
        tripId,
        seatNumber: seatNo,
        status: 'HELD',
        heldBy: userId,
        heldUntil: { $gt: now },
        fromSequence,
        toSequence
      });

      if (!heldState) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Seat ${seatNo} is no longer locked by you for this journey segment. It may have expired. Please lock it again.` 
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
      discountAmount,
      discountedSeatsCount,
      status: 'PENDING',
      fromStop,
      toStop,
      fromSequence,
      toSequence
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
        discountAmount: localOrder.discountAmount,
        discountedSeatsCount: localOrder.discountedSeatsCount,
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
