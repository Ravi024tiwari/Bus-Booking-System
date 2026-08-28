import React from 'react';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import { Trip } from '@/models';
import TrackingClient from './tracking-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ tripId?: string }>;
}

export default async function TrackingPage({ searchParams }: PageProps) {
  const { tripId } = await searchParams;

  if (!tripId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-zinc-50 dark:bg-zinc-950 select-none">
        <span className="text-5xl mb-4">📍</span>
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">No Trip Selected</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">
          Please select a bus trip from your active bookings list to begin live tracking.
        </p>
        <a
          href="/customer/trips"
          className="mt-6 px-5 py-2.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition-all cursor-pointer"
        >
          View Booked Trips
        </a>
      </div>
    );
  }

  try {
    await dbConnect();
    
    // Fetch Trip details and populate bus and operator
    const trip = await Trip.findById(tripId)
      .populate({
        path: 'busId',
        populate: {
          path: 'operatorId',
          select: 'name email'
        }
      })
      .populate('routeId');

    if (!trip) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-zinc-50 dark:bg-zinc-950 select-none">
          <span className="text-5xl mb-4">⚠️</span>
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Trip Not Found</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">
            We couldn't retrieve the details for this trip. It may have expired or been deleted.
          </p>
          <a
            href="/customer/trips"
            className="mt-6 px-5 py-2.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition-all cursor-pointer"
          >
            Go Back
          </a>
        </div>
      );
    }

    const busObj = trip.busId as any;
    const routeObj = trip.routeId as any;

    const formattedTrip = {
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
      operatorName: busObj?.operatorId?.name || 'Royal Travels',
      viaStops: routeObj?.stops
        ? routeObj.stops.map((s: any) => ({
            stopName: s.stopName,
            arrivalOffsetMinutes: s.arrivalOffsetMinutes,
            departureOffsetMinutes: s.departureOffsetMinutes,
            sequence: s.sequence,
          }))
        : []
    };

    return <TrackingClient tripData={formattedTrip} />;
  } catch (err) {
    console.error('[Customer Tracking Server Page] Failure loading trip:', err);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-zinc-50 dark:bg-zinc-950 select-none">
        <span className="text-5xl mb-4">🚨</span>
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Server Error</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">
          Something went wrong while connecting to the live tracking server. Please try again.
        </p>
      </div>
    );
  }
}
