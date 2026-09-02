import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { User, Bus, Review, Trip, Order } from '@/models';
import ReviewsClient from './reviews-client';

export const dynamic = 'force-dynamic';

export default async function OperatorReviewsPage() {
  let initialReviews: any[] = [];
  let initialStats = {
    totalReviews: 0,
    averageRating: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
    positivePercentage: 0
  };
  let operatorBuses: { id: string; busNumber: string; type: string }[] = [];

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      redirect('/login');
    }

    const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
    const decoded: any = jwt.verify(token, jwtSecret);

    if (decoded && decoded.id) {
      await dbConnect();
      const user = await User.findById(decoded.id);

      if (!user || user.role !== 'operator') {
        redirect('/login');
      }

      // 1. Fetch operator's buses
      const buses = await Bus.find({ operatorId: user._id }).select('_id busNumber type images').lean();
      operatorBuses = buses.map((b: any) => ({
        id: b._id.toString(),
        busNumber: b.busNumber,
        type: b.type
      }));

      const busIds = buses.map((b: any) => b._id);

      if (busIds.length > 0) {
        // 2. Fetch all reviews for these buses
        const reviews = await Review.find({ busId: { $in: busIds } })
          .sort({ createdAt: -1 })
          .populate({
            path: 'passengerId',
            select: 'name email profileImage avatar createdAt'
          })
          .populate({
            path: 'tripId',
            select: 'source destination date departureTime arrivalTime fare busNumber busType status'
          })
          .populate({
            path: 'busId',
            select: 'busNumber type images'
          })
          .populate({
            path: 'bookingId',
            select: 'seatNumbers amount'
          })
          .lean();

        let ratingSum = 0;
        const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        initialReviews = reviews.map((r: any) => {
          const passenger = r.passengerId;
          const trip = r.tripId;
          const bus = r.busId;
          const booking = r.bookingId;
          const rating = Math.min(5, Math.max(1, Math.round(r.rating || 5)));

          ratingSum += r.rating || 0;
          if (ratingCounts[rating] !== undefined) {
            ratingCounts[rating] += 1;
          }

          const passengerAvatar = passenger?.profileImage || passenger?.avatar || '/images/rohit-avatar.jpg';

          return {
            id: r._id.toString(),
            rating: r.rating,
            comment: r.comment || '',
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            passenger: {
              id: passenger?._id?.toString() || '',
              name: passenger?.name || 'Verified Passenger',
              email: passenger?.email || '',
              avatar: passengerAvatar
            },
            trip: trip ? {
              id: trip._id.toString(),
              source: trip.source,
              destination: trip.destination,
              date: trip.date,
              departureTime: trip.departureTime,
              arrivalTime: trip.arrivalTime,
              fare: trip.fare,
              busNumber: trip.busNumber,
              busType: trip.busType,
              status: trip.status
            } : null,
            bus: bus ? {
              id: bus._id.toString(),
              busNumber: bus.busNumber,
              type: bus.type,
              image: bus.images?.[0] || '/images/volvo.png'
            } : null,
            booking: booking ? {
              seatNumbers: booking.seatNumbers || [],
              amount: booking.amount || 0
            } : null
          };
        });

        const totalReviews = initialReviews.length;
        const averageRating = totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0;
        const positiveCount = (ratingCounts[5] || 0) + (ratingCounts[4] || 0);
        const positivePercentage = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0;

        initialStats = {
          totalReviews,
          averageRating,
          ratingCounts,
          positivePercentage
        };
      }
    } else {
      redirect('/login');
    }
  } catch (err) {
    console.error('[Operator Reviews Server Page] Error:', err);
    redirect('/login');
  }

  return (
    <ReviewsClient 
      initialReviews={initialReviews}
      initialStats={initialStats}
      buses={operatorBuses}
    />
  );
}
