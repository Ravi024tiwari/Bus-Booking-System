import React from 'react';
import { Users, UserCheck, Clock, UserX, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { OperatorKPIs } from '@/lib/admin-operators';

export default function OperatorKPIsWidget({ kpis }: { kpis: OperatorKPIs }) {
  const cards = [
    {
      title: 'Total Operators',
      value: kpis.total,
      growth: kpis.totalGrowth,
      growthText: 'this month',
      isAbsoluteGrowth: true,
      icon: Users,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/30',
      iconColor: 'text-indigo-500',
    },
    {
      title: 'Active Operators',
      value: kpis.active,
      growth: kpis.activeGrowth,
      growthText: 'from last month',
      icon: UserCheck,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-500',
    },
    {
      title: 'Pending Approval',
      value: kpis.pending,
      growth: kpis.pendingGrowth,
      growthText: 'from last month',
      icon: Clock,
      iconBg: 'bg-amber-50 dark:bg-amber-950/30',
      iconColor: 'text-amber-500',
    },
    {
      title: 'Suspended',
      value: kpis.suspended,
      growth: kpis.suspendedGrowth,
      growthText: 'from last month',
      icon: UserX,
      iconBg: 'bg-rose-50 dark:bg-rose-950/30',
      iconColor: 'text-rose-500',
    },
  ];

  return (
    <div className="w-full">
      {/* Mobile Scroll Indicator */}
      <div className="flex items-center justify-between sm:hidden mb-2.5 px-1 select-none">
        <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Operator Stats
        </span>
        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
          Scroll to view all <ArrowRight className="w-3 h-3 animate-bounce-x" />
        </span>
      </div>

      {/* KPI Cards Container: strictly compact, non-stretching horizontal row */}
      <div className="flex overflow-x-auto sm:overflow-x-visible no-scrollbar flex-nowrap gap-3 sm:gap-4 pb-2 sm:pb-0 pt-0.5 px-1 -mx-1 snap-x snap-mandatory sm:snap-none w-full sm:w-auto">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const isPositive = card.growth >= 0;
          return (
            <div
              key={idx}
              className="w-[165px] sm:w-[195px] shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group select-none"
            >
              <div className={`h-10 w-10 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5`}>
                <Icon className="h-5 w-5" />
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="text-zinc-400 dark:text-zinc-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block truncate">
                  {card.title}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5 block leading-none truncate">
                  {card.value}
                </span>
                <div className="mt-1 flex items-center leading-none">
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 shrink-0 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {card.isAbsoluteGrowth ? `${isPositive ? '+' : ''}${card.growth}` : `${isPositive ? '+' : ''}${card.growth}%`}
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
