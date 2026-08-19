import React from 'react';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { 
  Compass, 
  Calendar, 
  CreditCard, 
  Star,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export default async function KpiCards() {
  // 1. Load defaults
  let completedTrips = 12;
  let upcomingTrips = 2;
  let spentThisMonth = 3450;
  let rewardPoints = 850;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
      const decoded: any = jwt.verify(token, jwtSecret);
      
      if (decoded && decoded.id) {
        await dbConnect();
        
        // Fetch confirmed orders for this passenger
        const orders = await Order.find({ 
          passengerId: decoded.id, 
          status: 'CONFIRMED' 
        });

        if (orders && orders.length > 0) {
          completedTrips = orders.length;
          upcomingTrips = 2; // Default mock for upcoming
          spentThisMonth = orders.reduce((sum, order) => sum + order.amount, 0);
          rewardPoints = Math.round(spentThisMonth * 0.25);
        }
      }
    }
  } catch (err) {
    console.error('[KPI Cards Server Side] Error querying database:', err);
    // Silent fail, fallback to design defaults
  }

  const cards = [
    {
      title: 'Trips Completed',
      value: completedTrips.toString(),
      icon: Compass,
      iconBg: 'bg-indigo-500/10 text-indigo-500',
      description: (
        <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-0.5">
          <TrendingUp className="h-3 w-3" />
          +2 this month
        </span>
      ),
    },
    {
      title: 'Upcoming Trips',
      value: upcomingTrips.toString(),
      icon: Calendar,
      iconBg: 'bg-pink-500/10 text-pink-500',
      description: (
        <span className="text-[11px] font-bold text-pink-500">
          Next: 24 May 2025
        </span>
      ),
    },
    {
      title: 'Spent This Month',
      value: `₹${spentThisMonth.toLocaleString('en-IN')}`,
      icon: CreditCard,
      iconBg: 'bg-orange-500/10 text-orange-500',
      description: (
        <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-0.5">
          <TrendingUp className="h-3 w-3" />
          +12% vs last month
        </span>
      ),
    },
    {
      title: 'Reward Points',
      value: rewardPoints.toString(),
      icon: Star,
      iconBg: 'bg-violet-500/10 text-violet-500',
      description: (
        <button className="text-[11px] font-extrabold text-violet-600 hover:text-violet-700 flex items-center gap-0.5">
          Redeem Now
          <ArrowRight className="h-3 w-3 transition-transform duration-200 hover:translate-x-0.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div 
            key={card.title}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 flex items-center gap-4.5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.02)] transition-shadow duration-300 relative overflow-hidden"
          >
            {/* Soft backdrop glow */}
            <div className="absolute top-[-10%] right-[-10%] w-[100px] h-[100px] bg-zinc-200 dark:bg-zinc-800/20 rounded-full blur-[30px] pointer-events-none" />

            {/* Icon Block */}
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${card.iconBg}`}>
              <Icon className="h-6 w-6" />
            </div>

            {/* Content info */}
            <div className="flex flex-col select-none">
              <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">
                {card.title}
              </span>
              <span className="text-xl font-black text-zinc-900 dark:text-white mt-1 block leading-none">
                {card.value}
              </span>
              <div className="mt-1.5 flex items-center leading-none">
                {card.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
