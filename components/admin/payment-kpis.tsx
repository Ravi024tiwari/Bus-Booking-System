import React from 'react';
import { ArrowRight, IndianRupee, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface PaymentKPIsProps {
  totalRevenue: number;
  totalPending: number;
  totalSuccessfulCount: number;
  totalFailedCount: number;
}

export default function PaymentKPIs({
  totalRevenue,
  totalPending,
  totalSuccessfulCount,
  totalFailedCount,
}: PaymentKPIsProps) {
  return (
    <div className="w-full select-none">
      {/* Mobile Scroll Indicator */}
      <div className="flex items-center justify-between sm:hidden mb-2 px-1 select-none">
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Financial Metrics
        </span>
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          Scroll to view all <ArrowRight className="w-3 h-3 animate-bounce-x" />
        </span>
      </div>

      {/* KPI Cards Container: strictly compact, non-stretching horizontal row */}
      <div className="flex overflow-x-auto sm:overflow-x-visible no-scrollbar flex-nowrap gap-3 sm:gap-4 pb-2 sm:pb-0 pt-0.5 px-1 -mx-1 snap-x snap-mandatory sm:snap-none w-full sm:w-auto">
        
        {/* Total Revenue */}
        <div className="w-[165px] sm:w-[195px] shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block truncate">Total Revenue</span>
            <span className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5 block leading-none truncate">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Pending Collections */}
        <div className="w-[165px] sm:w-[195px] shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-105 transition-transform">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider block truncate">Pending Amount</span>
            <span className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5 block leading-none truncate">
              ₹{totalPending.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Successful Bookings */}
        <div className="w-[165px] sm:w-[195px] shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block truncate">Paid Bookings</span>
            <span className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5 block leading-none truncate">
              {totalSuccessfulCount} <span className="text-[10px] font-normal text-zinc-400">paid</span>
            </span>
          </div>
        </div>

        {/* Failed Transactions */}
        <div className="w-[165px] sm:w-[195px] shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20 group-hover:scale-105 transition-transform">
            <XCircle className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider block truncate">Failed Txns</span>
            <span className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5 block leading-none truncate">
              {totalFailedCount} <span className="text-[10px] font-normal text-zinc-400">failed</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
