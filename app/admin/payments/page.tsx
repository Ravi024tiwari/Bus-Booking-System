import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { Order, User } from '@/models';
import { CreditCard } from 'lucide-react';
import PaymentKPIs from '@/components/admin/payment-kpis';
import PaymentFilters from '@/components/admin/payment-filters';
import PaymentTable from '@/components/admin/payment-table';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  // Resolve params
  const { search, status } = await searchParams;

  // 1. Authenticate user from secure Cookie
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
    console.error('[Admin Payments Server] Authentication failure:', err);
    redirect('/login');
  }

  // 2. Fetch overall summary statistics (unfiltered totals)
  const allOrders = await Order.find();
  const totalRevenue = allOrders
    .filter(o => o.status === 'CONFIRMED')
    .reduce((sum, o) => sum + o.amount, 0);

  const totalPending = allOrders
    .filter(o => o.status === 'PAYMENT_PENDING' || o.status === 'PENDING')
    .reduce((sum, o) => sum + o.amount, 0);

  const totalFailedCount = allOrders
    .filter(o => o.status === 'PAYMENT_FAILED')
    .length;

  const totalSuccessfulCount = allOrders
    .filter(o => o.status === 'CONFIRMED')
    .length;

  // 3. Build query for current page matching search and status filters
  const dbFilter: any = {};
  if (status) {
    dbFilter.status = status;
  }

  if (search) {
    // Check if search matches passenger name/email
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');

    const userIds = users.map(u => u._id);

    dbFilter.$or = [
      { passengerId: { $in: userIds } },
      { razorpayOrderId: { $regex: search, $options: 'i' } },
      { razorpayPaymentId: { $regex: search, $options: 'i' } },
      { fromStop: { $regex: search, $options: 'i' } },
      { toStop: { $regex: search, $options: 'i' } }
    ];
  }

  // 4. Query filtered transactions
  const orders = await Order.find(dbFilter)
    .populate('passengerId', 'name email')
    .populate('tripId', 'busNumber busType source destination departureTime')
    .sort({ createdAt: -1 });

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Payment Ledger <CreditCard className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
            Audit system transactions, payouts, and customer booking payments.
          </p>
        </div>
      </div>

      {/* METRIC CARDS COMPONENT */}
      <PaymentKPIs 
        totalRevenue={totalRevenue}
        totalPending={totalPending}
        totalSuccessfulCount={totalSuccessfulCount}
        totalFailedCount={totalFailedCount}
      />

      {/* FILTER & SEARCH FORM COMPONENT */}
      <PaymentFilters 
        search={search}
        status={status}
      />

      {/* PAYMENTS TABLE CONTAINER COMPONENT */}
      <PaymentTable 
        orders={orders}
      />

    </div>
  );
}
