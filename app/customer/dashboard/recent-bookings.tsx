'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function RecentBookingsList() {
  const bookings = useSelector((state: RootState) => state.bookings.list);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Recent Bookings</h3>
        <Link 
          href="/customer/dashboard/bookings" 
          className="text-xs font-bold text-violet-600 hover:text-violet-700"
        >
          View All
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {bookings.map((booking) => (
          <div 
            key={booking.id}
            className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors duration-200 group cursor-pointer"
          >
            {/* Route & Date */}
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-violet-500/10 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 font-extrabold rounded-xl flex items-center justify-center text-xs shrink-0 select-none">
                TG
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5 leading-none">
                  {booking.source} <span className="text-zinc-400 font-medium">→</span> {booking.destination}
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold mt-1.5 block leading-none">
                  {booking.date} • {booking.time}
                </span>
              </div>
            </div>

            {/* Price & Status */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-black text-zinc-900 dark:text-white leading-none">
                  ₹{booking.fare}
                </span>
                <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 uppercase tracking-wide self-end">
                  {booking.status}
                </span>
              </div>
              <ChevronRight className="h-4.5 w-4.5 text-zinc-400 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
