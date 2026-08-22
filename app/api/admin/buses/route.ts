import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-proxy';
import { getAdminBusesList } from '@/lib/admin-buses';

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
    const search = searchParams.get('search') || undefined;
    const route = searchParams.get('route') || undefined;
    const operator = searchParams.get('operator') || undefined;
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const data = await getAdminBusesList({
      search,
      route,
      operator,
      type,
      status,
      page,
      limit
    });

    return NextResponse.json({
      success: true,
      data: {
        buses: data.buses,
        pagination: {
          total: data.total,
          page,
          limit,
          totalPages: Math.ceil(data.total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('[Admin Buses GET API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching buses.' },
      { status: 500 }
    );
  }
}
