import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-proxy';
import { getAdminBookingOverview } from '@/lib/admin-dashboard';

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
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const data = await getAdminBookingOverview(startDate, endDate);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[Admin Booking Overview API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching booking overview.' },
      { status: 500 }
    );
  }
}
