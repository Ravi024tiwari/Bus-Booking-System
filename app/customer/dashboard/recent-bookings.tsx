'use client';

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, fetchMyBookings } from '@/store';
import { ChevronRight, Ticket } from 'lucide-react';
import Link from 'next/link';

export default function RecentBookingsList() {
  const dispatch = useDispatch<AppDispatch>();
  const bookings = useSelector((state: RootState) => state.bookings.list);
  const isLoading = useSelector((state: RootState) => state.bookings.loading);

  useEffect(() => {
    dispatch(fetchMyBookings({ page: 1, limit: 3 }));
  }, [dispatch]);

  // Only take the first 3 bookings for dashboard preview
  const displayBookings = bookings.slice(0, 3);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white select-none">Recent Bookings</h3>
        <Link 
          href="/customer/bookings" 
          className="text-xs font-bold text-violet-600 hover:text-violet-700"
        >
          View All
        </Link>
      </div>

      {isLoading && displayBookings.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <div 
              key={n}
              className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl animate-pulse select-none"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl shrink-0" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : displayBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center select-none">
          <div className="h-12 w-12 bg-violet-500/10 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 rounded-2xl flex items-center justify-center mb-3">
            <Ticket className="h-6 w-6 animate-pulse" />
          </div>
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            No bookings found
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[220px]">
            You haven't booked any trips yet. Start planning your next trip!
          </span>
          <Link
            href="/customer/book"
            className="mt-4 px-4 py-2 bg-linear-to-r from-[#ff7c52] to-[#ff2d88] text-white text-[11px] font-extrabold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all duration-200"
          >
            Book a Trip
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayBookings.map((booking) => (
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
      )}
    </div>
  );
}
