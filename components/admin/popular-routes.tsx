import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PopularRoute } from '@/lib/admin-dashboard';

export default function AdminPopularRoutes({ routes }: { routes: PopularRoute[] }) {
  // Find maximum bookings to use as 100% scale basis
  const maxBookings = routes.reduce((max, r) => r.bookings > max ? r.bookings : max, 1);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[360px] group">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Popular Routes</h3>
        <Link 
          href="/admin/routes" 
          className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-0.5 hover:underline"
        >
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Routes List */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-3.5">
        {routes.map((route, idx) => {
          const percentage = Math.max(10, Math.round((route.bookings / maxBookings) * 100));
          return (
            <div key={idx} className="flex flex-col gap-1.5 select-none">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-700 dark:text-zinc-300">
                  {route.route}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {route.bookings}
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${percentage}%` }}
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
