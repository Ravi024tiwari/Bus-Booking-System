import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import redis from '@/lib/redis';
import { User } from '@/models';
import { verifyAuth } from '@/lib/auth-proxy';
import { getAdminOperatorsList } from '@/lib/admin-operators';

// Zod validation schema for updating operator approval status
const updateStatusSchema = z.object({
  operatorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid operator ID format'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
    message: 'Status must be PENDING, APPROVED, or REJECTED',
  }),
});

/**
 * GET /api/admin/operators
 * Admin-only route to retrieve all operators.
 * Supports status filtering, regex search on name/email, date range, and pagination.
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user as admin
    const { user, errorResponse } = await verifyAuth(['admin']);

    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const joinedStartParam = searchParams.get('joinedStart');
    const joinedEndParam = searchParams.get('joinedEnd');

    const joinedStart = joinedStartParam ? new Date(joinedStartParam) : undefined;
    const joinedEnd = joinedEndParam ? new Date(joinedEndParam) : undefined;

    const { operators, total } = await getAdminOperatorsList({
      status,
      search,
      page,
      limit,
      joinedStart,
      joinedEnd
    });

    return NextResponse.json({
      success: true,
      data: {
        operators,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('[Admin Operators GET API] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching operators.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/operators
 * Admin-only route to update an operator's approval status.
 * Expects { operatorId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED' } in body.
 * Invalidates the operator's user profile cache in Redis upon status update.
 */
export async function PATCH(req: Request) {
  try {
    // 1. Authenticate user as admin
    const { user, errorResponse } = await verifyAuth(['admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    await dbConnect();

    // 2. Parse and validate body

    let body: any;

    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const validation = updateStatusSchema.safeParse(body);// here firstly it will pasrse the req body with the backend

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid input data';
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }

    const { operatorId, status } = validation.data;

    // 3. Find user and verify role is operator
    const operator = await User.findOne({ _id: operatorId, role: 'operator' });
    if (!operator) {
      return NextResponse.json(
        { success: false, message: 'Operator account not found.' },
        { status: 404 }
      );
    }

    // 4. Update the approval status
    operator.operatorApprovalStatus = status;
    await operator.save();

    // 5. Invalidate the user profile cache in Redis
    const cacheKey = `user:profile:${operatorId}`;
    try {
      await redis.del(cacheKey);
    } catch (redisErr) {
      console.warn('[Admin Operators PATCH API] Redis cache invalidation error:', redisErr);
    }

    return NextResponse.json({
      success: true,
      message: `Operator approval status successfully updated to ${status}.`,
      data: {
        id: operator._id.toString(),
        name: operator.name,
        email: operator.email,
        role: operator.role,
        operatorApprovalStatus: operator.operatorApprovalStatus
      }
    });

  } catch (error: any) {
    console.error('[Admin Operators PATCH API] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error updating operator status.' },
      { status: 500 }
    );
  }
}
