import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { Trip, Bus, Route } from '@/models';
import TripDetailsClient from './trip-details-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ tripId: string }>;
}

export default async function TripDetailPage({ params }: PageProps) {
  const { tripId } = await params;

  let tripDetails: any = null;

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

      // Fetch dynamic Trip details populated with Bus -> Operator
      const trip = await Trip.findById(tripId)
        .populate({
          path: 'busId',
          populate: {
            path: 'operatorId',
            select: 'name email phoneNumber'
          }
        })
        .populate('routeId');

      if (!trip) {
        redirect('/customer/dashboard/book');
      }

      const bus = trip.busId as any;
      const route = trip.routeId as any;

      if (!route) {
        redirect('/customer/dashboard/book');
      }

      // Format Stop Details
      const stopsTimeline = route.stops.map((stop: any) => {
        
        const stopTime = new Date(trip.departureTime.getTime() + stop.arrivalOffsetMinutes * 60 * 1000);
        return {
          stopName: stop.stopName,
          sequence: stop.sequence,
          arrivalTime: stopTime.toISOString(),
          offsetMinutes: stop.arrivalOffsetMinutes,
          fareFromPrev: stop.fareFromPreviousStop
        };
      });

      // Cancellation policy configuration
      const cancellationPolicy = [
        { timeFrame: 'Before 24 hours of departure', refundPercentage: '90%' },
        { timeFrame: 'Between 12 to 24 hours of departure', refundPercentage: '50%' },
        { timeFrame: 'Less than 12 hours of departure', refundPercentage: '0% (No Refund)' }
      ];

      // Amenities mapping
      const amenities = bus?.amenities && bus.amenities.length > 0
        ? bus.amenities
        : (bus?.type?.includes('AC')
          ? ['WiFi', 'Charging Port', 'AC', 'Water Bottle', 'Blanket', 'Emergency Support']
          : ['Charging Port', 'Water Bottle', 'Emergency Support']);

      tripDetails = {
        id: trip._id.toString(),
        busId: bus ? bus._id.toString() : '',
        routeId: route ? route._id.toString() : '',
        busNumber: trip.busNumber,
        busType: trip.busType,
        source: trip.source,
        destination: trip.destination,
        date: trip.date,
        departureTime: trip.departureTime.toISOString(),
        arrivalTime: trip.arrivalTime.toISOString(),
        fare: trip.fare,
        status: trip.status || 'SCHEDULED',
        busCapacity: bus ? bus.capacity : 40,
        operatorName: bus?.operatorId?.name || 'Royal Travels',
        operatorPhone: bus?.operatorId?.phoneNumber || '+91 99999 99999',
        operatorEmail: bus?.operatorId?.email || 'support@royaltravels.com',
        stops: stopsTimeline,
        amenities,
        cancellationPolicy
      };

    } else {
      redirect('/login');
    }
  } catch (err) {
    console.error('[Customer Trip Details Server Page] Error:', err);
    redirect('/customer/dashboard/book');
  }

  return (
    <TripDetailsClient tripDetails={tripDetails} />
  );
}
