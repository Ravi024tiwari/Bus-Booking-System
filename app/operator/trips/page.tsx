import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { User, Trip, Bus, Route, SeatState } from '@/models';
import TripsClient from './trips-client';

export const dynamic = 'force-dynamic';

export default async function OperatorTripsPage() {
  let initialTrips: any[] = [];
  let initialBuses: any[] = [];
  let initialRoutes: any[] = [];

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
      initialBuses = buses.map(bus => ({
        id: bus._id.toString(),
        busNumber: bus.busNumber,
        type: bus.type,
        capacity: bus.capacity,
        rows: bus.rows || 10,
        cols: bus.cols || 4,
        sleeperSeats: bus.sleeperSeats || [],
        amenities: bus.amenities || []
      }));

      const busIds = buses.map(b => b._id);

      // 2. Fetch global routes template configurations
      const routes = await Route.find().sort({ source: 1 });
      initialRoutes = routes.map(route => ({
        id: route._id.toString(),
        source: route.source,
        destination: route.destination,
        stops: route.stops.map((stop: any) => ({
          stopName: stop.stopName,
          arrivalOffsetMinutes: stop.arrivalOffsetMinutes,
          departureOffsetMinutes: stop.departureOffsetMinutes,
          sequence: stop.sequence,
          fareFromPreviousStop: stop.fareFromPreviousStop
        })),
        totalDistance: route.totalDistance || 0,
        description: route.description || ''
      }));

      // 3. Fetch operator's trips
      const trips = await Trip.find({ busId: { $in: busIds } })
        .populate({
          path: 'busId',
          select: 'busNumber type capacity'
        })
        .populate('routeId')
        .sort({ departureTime: -1 });

      const now = new Date();
      initialTrips = await Promise.all(trips.map(async (trip) => {
        const busObj = trip.busId as any;
        const routeObj = trip.routeId as any;

        // Calculate actual occupied/held seats count
        const bookedSeatsCount = await SeatState.countDocuments({
          tripId: trip._id,
          $or: [
            { status: 'BOOKED' },
            { status: 'HELD', heldUntil: { $gt: now } }
          ]
        });

        // Parse list of intermediate stops
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
          offerPercentage: trip.offerPercentage || 0,
          offerLimit: trip.offerLimit || 0,
          offerBookedCount: trip.offerBookedCount || 0,
          status: trip.status || 'SCHEDULED',
          createdAt: trip.createdAt.toISOString(),
          busCapacity: busObj ? busObj.capacity : 40,
          bookedSeatsCount,
          viaStops
        };
      }));
    } else {
      redirect('/login');
    }
  } catch (err) {
    console.error('[Operator Trips Server Page] Failure:', err);
    redirect('/login');
  }

  return (
    <TripsClient 
      initialTrips={initialTrips} 
      buses={initialBuses} 
      routes={initialRoutes} 
    />
  );
}
