import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { Order, Trip, Review } from '@/models';
import { reconcileStaleTrips } from '@/lib/reconcile-trips';

export async function GET(req: Request) {
  try {
    await dbConnect();
    await reconcileStaleTrips();

    // 1. Authenticate Passenger from Cookie
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

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'upcoming'; // 'today' | 'upcoming' | 'history'

    // We fetch all orders and reviews for the user
    const [orders, reviews] = await Promise.all([
      Order.find({ passengerId: userId })
        .populate({
          path: 'tripId',
          populate: {
            path: 'busId',
            select: 'busNumber type operatorId name'
          }
        }),
      Review.find({ passengerId: userId }).select('bookingId rating comment')
    ]);

    const reviewMap = new Map<string, number>();
    reviews.forEach((r: any) => {
      if (r.bookingId) {
        reviewMap.set(r.bookingId.toString(), r.rating);
      }
    });

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Format all bookings
    const allBookings = orders.map((order: any) => {
      const trip = order.tripId;
      const bus = trip?.busId;
      const orderIdStr = order._id.toString();

      return {
        id: order._id,
        seatNumbers: order.seatNumbers,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt,
        fromStop: order.fromStop,
        toStop: order.toStop,
        fromSequence: order.fromSequence,
        toSequence: order.toSequence,
        myRating: reviewMap.get(orderIdStr) || null,
        tripDetails: trip ? {
          id: trip._id,
          source: trip.source,
          destination: trip.destination,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          fare: trip.fare,
          status: trip.status,
          averageRating: trip.averageRating || 0,
          totalReviews: trip.totalReviews || 0,
          busNumber: bus?.busNumber || trip.busNumber,
          busType: bus?.type || trip.busType,
        } : null
      };
    });

    let filteredBookings: any[] = [];

    if (tab === 'today') {
      // Confirmed bookings where trip departs today
      filteredBookings = allBookings.filter((booking: any) => {
        if (booking.status !== 'CONFIRMED' || !booking.tripDetails) return false;
        const depTime = new Date(booking.tripDetails.departureTime);
        return depTime >= startOfToday && depTime <= endOfToday;
      });

      // Sort by departure time ascending (earliest today first)
      filteredBookings.sort((a: any, b: any) => 
        new Date(a.tripDetails.departureTime).getTime() - new Date(b.tripDetails.departureTime).getTime()
      );

    } else if (tab === 'upcoming') {
      // Confirmed bookings where trip departs in the future (after now)
      filteredBookings = allBookings.filter((booking: any) => {
        if (booking.status !== 'CONFIRMED' || !booking.tripDetails) return false;
        const depTime = new Date(booking.tripDetails.departureTime);
        return depTime > now;
      });

      // Sort by departure time ascending (closest upcoming first)
      filteredBookings.sort((a: any, b: any) => 
        new Date(a.tripDetails.departureTime).getTime() - new Date(b.tripDetails.departureTime).getTime()
      );

    } else if (tab === 'history') {
      // Bookings that are CANCELLED or CONFIRMED but trip departs in the past
      filteredBookings = allBookings.filter((booking: any) => {
        if (booking.status === 'CANCELLED') return true;
        if (booking.status !== 'CONFIRMED' || !booking.tripDetails) return false;
        const depTime = new Date(booking.tripDetails.departureTime);
        return depTime < now;
      });

      // Sort by departure time descending (most recent past trip first)
      filteredBookings.sort((a: any, b: any) => {
        const timeA = a.tripDetails ? new Date(a.tripDetails.departureTime).getTime() : new Date(a.createdAt).getTime();
        const timeB = b.tripDetails ? new Date(b.tripDetails.departureTime).getTime() : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
    }

    return NextResponse.json({
      success: true,
      tab,
      data: filteredBookings
    });

  } catch (err: any) {
    console.error('[My Trips API] Fatal error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching your trips.' },
      { status: 500 }
    );
  }
}
