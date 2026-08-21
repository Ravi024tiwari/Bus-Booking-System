import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import redis from '@/lib/redis';
import { Route } from '@/models';
import { routeSchema } from '@/lib/validations';
import { verifyAuth } from '@/lib/auth-proxy';

/**
 * POST /api/routes - Create a new Route Template.
 * Permitted roles: operator, admin
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    const { user, errorResponse } = await verifyAuth(['admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const operatorId = user.id;


    const body = await req.json();
    const validationResult = routeSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || 'Invalid input data';
      return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }

    const { source, destination, stops } = validationResult.data;

    // 3. Sort stops by sequence and perform semantic validations
    const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);

    // Validate sequence order (must be 1, 2, 3, ... sequentially)
    for (let i = 0; i < sortedStops.length; i++) {
      if (sortedStops[i].sequence !== i + 1) {
        return NextResponse.json(
          {
            success: false,
            message: `Stops sequence must start at 1 and increase consecutively by 1. Found sequence ${sortedStops[i].sequence} at index ${i}.`,
          },
          { status: 400 }
        );
      }
    }

    // Verify first stop matches the route's source
    const firstStop = sortedStops[0];
    if (firstStop.stopName.toLowerCase() !== source.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          message: `The first stop name ("${firstStop.stopName}") must match the route's source ("${source}").`,
        },
        { status: 400 }
      );
    }

    // Verify last stop matches the route's destination
    const lastStop = sortedStops[sortedStops.length - 1];
    if (lastStop.stopName.toLowerCase() !== destination.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          message: `The last stop name ("${lastStop.stopName}") must match the route's destination ("${destination}").`,
        },
        { status: 400 }
      );
    }

    // Verify first stop has 0 fare from previous
    if (firstStop.fareFromPreviousStop !== 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'The fare from previous stop for the starting stop (source) must be 0.',
        },
        { status: 400 }
      );
    }

    // 4. Save to MongoDB
    const newRoute = await Route.create({
      operatorId,
      source,
      destination,
      stops: sortedStops,
    });

    // 5. Invalidate Redis Caches (Global routes cache)
    const cacheKey = 'global:routes';
    try {
      await redis.del(cacheKey);
      console.log(`[Create Route] Cache invalidated for key: ${cacheKey}`);
    } catch (redisErr) {
      console.warn('[Create Route] Redis cache invalidation error:', redisErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Route template created successfully.',
        data: {
          id: newRoute._id.toString(),
          source: newRoute.source,
          destination: newRoute.destination,
          stops: newRoute.stops,
          createdAt: newRoute.createdAt,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[Create Route API] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error creating route.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/routes - List operator's route templates.
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

    const { searchParams } = new URL(req.url);
    const bypassCache = searchParams.get('bypassCache') === 'true';
    const cacheKey = 'global:routes';

    // 2. Fetch from Redis Cache
    if (!bypassCache) {
      try {
        const cachedRoutes = await redis.get(cacheKey);
        if (cachedRoutes) {
          console.log(`[List Routes API] Cache hit for key: ${cacheKey}`);
          return NextResponse.json({
            success: true,
            data: JSON.parse(cachedRoutes),
          });
        }
      } catch (redisErr) {
        console.warn('[List Routes API] Redis fetch error:', redisErr);
      }
    }

    // 3. Cache Miss / Force Fetch - Query MongoDB (All routes are global templates created by admins)
    const query = {};
    const routes = await Route.find(query).sort({ createdAt: -1 });

    const formattedRoutes = routes.map((route) => ({
      id: route._id.toString(),
      source: route.source,
      destination: route.destination,
      stops: route.stops,
      createdAt: route.createdAt,
    }));

    // 4. Save to Redis Cache (1 hour TTL)
    if (!bypassCache) {
      try {
        await redis.set(cacheKey, JSON.stringify(formattedRoutes), 'EX', 3600);
        console.log(`[List Routes API] Cached routes list under key: ${cacheKey}`);
      } catch (redisErr) {
        console.warn('[List Routes API] Redis set error:', redisErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedRoutes,
    });

  } catch (error: any) {
    console.error('[List Routes API] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error loading routes.' },
      { status: 500 }
    );
  }
}
