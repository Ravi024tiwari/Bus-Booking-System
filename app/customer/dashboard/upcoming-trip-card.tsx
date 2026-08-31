'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Clock, 
  Compass, 
  ArrowRight
} from 'lucide-react';

export default function UpcomingTripCard() {
  const { nextTrip, loading, lastFetched } = useSelector((state: RootState) => state.customerDashboard);

  if (loading && !lastFetched) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
        <div className="h-36 bg-zinc-100 dark:bg-zinc-800/40 rounded-[2.2rem]" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
      <div className="flex items-center justify-between select-none">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Upcoming Trips</h3>
        <Link
          href="/customer/trips"
          className="text-xs font-bold text-violet-600 hover:text-violet-700"
        >
          View All
        </Link>
      </div>

      {!nextTrip ? (
        /* Empty State when user has no upcoming trip */
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.2rem] text-center select-none">
          <div className="h-12 w-12 bg-pink-500/10 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 rounded-2xl flex items-center justify-center mb-3">
            <Compass className="h-6 w-6" />
          </div>
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            No upcoming journeys scheduled
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[280px]">
            Ready for your next trip? Find top routes and reserve your preferred seats in seconds.
          </span>
          <Link
            href="/customer/book"
            className="mt-4 px-5 py-2.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white text-xs font-extrabold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
          >
            Explore & Book Buses
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        /* Real Upcoming Trip Card */
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-6 p-4 border border-zinc-100 dark:border-zinc-800/50 rounded-[2.2rem] hover:shadow-md transition-shadow duration-300 relative overflow-hidden">
            {/* Bus image illustration */}
            <div className="relative w-full md:w-[180px] h-[130px] rounded-2xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 select-none">
              <Image
                src={nextTrip.busImage || '/images/bus-hero.jpg'}
                alt={nextTrip.busNumber || 'Bus Trip'}
                fill
                sizes="(max-width: 768px) 100vw, 180px"
                className="object-cover"
                loading="lazy"
              />
            </div>

            {/* Central Information */}
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 uppercase tracking-wide">
                    {nextTrip.status === 'SCHEDULED' ? 'CONFIRMED' : nextTrip.status}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                    {nextTrip.busNumber}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-lg font-black text-zinc-900 dark:text-white mt-1.5 leading-none">
                  <span>{nextTrip.source}</span>
                  <span className="text-zinc-400 font-bold">→</span>
                  <span>{nextTrip.destination}</span>
                </div>

                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-2.5 flex items-center gap-1.5 leading-none">
                  <Clock className="h-3 w-3 text-indigo-500" />
                  <span>{nextTrip.date} • {nextTrip.time}</span>
                </div>

                {/* Route points info */}
                <div className="flex flex-col gap-1.5 mt-3 text-xs text-zinc-600 dark:text-zinc-400 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{nextTrip.fromStop}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff2d88] shrink-0" />
                    <span className="truncate">{nextTrip.toStop}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PNR Block & View / Track button */}
            <div className="flex flex-col md:text-right justify-between py-1 shrink-0 md:border-l border-zinc-100 dark:border-zinc-800 md:pl-6 md:w-[160px]">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider leading-none">
                  PNR Number
                </span>
                <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 mt-2 block leading-none select-all font-mono">
                  {nextTrip.pnr}
                </span>
              </div>

              <div className="flex flex-col gap-2 mt-4 md:mt-0">
                <Link
                  href={`/customer/tracking?tripId=${nextTrip.id}`}
                  className="py-2 px-3 w-full bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all duration-200 text-center"
                >
                  Track Live Bus
                </Link>
                <Link
                  href="/customer/bookings"
                  className="py-1.5 px-3 w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] rounded-xl transition-all duration-200 text-center"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom mini details bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none">
            <div>
              <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Bus Operator</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-1 block truncate">
                {nextTrip.operatorName}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Seat</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-1 block truncate">
                {nextTrip.seatsFormatted}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Bus Type</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-1 block truncate">
                {nextTrip.busType}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Fare</span>
              <span className="font-bold text-zinc-900 dark:text-white mt-1 block">
                ₹{nextTrip.amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
