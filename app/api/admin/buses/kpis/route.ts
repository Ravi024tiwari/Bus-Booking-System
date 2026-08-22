import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-proxy';
import { getAdminBusesKPIs, getAdminBusesFiltersOptions } from '@/lib/admin-buses';

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

    const kpis = await getAdminBusesKPIs();
    const filters = await getAdminBusesFiltersOptions();

    return NextResponse.json({
      success: true,
      data: {
        kpis,
        filterOptions: filters
      }
    });
  } catch (error: any) {
    console.error('[Admin Buses KPIs GET API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching buses KPIs.' },
      { status: 500 }
    );
  }
}
