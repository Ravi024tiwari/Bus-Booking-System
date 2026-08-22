import React from 'react';
import Link from 'next/link';
import { UserPlus, Bus, CheckCircle2, XCircle, Star, ChevronRight, Activity } from 'lucide-react';
import { RecentActivity } from '@/lib/admin-dashboard';

export default function AdminRecentActivity({ activities }: { activities: RecentActivity[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'operator_registration':
        return { icon: UserPlus, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' };
      case 'bus_approval':
        return { icon: Bus, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' };
      case 'booking_confirmed':
        return { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' };
      case 'booking_cancelled':
        return { icon: XCircle, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' };
      case 'review_submitted':
        return { icon: Star, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/30' };
      default:
        return { icon: Activity, color: 'text-zinc-500 bg-zinc-50 dark:bg-zinc-950/30' };
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[360px] group">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-1.5">
          <Activity className="h-4.5 w-4.5 text-indigo-500" />
          Recent Activity
        </h3>
      </div>

      {/* Activities Timeline */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-4">
        {activities.map((act) => {
          const { icon: Icon, color } = getIcon(act.type);
          return (
            <div key={act.id} className="flex gap-3 text-xs leading-relaxed select-none">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  {act.message}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                  {act.timeAgo}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800">
        <Link 
          href="/admin/analytics" 
          className="text-xs text-indigo-600 hover:text-indigo-700 font-extrabold flex items-center justify-center gap-1 group-hover:gap-1.5 transition-all duration-200"
        >
          View full activity log <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

    </div>
  );
}
