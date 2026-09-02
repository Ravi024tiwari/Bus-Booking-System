import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
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
 * GET /api/buses/[busId] - Get details of a specific bus.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ busId: string }> }
) {
  try {
    await dbConnect();
    const { busId } = await params;
    const cacheKey = `bus:details:${busId}`;

    // 1. Fetch from Redis Cache
    try {
      const cachedBus = await redis.get(cacheKey);
      if (cachedBus) {
        console.log(`[Bus Details API] Cache hit for key: ${cacheKey}`);
        return NextResponse.json({
          success: true,
          data: JSON.parse(cachedBus),
        });
      }
    } catch (redisErr) {
      console.warn('[Bus Details API] Redis fetch error:', redisErr);
    }

    // 2. Cache Miss - Query MongoDB
    const bus = await Bus.findById(busId).populate('routeId');
    if (!bus) {
      return NextResponse.json({ success: false, message: 'Bus not found.' }, { status: 404 });
    }

    const routeObj = bus.routeId as any;
    const routeId = routeObj?._id ? routeObj._id.toString() : (bus.routeId ? bus.routeId.toString() : '');

    const busDetails = {
      id: bus._id.toString(),
      operatorId: bus.operatorId.toString(),
      routeId: routeId,
      route: routeObj && routeObj._id ? {
        id: routeObj._id.toString(),
        source: routeObj.source,
        destination: routeObj.destination,
        stops: routeObj.stops || [],
        totalDistance: routeObj.totalDistance,
        description: routeObj.description,
      } : null,
      busNumber: bus.busNumber,
      type: bus.type,
      capacity: bus.capacity,
      rows: bus.rows,
      cols: bus.cols,
      sleeperSeats: bus.sleeperSeats || [],
      amenities: bus.amenities || [],
      images: bus.images.map(optimizeImageUrl),
      createdAt: bus.createdAt,
    };

    // 3. Save to Redis Cache (1 hour TTL)
    try {
      await redis.set(cacheKey, JSON.stringify(busDetails), 'EX', 3600);
      console.log(`[Bus Details API] Cached bus details under key: ${cacheKey}`);
    } catch (redisErr) {
      console.warn('[Bus Details API] Redis set error:', redisErr);
    }

    return NextResponse.json({
      success: true,
      data: busDetails,
    });

  } catch (error: any) {
    console.error('[Bus Details API] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error loading bus details.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/buses/[busId] - Update bus details.
 * Permitted roles: owner operator, admin
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ busId: string }> }
) {
  try {
    await dbConnect();
    const { busId } = await params;

    // 1. Authenticate user
    const { user, errorResponse } = await verifyAuth(['operator', 'admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    // 2. Verify bus existence and ownership
    const bus = await Bus.findById(busId);
    if (!bus) {
      return NextResponse.json({ success: false, message: 'Bus not found.' }, { status: 404 });
    }

    if (bus.operatorId.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. You do not own this bus.' },
        { status: 403 }
      );
    }

    // 3. Parse and validate payload
    const formData = await req.formData();
    const routeId = formData.get('routeId')?.toString() || undefined;
    const busNumber = formData.get('busNumber')?.toString() || undefined;
    const type = formData.get('type')?.toString() || undefined;
    const capacity = formData.get('capacity')?.toString() || undefined;
    const rows = formData.get('rows')?.toString() || undefined;
    const cols = formData.get('cols')?.toString() || undefined;
    const sleeperSeats = formData.get('sleeperSeats')?.toString() || undefined;
    const amenities = formData.get('amenities')?.toString() || undefined;

    const validationResult = busSchema.safeParse({
      routeId,
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
      routeId: validatedRouteId,
      busNumber: validatedBusNumber,
      type: validatedType,
      capacity: validatedCapacity,
      rows: validatedRows,
      cols: validatedCols,
      sleeperSeats: validatedSleeperSeats = [],
      amenities: validatedAmenities = [],
    } = validationResult.data;

    // Ensure referenced Route exists
    const routeExists = await Route.findById(validatedRouteId);
    if (!routeExists) {
      return NextResponse.json(
        { success: false, message: 'Referenced route does not exist.' },
        { status: 404 }
      );
    }

    // Grid dimension check
    if (validatedRows * validatedCols < validatedCapacity) {
      return NextResponse.json(
        {
          success: false,
          message: `Grid layout dimensions (${validatedRows}x${validatedCols}) are too small to support the capacity of ${validatedCapacity} seats.`,
        },
        { status: 400 }
      );
    }

    // Uniqueness plate check (if changed)
    if (validatedBusNumber !== bus.busNumber) {
      const duplicatePlate = await Bus.findOne({ busNumber: validatedBusNumber });
      if (duplicatePlate) {
        return NextResponse.json(
          { success: false, message: `Another bus with license plate number "${validatedBusNumber}" already exists.` },
          { status: 409 }
        );
      }
    }

    // 4. Production Check: Block layout alterations if bus has scheduled future trips
    const layoutChanged =
      bus.capacity !== validatedCapacity ||
      bus.rows !== validatedRows ||
      bus.cols !== validatedCols;

    if (layoutChanged) {
      const activeTrip = await Trip.findOne({
        busId,
        departureTime: { $gt: new Date() },
        status: { $ne: 'CANCELLED' },
      });

      if (activeTrip) {
        return NextResponse.json(
          {
            success: false,
            message: 'Cannot modify seat layout dimensions or capacity because this bus is assigned to active scheduled future trips.',
          },
          { status: 400 }
        );
      }
    }

    // 5. Image upload handling
    const updatedImages = [...bus.images];
    const files = formData.getAll('images') as File[];

    const uploadPromises = files
      .filter((file) => file.size > 0 && file.type.startsWith('image/'))
      .map(async (file) => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds the maximum size limit of 5MB.`);
        }
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return await uploadToCloudinary(buffer, 'buses');
      });

    try {
      const newUrls = await Promise.all(uploadPromises);
      updatedImages.push(...newUrls);
    } catch (uploadErr: any) {
      console.error('[Update Bus] Image upload failed:', uploadErr);
      return NextResponse.json(
        { success: false, message: uploadErr.message || 'Failed to upload new bus pictures.' },
        { status: 500 }
      );
    }

    // Optional: Allow deleting specific images if provided as a list
    const deleteImagesList = formData.get('deleteImages');
    if (deleteImagesList) {
      try {
        const toDelete: string[] = JSON.parse(deleteImagesList.toString());
        toDelete.forEach((url) => {
          const idx = updatedImages.indexOf(url);
          if (idx > -1) {
            updatedImages.splice(idx, 1);
          }
        });
      } catch (err) {
        console.warn('[Update Bus] Failed to parse deleteImages parameter:', err);
      }
    }

    // 6. Save Updates
    bus.routeId = new mongoose.Types.ObjectId(validatedRouteId);
    bus.busNumber = validatedBusNumber;
    bus.type = validatedType;
    bus.capacity = validatedCapacity;
    bus.rows = validatedRows;
    bus.cols = validatedCols;
    bus.sleeperSeats = validatedSleeperSeats;
    bus.amenities = validatedAmenities;
    bus.images = updatedImages;

    await bus.save();

    // 7. Invalidate Redis Caches
    const operatorCacheKey = `operator:buses:${bus.operatorId}`;
    const busDetailsCacheKey = `bus:details:${busId}`;

    try {
      await redis.del(operatorCacheKey);
      await redis.del(busDetailsCacheKey);
      console.log(`[Update Bus] Invalidated caches for operator (${operatorCacheKey}) and details (${busDetailsCacheKey})`);
    } catch (redisErr) {
      console.warn('[Update Bus] Redis cache invalidation error:', redisErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Bus details updated successfully.',
      data: {
        id: bus._id.toString(),
        routeId: bus.routeId.toString(),
        busNumber: bus.busNumber,
        type: bus.type,
        capacity: bus.capacity,
        rows: bus.rows,
        cols: bus.cols,
        sleeperSeats: bus.sleeperSeats,
        amenities: bus.amenities,
        images: bus.images.map(optimizeImageUrl),
      },
    });

  } catch (error: any) {
    console.error('[Update Bus API] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error updating bus details.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/buses/[busId] - Delete a bus.
 * Permitted roles: owner operator, admin
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ busId: string }> }
) {
  try {
    await dbConnect();
    const { busId } = await params;

    // 1. Authenticate user
    const { user, errorResponse } = await verifyAuth(['operator', 'admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    // 2. Verify bus existence and ownership
    const bus = await Bus.findById(busId);
    if (!bus) {
      return NextResponse.json({ success: false, message: 'Bus not found.' }, { status: 404 });
    }

    if (bus.operatorId.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. You do not own this bus.' },
        { status: 403 }
      );
    }

    // 3. Production Check: Block deletion if bus has scheduled future trips
    const activeTrip = await Trip.findOne({
      busId,
      departureTime: { $gt: new Date() },
      status: { $ne: 'CANCELLED' },
    });

    if (activeTrip) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete this bus because it is currently assigned to active scheduled future trips.',
        },
        { status: 400 }
      );
    }

    // 4. Delete from Database
    const operatorId = bus.operatorId;
    await Bus.deleteOne({ _id: busId });

    // 5. Invalidate Caches
    const operatorCacheKey = `operator:buses:${operatorId}`;
    const busDetailsCacheKey = `bus:details:${busId}`;

    try {
      await redis.del(operatorCacheKey);
      await redis.del(busDetailsCacheKey);
      console.log(`[Delete Bus] Cleared Redis cache keys for: ${operatorCacheKey}, ${busDetailsCacheKey}`);
    } catch (redisErr) {
      console.warn('[Delete Bus] Redis cache invalidation error:', redisErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Bus deleted successfully.',
    });

  } catch (error: any) {
    console.error('[Delete Bus API] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error deleting bus.' },
      { status: 500 }
    );
  }
}
