import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-proxy';
import { getAdminFleetStatus } from '@/lib/admin-dashboard';

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

    const data = await getAdminFleetStatus();

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[Admin Fleet Status API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching fleet status.' },
      { status: 500 }
    );
  }
}
