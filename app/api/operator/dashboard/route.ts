import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      message: 'This endpoint is deprecated. Please use the modular sub-endpoints: /api/operator/dashboard/[kpis|route-status|sales-trends|upcoming-schedules|driver-performance|feedback]' 
    },
    { status: 410 }
  );
}
