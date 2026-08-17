import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import redis from '@/lib/redis';
import { Bus, Trip, Route } from '@/models';
import { busSchema } from '@/lib/validations';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { verifyAuth } from '@/lib/auth-proxy';

/**
 * Optimizes Cloudinary URLs to use automatic format and quality compression.
 */
function optimizeImageUrl(url: string): string {
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/q_auto,f_auto/');
  }
  return url;
}

/**
 * POST /api/buses - Create a new bus.
 * Permitted roles: operator, admin
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Authenticate approved operator or admin
    const { user, errorResponse } = await verifyAuth(['operator', 'admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const operatorId = user.id;

    // 2. Parse request payload as FormData (handles multi-file uploads)
    const formData = await req.formData();
    const busNumber = formData.get('busNumber')?.toString() || undefined;
    const type = formData.get('type')?.toString() || undefined;
    const capacity = formData.get('capacity')?.toString() || undefined;
    const rows = formData.get('rows')?.toString() || undefined;
    const cols = formData.get('cols')?.toString() || undefined;
    const sleeperSeats = formData.get('sleeperSeats')?.toString() || undefined;
    const amenities = formData.get('amenities')?.toString() || undefined;

    // Validate using Zod
    const validationResult = busSchema.safeParse({
      busNumber,
      type,
      capacity,
      rows,
      cols,
      sleeperSeats,
      amenities,
    });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || 'Invalid input data';
      return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }

    const {
      busNumber: validatedBusNumber,
      type: validatedType,
      capacity: validatedCapacity,
      rows: validatedRows,
      cols: validatedCols,
      sleeperSeats: validatedSleeperSeats = [],
      amenities: validatedAmenities = [],
    } = validationResult.data;

    // 3. Grid boundary validation: rows * cols must accommodate the capacity
    if (validatedRows * validatedCols < validatedCapacity) {
      return NextResponse.json(
        {
          success: false,
          message: `Grid layout dimensions (${validatedRows}x${validatedCols}) are too small to support the capacity of ${validatedCapacity} seats.`,
        },
        { status: 400 }
      );
    }

    // 4. Ensure Bus License Plate is unique
    const existingBus = await Bus.findOne({ busNumber: validatedBusNumber });
    if (existingBus) {
      return NextResponse.json(
        { success: false, message: `Bus with license plate number "${validatedBusNumber}" already exists.` },
        { status: 409 }
      );
    }

    // 5. Handle multi-file picture uploads to Cloudinary in parallel
    const uploadedImages: string[] = [];
    const files = formData.getAll('images') as File[];

    const uploadPromises = files
      .filter((file) => file.size > 0 && file.type.startsWith('image/'))
      .map(async (file) => {
        // Enforce 5MB limit per file
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds the maximum size limit of 5MB.`);
        }
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const secureUrl = await uploadToCloudinary(buffer, 'buses');
        return secureUrl;
      });

    try {
      const results = await Promise.all(uploadPromises);
      uploadedImages.push(...results);
    } catch (uploadErr: any) {
      console.error('[Create Bus] Image upload failed:', uploadErr);
      return NextResponse.json(
        { success: false, message: uploadErr.message || 'Failed to upload bus pictures.' },
        { status: 500 }
      );
    }

    // 6. Create Bus in database
    const newBus = await Bus.create({
      operatorId,
      busNumber: validatedBusNumber,
      type: validatedType,
      capacity: validatedCapacity,
      rows: validatedRows,
      cols: validatedCols,
      sleeperSeats: validatedSleeperSeats,
      amenities: validatedAmenities,
      images: uploadedImages,
    });

    // 7. Invalidate Redis Caching for Operator Buses list
    const cacheKey = `operator:buses:${operatorId}`;
    try {
      await redis.del(cacheKey);
      console.log(`[Create Bus] Cache invalidated for operator key: ${cacheKey}`);
    } catch (redisErr) {
      console.warn('[Create Bus] Redis cache invalidation error:', redisErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Bus registered successfully.',
        data: {
          id: newBus._id.toString(),
          busNumber: newBus.busNumber,
          type: newBus.type,
          capacity: newBus.capacity,
          rows: newBus.rows,
          cols: newBus.cols,
          sleeperSeats: newBus.sleeperSeats,
          amenities: newBus.amenities,
          images: newBus.images.map(optimizeImageUrl),
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[Create Bus API] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error registering new bus.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/buses - List operator's registered buses.
 * Permitted roles: operator, admin
 */
export async function GET(req: Request) {
  try {
    await dbConnect();

    // 1. Authenticate user
    const { user, errorResponse } = await verifyAuth(['operator', 'admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const operatorId = user.id;

    // 2. Parse query filters
    const { searchParams } = new URL(req.url);
    const traveling = searchParams.get('traveling') === 'true';
    const routeId = searchParams.get('routeId') || undefined;
    const source = searchParams.get('source') || undefined;
    const destination = searchParams.get('destination') || undefined;

    // 3. Resolve Cache Key
    const isFiltered = traveling || routeId || (source && destination);
    let cacheKey = `operator:buses:${operatorId}`;
    let cacheTTL = 3600; // 1 hour for default

    if (isFiltered) {
      const hashParts: string[] = [];
      if (traveling) hashParts.push('traveling');
      if (routeId) hashParts.push(`route:${routeId}`);
      if (source && destination) hashParts.push(`segment:${source}:${destination}`);
      cacheKey = `operator:buses:${operatorId}:filtered:${hashParts.join(':')}`;
      cacheTTL = 30; // 30 seconds for filtered
    }

    // 4. Fetch from Redis Cache
    try {
      const cachedBuses = await redis.get(cacheKey);
      if (cachedBuses) {
        console.log(`[List Buses API] Cache hit for key: ${cacheKey}`);
        return NextResponse.json({
          success: true,
          data: JSON.parse(cachedBuses),
        });
      }
    } catch (redisErr) {
      console.warn('[List Buses API] Redis fetch error:', redisErr);
    }

    // 5. Cache Miss - Determine matching Bus IDs based on filters
    const busFilter: any = user.role === 'admin' ? {} : { operatorId };
    let targetBusIds: string[] | null = null;
    let activeTrips: any[] = [];

    // Filter A: Traveling (Active trips)
    if (traveling) {
      const activeTripsQuery: any = {
        status: { $in: ['BOARDING', 'DEPARTED', 'IN_TRANSIT'] }
      };

      // For operators, we only query trips matching their owned buses
      if (user.role !== 'admin') {
        const ownedBuses = await Bus.find(busFilter, '_id');
        const ownedBusIds = ownedBuses.map(b => b._id);
        activeTripsQuery.busId = { $in: ownedBusIds };
      }

      activeTrips = await Trip.find(activeTripsQuery).populate('routeId');
      const travelingBusIds = activeTrips.map(t => t.busId.toString());
      targetBusIds = travelingBusIds;
    }

    // Filter B: Search by Route ID
    if (routeId) {
      const routeTripsQuery: any = { routeId };
      if (user.role !== 'admin') {
        const ownedBuses = await Bus.find(busFilter, '_id');
        const ownedBusIds = ownedBuses.map(b => b._id);
        routeTripsQuery.busId = { $in: ownedBusIds };
      }

      const routeTrips = await Trip.find(routeTripsQuery);
      const routeBusIds = routeTrips.map(t => t.busId.toString());

      if (targetBusIds !== null) {
        targetBusIds = targetBusIds.filter(id => routeBusIds.includes(id));
      } else {
        targetBusIds = routeBusIds;
      }
    }

    // Filter C: Search by Source and Destination stops
    if (source && destination) {
      // Find matching routes (with case-insensitive stop checks and order validation)
      const routes = await Route.find({
        stops: {
          $all: [
            { $elemMatch: { stopName: { $regex: new RegExp(`^${source.trim()}$`, 'i') } } },
            { $elemMatch: { stopName: { $regex: new RegExp(`^${destination.trim()}$`, 'i') } } }
          ]
        }
      });

      const matchedRouteIds: string[] = [];
      for (const r of routes) {
        const boardingStop = r.stops.find((s: any) => s.stopName.toLowerCase() === source.toLowerCase().trim());
        const droppingStop = r.stops.find((s: any) => s.stopName.toLowerCase() === destination.toLowerCase().trim());
        if (boardingStop && droppingStop && boardingStop.sequence < droppingStop.sequence) {
          matchedRouteIds.push(r._id.toString());
        }
      }

      // If source/destination provided but no matching route/trip exists, we return empty results early
      if (matchedRouteIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      const routeTripsQuery: any = { routeId: { $in: matchedRouteIds } };
      if (user.role !== 'admin') {
        const ownedBuses = await Bus.find(busFilter, '_id');
        const ownedBusIds = ownedBuses.map(b => b._id);
        routeTripsQuery.busId = { $in: ownedBusIds };
      }

      const segmentTrips = await Trip.find(routeTripsQuery);
      const segmentBusIds = segmentTrips.map(t => t.busId.toString());

      if (targetBusIds !== null) {
        targetBusIds = targetBusIds.filter(id => segmentBusIds.includes(id));
      } else {
        targetBusIds = segmentBusIds;
      }
    }

    // Apply the resolved Bus ID constraints to the final Bus query
    if (targetBusIds !== null) {
      busFilter._id = { $in: targetBusIds };
    }

    // Fetch the final filtered buses
    const buses = await Bus.find(busFilter).sort({ createdAt: -1 });

    const formattedBuses = buses.map((bus) => {
      // Find active trip if traveling filter was used or we want to enrich traveling status
      const busActiveTrip = activeTrips.find(t => t.busId.toString() === bus._id.toString());

      return {
        id: bus._id.toString(),
        busNumber: bus.busNumber,
        type: bus.type,
        capacity: bus.capacity,
        rows: bus.rows,
        cols: bus.cols,
        sleeperSeats: bus.sleeperSeats,
        amenities: bus.amenities,
        images: bus.images.map(optimizeImageUrl),
        createdAt: bus.createdAt,
        activeTrip: busActiveTrip ? {
          id: busActiveTrip._id.toString(),
          source: busActiveTrip.source,
          destination: busActiveTrip.destination,
          departureTime: busActiveTrip.departureTime,
          arrivalTime: busActiveTrip.arrivalTime,
          status: busActiveTrip.status,
          routeName: busActiveTrip.routeId
            ? `${(busActiveTrip.routeId as any).source} to ${(busActiveTrip.routeId as any).destination}`
            : `${busActiveTrip.source} to ${busActiveTrip.destination}`
        } : null
      };
    });

    // 6. Save to Redis Cache (with dynamic TTL)
    try {
      await redis.set(cacheKey, JSON.stringify(formattedBuses), 'EX', cacheTTL);
      console.log(`[List Buses API] Cached operator list under key: ${cacheKey} with TTL: ${cacheTTL}s`);
    } catch (redisErr) {
      console.warn('[List Buses API] Redis set error:', redisErr);
    }

    return NextResponse.json({
      success: true,
      data: formattedBuses,
    });

  } catch (error: any) {
    console.error('[List Buses API] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error loading buses.' },
      { status: 500 }
    );
  }
}
