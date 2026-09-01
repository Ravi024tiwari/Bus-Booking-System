import React from 'react';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { Order, Trip } from '@/models';
import Link from 'next/link';
import { 
  Compass, 
  Calendar, 
  CreditCard, 
  Star,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock
} from 'lucide-react';

export default async function KpiCards() {
  let completedTrips = 0;
  let completedThisMonth = 0;
  let upcomingTrips = 0;
  let nextTripDate: string | null = null;
  let spentThisMonth = 0;
  let spentLastMonth = 0;
  let totalSpent = 0;
  let totalSavings = 0;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
      const decoded: any = jwt.verify(token, jwtSecret);

      if (decoded && decoded.id) {
        await dbConnect();

        const userId = decoded.id;
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // Fetch all user bookings with populated trip information
        const orders = await Order.find({ passengerId: userId })
          .sort({ createdAt: -1 })
          .populate({
            path: 'tripId',
            select: 'departureTime arrivalTime status source destination'
          });

        const upcomingDates: Date[] = [];

        orders.forEach((order: any) => {
          const isConfirmed = order.status === 'CONFIRMED';
          const trip = order.tripId;
          const orderCreatedAt = new Date(order.createdAt);
          const departureTime = trip?.departureTime ? new Date(trip.departureTime) : null;

          if (isConfirmed) {
            totalSpent += order.amount || 0;
            totalSavings += order.discountAmount || 0;

            // Monthly spending calculation
            if (orderCreatedAt >= startOfCurrentMonth) {
              spentThisMonth += order.amount || 0;
            } else if (orderCreatedAt >= startOfLastMonth && orderCreatedAt <= endOfLastMonth) {
              spentLastMonth += order.amount || 0;
            }

            // Trip classification
            if (departureTime) {
              if (departureTime >= now && trip.status !== 'CANCELLED') {
                upcomingTrips++;
                upcomingDates.push(departureTime);
              } else {
                completedTrips++;
                if (departureTime >= startOfCurrentMonth) {
                  completedThisMonth++;
                }
              }
            } else {
              completedTrips++;
            }
          }
        });

        // Determine closest next trip date
        if (upcomingDates.length > 0) {
          upcomingDates.sort((a, b) => a.getTime() - b.getTime());
          const nearest = upcomingDates[0];
          nextTripDate = nearest.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        }
      }
    }
  } catch (err) {
    console.error('[KPI Cards Server Component] Error computing database metrics:', err);
  }

  // Calculate percentage change vs last month
  let spentChangePercent: number | null = null;
  if (spentLastMonth > 0) {
    spentChangePercent = Math.round(((spentThisMonth - spentLastMonth) / spentLastMonth) * 100);
  } else if (spentThisMonth > 0 && spentLastMonth === 0) {
    spentChangePercent = 100;
  }

  // Reward points calculation
  const rewardPoints = Math.round(totalSavings + totalSpent * 0.1);

  const cards = [
    {
      title: 'Trips Completed',
      value: completedTrips.toString(),
      icon: Compass,
      iconBg: 'bg-indigo-500/10 text-indigo-500',
      description: completedThisMonth > 0 ? (
        <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-0.5">
          <TrendingUp className="h-3 w-3" />
          +{completedThisMonth} this month
        </span>
      ) : (
        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
          {completedTrips > 0 ? 'All time completed' : 'No trips yet'}
        </span>
      ),
    },
    {
      title: 'Upcoming Trips',
      value: upcomingTrips.toString(),
      icon: Calendar,
      iconBg: 'bg-pink-500/10 text-pink-500',
      description: nextTripDate ? (
        <span className="text-[11px] font-bold text-pink-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Next: {nextTripDate}
        </span>
      ) : (
        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
          No trips scheduled
        </span>
      ),
    },
    {
      title: 'Spent This Month',
      value: `₹${spentThisMonth.toLocaleString('en-IN')}`,
      icon: CreditCard,
      iconBg: 'bg-orange-500/10 text-orange-500',
      description: spentChangePercent !== null ? (
        <span className={`text-[11px] font-bold flex items-center gap-0.5 ${
          spentChangePercent >= 0 ? 'text-emerald-500' : 'text-amber-500'
        }`}>
          {spentChangePercent >= 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {spentChangePercent >= 0 ? `+${spentChangePercent}%` : `${spentChangePercent}%`} vs last mo.
        </span>
      ) : (
        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
          Total ₹{totalSpent.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      title: 'Reward Points',
      value: rewardPoints.toLocaleString('en-IN'),
      icon: Star,
      iconBg: 'bg-violet-500/10 text-violet-500',
      description: (
        <Link 
          href="/customer/offers"
          className="text-[11px] font-extrabold text-violet-600 hover:text-violet-700 flex items-center gap-0.5 group"
        >
          Redeem Now
          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Mobile Scroll Indicator */}
      <div className="flex items-center justify-between sm:hidden mb-2.5 px-1 select-none">
        <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          My Overview
        </span>
        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
          Scroll to view all <ArrowRight className="w-3 h-3 animate-bounce-x" />
        </span>
      </div>

      {/* KPI Cards Container: Horizontally scrollable on mobile, grid on sm+ */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 overflow-x-auto sm:overflow-x-visible no-scrollbar pb-3 sm:pb-0 pt-1 px-1 -mx-1 snap-x snap-mandatory sm:snap-none">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title}
              className="min-w-[185px] max-w-[230px] sm:max-w-none w-[52vw] sm:w-auto shrink-0 sm:shrink snap-start bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[1.6rem] sm:rounded-[2rem] p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4.5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.02)] transition-shadow duration-300 relative overflow-hidden"
            >
              {/* Soft backdrop glow */}
              <div className="absolute top-[-10%] right-[-10%] w-[80px] sm:w-[100px] h-[80px] sm:h-[100px] bg-zinc-200 dark:bg-zinc-800/20 rounded-full blur-[25px] sm:blur-[30px] pointer-events-none" />

              {/* Icon Block */}
              <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${card.iconBg}`}>
                <Icon className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
              </div>

              {/* Content info */}
              <div className="flex flex-col select-none min-w-0">
                <span className="text-zinc-400 dark:text-zinc-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block truncate">
                  {card.title}
                </span>
                <span className="text-base sm:text-xl font-black text-zinc-900 dark:text-white mt-0.5 sm:mt-1 block leading-none truncate">
                  {card.value}
                </span>
                <div className="mt-1 sm:mt-1.5 flex items-center leading-none">
                  {card.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
