import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-proxy';
import dbConnect from '@/lib/db';
import { Notification } from '@/models';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/notifications - Retrieve notifications using cursor-based pagination.
 * Query Parameters:
 *   - limit: number (default 10)
 *   - cursor: string (ISO timestamp string of the last fetched item's createdAt field)
 */
export async function GET(req: Request) {
  try {
    const { user, errorResponse } = await verifyAuth(['admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const cursor = searchParams.get('cursor');

    const query: any = { userId: user.id };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch limit + 1 items to see if there is another page
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1);

    let nextCursor: string | null = null;

    if (notifications.length > limit) {
      const lastItem = notifications[limit - 1];
      nextCursor = lastItem.createdAt.toISOString();
      notifications.pop(); // Remove the extra (+1) item
    }

    return NextResponse.json({
      success: true,
      notifications,
      nextCursor,
    });
  } catch (err: any) {
    console.error('[Admin Notifications GET API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching notifications.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/notifications - Mark all notifications as read for the logged-in admin.
 */
export async function PUT(req: Request) {
  try {
    const { user, errorResponse } = await verifyAuth(['admin']);
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Mark all unread notifications for this admin as read
    await Notification.updateMany(
      { userId: user.id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (err: any) {
    console.error('[Admin Notifications PUT API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error marking notifications as read.' },
      { status: 500 }
    );
  }
}
