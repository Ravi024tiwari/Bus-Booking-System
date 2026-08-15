import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import { Order } from '@/models';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: 'Local bookingId is required for payment simulation.' },
        { status: 400 }
      );
    }

    // 1. Find local order
    const order = await Order.findById(bookingId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Local booking order not found.' },
        { status: 404 }
      );
    }

    if (order.status === 'CONFIRMED') {
      return NextResponse.json(
        { success: false, message: 'Booking is already paid and confirmed.' },
        { status: 400 }
      );
    }

    // 2. Prepare Mock Razorpay Webhook Payload
    const mockEventId = `evt_mock_${Date.now()}`;
    const mockPaymentId = `pay_mock_${Date.now()}`;
    
    const mockPayload = {
      id: mockEventId,
      entity: 'event',
      account_id: 'acc_mock_user_123',
      event: 'payment.captured',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: mockPaymentId,
            entity: 'payment',
            amount: Math.round(order.amount * 100),
            currency: 'INR',
            status: 'captured',
            order_id: order.razorpayOrderId,
            invoice_id: null,
            international: false,
            method: 'card',
            amount_refunded: 0,
            refund_status: null,
            captured: true,
            description: `Payment for seat booking ${order._id}`,
            card_id: 'card_mock_id',
            bank: null,
            wallet: null,
            vpa: null,
            email: 'john@example.com',
            contact: '+919999999999',
            created_at: Math.floor(Date.now() / 1000)
          }
        }
      },
      created_at: Math.floor(Date.now() / 1000)
    };

    const rawBody = JSON.stringify(mockPayload);
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'my_local_webhook_secret_key';

    // 3. Compute expected signature
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    // 4. Dispatch loopback request to our own Webhook endpoint
    const port = process.env.PORT || '3000';
    const webhookUrl = `http://localhost:${port}/api/webhooks/razorpay`;

    console.log(`[Simulator] Dispatching local webhook trigger to: ${webhookUrl}`);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      body: rawBody
    });

    const responseData = await response.json();

    if (response.ok && responseData.success) {
      return NextResponse.json({
        success: true,
        message: 'Developer Payment simulation succeeded and verified.',
        mockPaymentId,
        localOrderDetails: {
          id: order._id,
          seats: order.seatNumbers,
          amount: order.amount,
          newStatus: 'CONFIRMED'
        }
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Simulation webhook payload was sent, but verification endpoint failed.', 
          errorDetails: responseData 
        },
        { status: 500 }
      );
    }

  } catch (err: any) {
    console.error('[Simulator] Fatal simulation execution error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error executing payment simulation.' },
      { status: 500 }
    );
  }
}
