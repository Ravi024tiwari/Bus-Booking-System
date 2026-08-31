import React from 'react';

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* Total Revenue */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 rounded-[1.75rem] p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">Total Revenue</span>
        <span className="text-2xl font-black text-zinc-900 dark:text-white mt-1.5 block">
          ₹{totalRevenue.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Pending Collections */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 rounded-[1.75rem] p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">Pending Collections</span>
        <span className="text-2xl font-black text-zinc-900 dark:text-white mt-1.5 block">
          ₹{totalPending.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Successful Bookings */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 rounded-[1.75rem] p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Successful Bookings</span>
        <span className="text-2xl font-black text-zinc-900 dark:text-white mt-1.5 block">
          {totalSuccessfulCount} <span className="text-[11px] font-semibold text-zinc-400">payments</span>
        </span>
      </div>

      {/* Failed Transactions */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 rounded-[1.75rem] p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">Failed Transactions</span>
        <span className="text-2xl font-black text-zinc-900 dark:text-white mt-1.5 block">
          {totalFailedCount} <span className="text-[11px] font-semibold text-zinc-400">failures</span>
        </span>
      </div>
    </div>
  );
}
