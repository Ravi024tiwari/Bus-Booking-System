import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { User, Trip, Bus, Route } from '@/models';
import OperatorTrackingClient from './tracking-client';

export const dynamic = 'force-dynamic';

export default async function OperatorLiveTrackingPage() {
  let activeTrips: any[] = [];

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

      // 1. Fetch operator's registered buses
      const buses = await Bus.find({ operatorId: user._id });
      const busIds = buses.map(b => b._id);

      // 2. Fetch active trips (boarding, departed, in_transit)
      const trips = await Trip.find({
        busId: { $in: busIds },
        status: { $in: ['BOARDING', 'DEPARTED', 'IN_TRANSIT'] }
      })
        .populate({
          path: 'busId',
          select: 'busNumber type capacity'
        })
        .populate('routeId')
        .sort({ departureTime: 1 });

      activeTrips = trips.map(trip => {
        const busObj = trip.busId as any;
        const routeObj = trip.routeId as any;

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
          status: trip.status || 'BOARDING',
          createdAt: trip.createdAt.toISOString(),
          viaStops: routeObj?.stops
            ? routeObj.stops.slice(1, routeObj.stops.length - 1).map((s: any) => s.stopName)
            : []
        };
      });
    } else {
      redirect('/login');
    }
  } catch (err) {
    console.error('[Operator Live Tracking Server Page] Failure:', err);
    redirect('/login');
  }

  return (
    <OperatorTrackingClient initialActiveTrips={activeTrips} />
  );
}
