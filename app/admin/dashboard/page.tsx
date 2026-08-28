import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';

// Import Mongoose query helpers
import {
  getAdminKPIs,
  getAdminPendingApprovals,
  getAdminRecentBookings,
  getAdminPopularRoutes,
  getAdminRecentActivity,
  getAdminTopOperators
} from '@/lib/admin-dashboard';

// Import Server-side Components
import AdminKPIs from '@/components/admin/kpis';
import AdminPendingApprovals from '@/components/admin/pending-approvals';
import AdminPopularRoutes from '@/components/admin/popular-routes';
import AdminTopOperators from '@/components/admin/top-operators';
import AdminRecentActivity from '@/components/admin/recent-activity';
import AdminRecentBookings from '@/components/admin/recent-bookings';

// Import Client-side Components
import AdminInteractiveBanner from '@/components/admin/interactive-banner';
import AdminBookingOverview from '@/components/admin/booking-overview';
import AdminFleetStatus from '@/components/admin/fleet-status';
import AdminAlertsNotifications from '@/components/admin/alerts-notifications';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let adminName = 'Admin';

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      redirect('/login');
    }

    const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
    const decoded: any = jwt.verify(token, jwtSecret);

    if (decoded && decoded.id) {
      await dbConnect();
      const user = await User.findById(decoded.id);

      if (!user || user.role !== 'admin') {
        redirect('/login');
      }

      if (user.name) {
        adminName = user.name.split(' ')[0]; // Extract first name
      }
    } else {
      redirect('/login');
    }
  } catch (err) {
    console.error('[Admin Dashboard Server] Authentication failure:', err);
    redirect('/login');
  }

  // Fetch all server data in parallel
  const [
    kpiStats,
    pendingApprovals,
    recentBookings,
    popularRoutes,
    recentActivity,
    topOperators
  ] = await Promise.all([
    getAdminKPIs(),
    getAdminPendingApprovals(),
    getAdminRecentBookings(),
    getAdminPopularRoutes(),
    getAdminRecentActivity(),
    getAdminTopOperators()
  ]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto">
      
      {/* Interactive Greetings Banner */}
      <AdminInteractiveBanner />

      {/* KPIs Metrics summary */}
      <AdminKPIs stats={kpiStats} />

      {/* Grid of Main Dashboard widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8">
          <AdminRecentBookings bookings={recentBookings} />
        </div>

        <div className="lg:col-span-4">
          <AdminBookingOverview />
        </div>

      </div>

      {/* Secondary Row of status indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* Fleet Status Donut Chart */}
        <div className="lg:col-span-4">
          <AdminFleetStatus />
        </div>

        {/* Pending approvals counter */}
        <div className="lg:col-span-4">
          <AdminPendingApprovals approvals={pendingApprovals} />
        </div>

        {/* Top popular routes bar charts */}
        <div className="lg:col-span-4">
          <AdminPopularRoutes routes={popularRoutes} />
        </div>

      </div>

      {/* Third Row of system events and top operators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* Timeline activity stream */}
        <div className="lg:col-span-6">
          <AdminRecentActivity activities={recentActivity} />
        </div>

        {/* Revenue leaderboard of top operators */}
        <div className="lg:col-span-6">
          <AdminTopOperators operators={topOperators} />
        </div>

      </div>

      {/* Full width alerts alerts row */}
      <div className="w-full">
        <AdminAlertsNotifications />
      </div>

    </div>
  );
}
