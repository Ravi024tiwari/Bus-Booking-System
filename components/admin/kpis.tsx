import React from 'react';
import { Users, Ticket, IndianRupee, UserCheck, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
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
    <div className="w-full">
      {/* Mobile Scroll Indicator */}
      <div className="flex items-center justify-between sm:hidden mb-2.5 px-1 select-none">
        <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Key Metrics
        </span>
        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
          Scroll to view all <ArrowRight className="w-3 h-3 animate-bounce-x" />
        </span>
      </div>

      {/* KPI Cards Container: strictly compact, non-stretching horizontal row */}
      <div className="flex overflow-x-auto sm:overflow-x-visible no-scrollbar flex-nowrap gap-3.5 sm:gap-4 lg:gap-5 pb-2 sm:pb-0 pt-0.5 px-1 -mx-1 snap-x snap-mandatory sm:snap-none w-full sm:w-auto">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const isPositive = card.growth >= 0;
          return (
            <div
              key={idx}
              className="w-[175px] sm:w-[205px] lg:flex-1 shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-4.5 lg:p-5 flex items-center gap-3.5 lg:gap-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group select-none"
            >
              <div className={`h-11 w-11 lg:h-12 lg:w-12 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5`}>
                <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="text-zinc-400 dark:text-zinc-500 text-[11px] sm:text-xs lg:text-sm font-bold uppercase tracking-wider block truncate">
                  {card.title}
                </span>
                <span className="text-lg sm:text-xl lg:text-2xl font-black text-zinc-900 dark:text-white mt-0.5 block leading-tight truncate">
                  {card.value}
                </span>
                <div className="mt-1 flex items-center leading-none">
                  <span className={`text-[11px] lg:text-xs font-bold flex items-center gap-0.5 shrink-0 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {card.isAbsoluteGrowth ? `${isPositive ? '+' : ''}${card.growth}` : `${Math.abs(card.growth)}%`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
