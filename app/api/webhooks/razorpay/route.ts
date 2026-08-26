import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import redis from '@/lib/redis';
import releaseQueue from '@/lib/queue';
import { Order, SeatState, IdempotencyLog, Trip } from '@/models';

// Handles secure Razorpay webhook posts
export async function POST(req: Request) {
  try {
    await dbConnect();
    
    // 1. Verify Request Signature using HMAC-SHA256
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'Missing payment signature header.' },
        { status: 400 }
      );
    }

    const rawBody = await req.text();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'my_local_webhook_secret_key';

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('[Razorpay Webhook] Invalid signature check failed.');
      return NextResponse.json(
        { success: false, message: 'Invalid payment signature verification failed.' },
        { status: 400 }
      );
    }

    // 2. Parse Webhook Event details
    const payload = JSON.parse(rawBody);
    const eventId = payload.id;
    const eventType = payload.event;

    console.log(`[Razorpay Webhook] Verified event ${eventId} of type ${eventType}`);

    // We only process payment capture confirmation events
    if (eventType !== 'order.paid' && eventType !== 'payment.captured') {
      return NextResponse.json({ success: true, message: 'Event ignored.' });
    }

    // Check duplicate webhook deliveries (idempotency safety)
    const existingLog = await IdempotencyLog.findOne({ key: eventId });
    if (existingLog) {
      console.log(`[Razorpay Webhook] Webhook event ${eventId} was already processed. Skipping.`);
      return NextResponse.json({ success: true, message: 'Duplicate event ignored.' });
    }

    const paymentEntity = payload.payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    // 3. Retrieve local Booking record
    const order = await Order.findOne({ razorpayOrderId });
    if (!order) {
      console.error(`[Razorpay Webhook] Order matching Razorpay ID ${razorpayOrderId} not found.`);
      return NextResponse.json(
        { success: false, message: 'Associated local booking not found.' },
        { status: 404 }
      );
    }

    // If order is already paid, complete early
    if (order.status === 'CONFIRMED') {
      return NextResponse.json({ success: true, message: 'Booking already confirmed.' });
    }

    // 4. Log the webhook key in IdempotencyLogs to lock duplicate threads
    await IdempotencyLog.create({ key: eventId });

    // 5. Update booking and seat statuses atomically
    // Promote segment HELD states to BOOKED status in MongoDB
    await SeatState.updateMany(
      {
        tripId: order.tripId,
        seatNumber: { $in: order.seatNumbers },
        fromSequence: order.fromSequence,
        toSequence: order.toSequence
      },
      {
        $set: { status: 'BOOKED', bookedBy: order.passengerId, orderId: order._id },
        $unset: { heldBy: '', heldUntil: '' }
      }
    );

    // Cancel matching segment BullMQ release jobs
    for (const seatNo of order.seatNumbers) {
      const jobId = `release:${order.tripId}:${seatNo}:${order.fromSequence}:${order.toSequence}`;
      const job = await releaseQueue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    }

    // Update local Order record status
    order.status = 'CONFIRMED';
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    // Increment offerBookedCount if order has a discount applied
    if (order.discountedSeatsCount && order.discountedSeatsCount > 0) {
      await Trip.findByIdAndUpdate(order.tripId, {
        $inc: { offerBookedCount: order.discountedSeatsCount }
      });
      console.log(`[Razorpay Webhook] Incremented offerBookedCount by ${order.discountedSeatsCount} for Trip ${order.tripId}`);
    }

    console.log(`[Razorpay Webhook] Order ${order._id} confirmed for seats: ${order.seatNumbers}`);

    // 6. Broadcast socket event to turn seats RED on active client screens
    const io = (global as any).io;
    if (io) {
      io.to(order.tripId.toString()).emit('seat:booked', { seatNumbers: order.seatNumbers });
      console.log(`[Razorpay Webhook] Socket broadcasted seat:booked for seats: ${order.seatNumbers}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and booking confirmed successfully.'
    });

  } catch (err: any) {
    console.error('[Razorpay Webhook Callback Error]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing payment webhook.' },
      { status: 500 }
    );
  }
}
