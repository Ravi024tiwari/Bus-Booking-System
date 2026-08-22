import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-proxy';
import { getAdminRecentActivity } from '@/lib/admin-dashboard';

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

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 5;

    const data = await getAdminRecentActivity(limit);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[Admin Recent Activity API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching recent activity.' },
      { status: 500 }
    );
  }
}
