import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';

// Import aggregate queries helpers
import { getAdminOperatorsKPIs, getAdminOperatorsList } from '@/lib/admin-operators';

// Import Client-side Page Component
import OperatorsClient from './operators-client';

export const dynamic = 'force-dynamic';

export default async function AdminOperatorsPage() {
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
    console.error('[Admin Operators Server] Auth validation failure:', err);
    redirect('/login');
  }

  // Fetch initial data in parallel
  const [initialKPIs, initialListResult] = await Promise.all([
    getAdminOperatorsKPIs(),
    getAdminOperatorsList({ page: 1, limit: 10 })
  ]);

  return (
    <OperatorsClient 
      initialKPIs={initialKPIs}
      initialOperators={initialListResult.operators}
      initialTotal={initialListResult.total}
    />
  );
}
