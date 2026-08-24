import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { Trip, SeatState } from '@/models';
import BookTripsClient from './book-client';

export const dynamic = 'force-dynamic';

export default async function BookingTripsPage() {
  let initialTrips: any[] = [];
  let sources: string[] = [];
  let destinations: string[] = [];
  let operators: string[] = [];

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      redirect('/login');
    }

    const jwtSecret = process.env.JWT_SECRET!;
    const decoded: any = jwt.verify(token, jwtSecret);

    if (decoded && decoded.id) {
      await dbConnect();

      // Retrieve today's date in YYYY-MM-DD timezone-safe format
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      // Query trips for today and upcoming future dates
      const trips = await Trip.find({ 
        date: { $gte: todayStr },
        status: { $ne: 'CANCELLED' } 
      })
        .populate({
          path: 'busId',
          populate: {
            path: 'operatorId',
            select: 'name'
          }
        })
        .populate('routeId')
        .sort({ departureTime: 1 });

      const now = new Date();
      initialTrips = await Promise.all(trips.map(async (trip) => {
        const busObj = trip.busId as any;
        const routeObj = trip.routeId as any;

        // Calculate booked/held seats count
        const bookedSeatsCount = await SeatState.countDocuments({
          tripId: trip._id,
          $or: [
            { status: 'BOOKED' },
            { status: 'HELD', heldUntil: { $gt: now } }
          ]
        });

        // Resolve stops via details
        const viaStops = routeObj?.stops 
          ? routeObj.stops
              .slice(1, routeObj.stops.length - 1)
              .map((s: any) => s.stopName)
          : [];

        return {
          id: trip._id.toString(),
          busId: busObj ? busObj._id.toString() : '',
          routeId: routeObj ? routeObj._id.toString() : '',
          busNumber: trip.busNumber,
          busType: trip.busType,
          source: trip.source,
          destination: trip.destination,
          date: trip.date,
          departureTime: trip.departureTime.toISOString(),
          arrivalTime: trip.arrivalTime.toISOString(),
          fare: trip.fare,
          status: trip.status || 'SCHEDULED',
          busCapacity: busObj ? busObj.capacity : 40,
          bookedSeatsCount,
          viaStops,
          operatorName: busObj?.operatorId?.name || 'Royal Travels'
        };
      }));

      // Extract unique lists for filtering
      sources = Array.from(new Set(initialTrips.map(t => t.source))).sort();
      destinations = Array.from(new Set(initialTrips.map(t => t.destination))).sort();
      operators = Array.from(new Set(initialTrips.map(t => t.operatorName).filter(Boolean))).sort();
    } else {
      redirect('/login');
    }
  } catch (err) {
    console.error('[Customer Booking Trips Server Page] Error:', err);
    redirect('/login');
  }

  return (
    <BookTripsClient 
      initialTrips={initialTrips}
      sources={sources}
      destinations={destinations}
      operators={operators}
    />
  );
}
