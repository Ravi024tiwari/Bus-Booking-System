import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';

import { getAdminBusesKPIs, getAdminBusesFiltersOptions, getAdminBusesList } from '@/lib/admin-buses';
import BusesClient from './buses-client';

export const dynamic = 'force-dynamic';

export default async function AdminBusesPage() {
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
    } else {
      redirect('/login');
    }
  } catch (err) {
    console.error('[Admin Buses Server Page] Authentication validation failure:', err);
    redirect('/login');
  }

  // Fetch initial data in parallel on the server
  const [initialKPIs, initialFilterOptions, initialBusesResult] = await Promise.all([
    getAdminBusesKPIs(),
    getAdminBusesFiltersOptions(),
    getAdminBusesList({ page: 1, limit: 12 })
  ]);

  return (
    <BusesClient 
      initialKPIs={initialKPIs}
      initialFilterOptions={initialFilterOptions}
      initialBuses={initialBusesResult.buses}
      initialTotal={initialBusesResult.total}
    />
  );
}
