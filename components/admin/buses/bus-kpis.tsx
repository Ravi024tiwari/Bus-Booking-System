import React from 'react';
import { Bus, CheckCircle2, Wrench, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';
import { BusKPIs } from '@/lib/admin-buses';

export default function BusKPIsWidget({ kpis }: { kpis: BusKPIs }) {
  const cards = [
    {
      title: 'Total Buses',
      value: kpis.total,
      growth: kpis.totalGrowth,
      growthText: 'from last month',
      icon: Bus,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/30',
      iconColor: 'text-indigo-500',
    },
    {
      title: 'Active Buses',
      value: kpis.active,
      growth: kpis.activeGrowth,
      growthText: 'from last month',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-500',
    },
    {
      title: 'In Maintenance',
      value: kpis.maintenance,
      growth: kpis.maintenanceGrowth,
      growthText: 'from last month',
      icon: Wrench,
      iconBg: 'bg-amber-50 dark:bg-amber-950/30',
      iconColor: 'text-amber-500',
    },
    {
      title: 'Inactive Buses',
      value: kpis.inactive,
      growth: kpis.inactiveGrowth,
      growthText: 'from last month',
      icon: ShieldAlert,
      iconBg: 'bg-rose-50 dark:bg-rose-950/30',
      iconColor: 'text-rose-500',
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
            className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.2rem] p-6 flex items-center gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_15px_35px_rgba(99,102,241,0.04)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group select-none"
          >
            <div className={`h-14 w-14 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-102`}>
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
                  {isPositive ? '+' : ''}{card.growth}%
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
