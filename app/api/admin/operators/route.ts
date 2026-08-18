import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import redis from '@/lib/redis';
import { User } from '@/models';
import { verifyAuth } from '@/lib/auth-proxy';

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
 * Supports status filtering, regex search on name/email, and pagination.
 * Returns overall counts per status to simplify UI tab rendering.
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

    await dbConnect();

    // 2. Parse query parameters

    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status'); // PENDING | APPROVED | REJECTED | ALL

    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const skip = (page - 1) * limit;

    // 3. Construct MongoDB query
    const query: any = { role: 'operator' };

    // Apply status filter if provided and not 'ALL' (case-insensitive checking)
    if (status && status.toUpperCase() !== 'ALL') {
      const upperStatus = status.toUpperCase();
      if (['PENDING', 'APPROVED', 'REJECTED'].includes(upperStatus)) {
        query.operatorApprovalStatus = upperStatus;
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid status filter value. Allowed: PENDING, APPROVED, REJECTED, ALL' },
          { status: 400 }
        );
      }
    }

    // Apply search filter if provided
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } }
      ];
    }

    // 4. Fetch matching operators with pagination

    const operators = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMatching = await User.countDocuments(query);

    // 5. Gather status stats for all operators under the current search filter
    const statsQuery: any = { role: 'operator' };
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      statsQuery.$or = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } }
      ];
    }

    const statsGroup = await User.aggregate([
      { $match: statsQuery },
      {
        $group: {
          _id: '$operatorApprovalStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    statsGroup.forEach((group: any) => {
      const count = group.count;
      const statusKey = group._id;
      if (statusKey === 'PENDING') stats.pending = count;
      else if (statusKey === 'APPROVED') stats.approved = count;
      else if (statusKey === 'REJECTED') stats.rejected = count;
      stats.total += count;
    });

    const formattedOperators = operators.map(op => ({
      id: op._id.toString(),
      name: op.name,
      email: op.email,
      role: op.role,
      operatorApprovalStatus: op.operatorApprovalStatus,
      gender: op.gender || null,
      age: op.age || null,
      profileImage: op.profileImage || null,
      createdAt: op.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        operators: formattedOperators,
        pagination: {
          total: totalMatching,
          page,
          limit,
          totalPages: Math.ceil(totalMatching / limit)
        },
        stats
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

    const validation = updateStatusSchema.safeParse(body);
    
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
      console.log(`[Admin Operators PATCH API] Cache invalidated for operator key: ${cacheKey}`);
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
