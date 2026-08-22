import React from 'react';
import { Users, Ticket, IndianRupee, UserCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { KPIStats } from '@/lib/admin-dashboard';

export default function AdminKPIs({ stats }: { stats: KPIStats }) {
  const formatRevenue = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString('en-IN'),
      growth: stats.totalUsersGrowth,
      growthText: 'from last month',
      icon: Users,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/30',
      iconColor: 'text-indigo-500',
      glowColor: 'bg-indigo-500/5',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings.toLocaleString('en-IN'),
      growth: stats.totalBookingsGrowth,
      growthText: 'from last month',
      icon: Ticket,
      iconBg: 'bg-teal-50 dark:bg-teal-950/30',
      iconColor: 'text-teal-500',
      glowColor: 'bg-teal-500/5',
    },
    {
      title: 'Total Revenue',
      value: formatRevenue(stats.totalRevenue),
      growth: stats.totalRevenueGrowth,
      growthText: 'from last month',
      icon: IndianRupee,
      iconBg: 'bg-amber-50 dark:bg-amber-950/30',
      iconColor: 'text-amber-500',
      glowColor: 'bg-amber-500/5',
    },
    {
      title: 'Active Operators',
      value: stats.activeOperators.toLocaleString('en-IN'),
      growth: stats.activeOperatorsGrowth,
      growthText: 'this month',
      isAbsoluteGrowth: true,
      icon: UserCheck,
      iconBg: 'bg-rose-50 dark:bg-rose-950/30',
      iconColor: 'text-rose-500',
      glowColor: 'bg-rose-500/5',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isPositive = card.growth >= 0;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex items-center gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_15px_35px_rgba(99,102,241,0.04)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group select-none"
          >
            <div className={`absolute top-[-10%] right-[-10%] w-[100px] h-[100px] ${card.glowColor} rounded-full blur-[30px] pointer-events-none group-hover:scale-125 transition-transform duration-500`} />
            
            <div className={`h-14 w-14 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105`}>
              <Icon className="h-6 w-6" />
            </div>
            
            <div className="flex flex-col min-w-0">
              <span className="text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider block">
                {card.title}
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white mt-1 block leading-none truncate">
                {card.value}
              </span>
              <div className="mt-2 flex items-center leading-none">
                <span className={`text-xs font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {card.isAbsoluteGrowth ? `${isPositive ? '+' : ''}${card.growth}` : `${Math.abs(card.growth)}%`}
                </span>
                <span className="text-zinc-400 dark:text-zinc-500 text-xs font-medium ml-1 truncate">
                  {card.growthText}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
