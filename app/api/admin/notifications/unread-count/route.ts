import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-proxy';
import dbConnect from '@/lib/db';
import { Notification } from '@/models';

export const dynamic = 'force-dynamic';

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

    // 2. Count unread notifications for this specific admin
    const count = await Notification.countDocuments({
      userId: user.id,
      read: false,
    });

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (err: any) {
    console.error('[Admin Notifications Count API] Fatal error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching notifications count.' },
      { status: 500 }
    );
  }
}
