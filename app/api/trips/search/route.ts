import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Trip, SeatState, Route } from '@/models';
import { tripSearchSchema } from '@/lib/validations';
import { reconcileStaleTrips } from '@/lib/reconcile-trips';

export async function GET(req: Request) {
  try {
    await dbConnect();
    await reconcileStaleTrips();
    const { searchParams } = new URL(req.url);
   

    const rawParams = {
      source: searchParams.get('source') || undefined,
      destination: searchParams.get('destination') || undefined,
      busNumber: searchParams.get('busNumber') || undefined,
      date: searchParams.get('date') || undefined,
      type: searchParams.get('type') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      timeRange: searchParams.get('timeRange') || undefined,
      departAfter: searchParams.get('departAfter') || undefined,
    };

    const result = tripSearchSchema.safeParse(rawParams);
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || 'Invalid search parameters';
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }

    const { 
      source, 
      destination, 
      busNumber, 
      date, 
      type: busTypeFilter, 
      minPrice, 
      maxPrice, 
      sortBy,
      timeRange,
      departAfter 
    } = result.data;

    // 1. Resolve matching route sequences for segment query
    const matchedRoutesMap = new Map<string, { fromSeq: number; toSeq: number; fromStopName: string; toStopName: string }>();

    if (source && destination) {
      const routes = await Route.find({
        stops: {
          $all: [
            { $elemMatch: { stopName: { $regex: new RegExp(`^${source.trim()}$`, 'i') } } },
            { $elemMatch: { stopName: { $regex: new RegExp(`^${destination.trim()}$`, 'i') } } }
          ]
        }
      });

      for (const r of routes) {
        const boardingStop = r.stops.find((s: any) => s.stopName.toLowerCase() === source.toLowerCase().trim());
        const droppingStop = r.stops.find((s: any) => s.stopName.toLowerCase() === destination.toLowerCase().trim());

        if (boardingStop && droppingStop && boardingStop.sequence < droppingStop.sequence) {
          matchedRoutesMap.set(r._id.toString(), {
            fromSeq: boardingStop.sequence,
            toSeq: droppingStop.sequence,
            fromStopName: boardingStop.stopName,
            toStopName: droppingStop.stopName
          });
        }
      }

      // If source/destination provided but no matching route exists, return empty results early
      if (matchedRoutesMap.size === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
    }

    // 2. Build Mongo Trip Query Filters matching the timezone-safe date string
    const tripQuery: any = {
      date: date
    };

    if (busTypeFilter) {
      tripQuery.busType = busTypeFilter;
    }

    if (busNumber) {
      tripQuery.busNumber = { $regex: new RegExp(`^${busNumber.trim()}$`, 'i') };
    } else {
      tripQuery.routeId = { $in: Array.from(matchedRoutesMap.keys()) };
    }

    // 3. Fetch Matching Trips
    const trips = await Trip.find(tripQuery)
      .populate({
        path: 'busId',
        populate: {
          path: 'operatorId',
          select: 'name'
        }
      })
      .populate('routeId');

    // 4. Filter by departure time range or exact hour-minute threshold
    let filteredTrips = trips;
    if (departAfter || timeRange) {
      filteredTrips = trips.filter((trip: any) => {
        const depTime = new Date(trip.departureTime);
        const hours = depTime.getHours();
        const minutes = depTime.getMinutes();
        const totalMinutes = hours * 60 + minutes;

        if (departAfter) {
          const [afterHours, afterMinutes] = departAfter.split(':').map(Number);
          const limitMinutes = afterHours * 60 + afterMinutes;
          if (totalMinutes < limitMinutes) return false;
        }

        if (timeRange) {
          // morning: 06:00 - 11:59 (360 - 719)
          // afternoon: 12:00 - 17:59 (720 - 1079)
          // evening: 18:00 - 22:59 (1080 - 1379)
          // night: 23:00 - 05:59 (1380 - 1439 or 0 - 359)
          if (timeRange === 'morning') {
            return totalMinutes >= 360 && totalMinutes < 720;
          } else if (timeRange === 'afternoon') {
            return totalMinutes >= 720 && totalMinutes < 1080;
          } else if (timeRange === 'evening') {
            return totalMinutes >= 1080 && totalMinutes < 1380;
          } else if (timeRange === 'night') {
            return totalMinutes >= 1380 || totalMinutes < 360;
          }
        }

        return true;
      });
    }

    // 5. Augment results with Segment pricing & segment availability calculations
    const now = new Date();
    let results = await Promise.all(
      filteredTrips.map(async (trip: any) => {
        const bus = trip.busId;
        const totalSeats = bus ? bus.capacity : 40;
        const route = trip.routeId;

        if (!route || !route.stops) {
          return null;
        }

        // Determine boarding and dropping sequence limits
        let fromSeq = 1;
        let toSeq = route.stops.length;
        let fromStopName = trip.source;
        let toStopName = trip.destination;

        const matchedRoute = matchedRoutesMap.get(route._id.toString());
        if (matchedRoute) {
          fromSeq = matchedRoute.fromSeq;
          toSeq = matchedRoute.toSeq;
          fromStopName = matchedRoute.fromStopName;
          toStopName = matchedRoute.toStopName;
        } else if (source && destination) {
          // If searching by bus number but also provided source/destination stop bounds
          const boardingStop = route.stops.find((s: any) => s.stopName.toLowerCase() === source.toLowerCase().trim());
          const droppingStop = route.stops.find((s: any) => s.stopName.toLowerCase() === destination.toLowerCase().trim());
          if (boardingStop && droppingStop && boardingStop.sequence < droppingStop.sequence) {
            fromSeq = boardingStop.sequence;
            toSeq = droppingStop.sequence;
            fromStopName = boardingStop.stopName;
            toStopName = droppingStop.stopName;
          }
        }

        // Calculate dynamic segment fare based on sequence stops
        let segmentFare = 0;
        route.stops.forEach((stop: any) => {
          if (stop.sequence > fromSeq && stop.sequence <= toSeq) {
            segmentFare += stop.fareFromPreviousStop;
          }
        });

        // Fallback to base trip fare if segment stops yield zero (e.g. stops are not configured with fare segments)
        if (segmentFare === 0) {
          segmentFare = trip.fare;
        }

        // Apply price filters early to optimize mapping performance
        if (minPrice !== undefined && segmentFare < minPrice) return null;
        if (maxPrice !== undefined && segmentFare > maxPrice) return null;

        // Calculate occupied seats overlapping this sequence segment
        const occupiedSeats = await SeatState.countDocuments({
          tripId: trip._id,
          $or: [
            { status: 'BOOKED' },
            { status: 'HELD', heldUntil: { $gt: now } }
          ],
          fromSequence: { $lt: toSeq },
          toSequence: { $gt: fromSeq }
        });

        const availableSeats = Math.max(0, totalSeats - occupiedSeats);

        return {
          id: trip._id,
          busId: bus?._id,
          operatorName: bus?.operatorId?.name || 'Royal Travels',
          busNumber: trip.busNumber,
          busType: trip.busType,
          source: fromStopName,
          destination: toStopName,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          fare: segmentFare,
          totalSeats,
          availableSeats,
          offerPercentage: trip.offerPercentage || 0,
          offerLimit: trip.offerLimit || 0,
          offerBookedCount: trip.offerBookedCount || 0,
          rating: 4.5,
          amenities: bus?.amenities || ['WiFi', 'Charging Point', 'Water Bottle', 'Blanket']
        };
      })
    );

    // Filter out null values resulting from pricing limits or missing routes
    results = results.filter(Boolean);

    // 6. Sort results
    if (sortBy === 'priceAsc') {
      results.sort((a: any, b: any) => a.fare - b.fare);
    } else if (sortBy === 'priceDesc') {
      results.sort((a: any, b: any) => b.fare - a.fare);
    } else {
      results.sort((a: any, b: any) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
    }

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (err: any) {
    console.error('[Search API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error executing search.' },
      { status: 500 }
    );
  }
}
