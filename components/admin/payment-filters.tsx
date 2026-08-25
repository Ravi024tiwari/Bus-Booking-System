import React from 'react';
import { Search } from 'lucide-react';

interface PaymentFiltersProps {
  search?: string;
  status?: string;
}

export default function PaymentFilters({ search, status }: PaymentFiltersProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex items-center justify-between">
      <form action="/admin/payments" method="GET" className="flex flex-col md:flex-row items-center gap-3 w-full">
        {/* Search bar */}
        <div className="flex items-center gap-3 bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200/20 dark:border-zinc-800/40 px-4 py-2.5 rounded-2xl w-full md:max-w-md focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-300">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input 
            type="text" 
            name="search"
            placeholder="Search passenger, stops or Razorpay ID..."
            defaultValue={search || ''}
            className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-700 dark:text-zinc-200 placeholder-zinc-400"
          />
        </div>
        
        {/* Status dropdown */}
        <select 
          name="status"
          defaultValue={status || ''}
          className="w-full md:w-auto bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200/20 dark:border-zinc-800/40 px-4 py-2.5 rounded-2xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PAYMENT_PENDING">Payment Pending</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="PAYMENT_FAILED">Failed</option>
        </select>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button 
            type="submit"
            className="flex-1 md:flex-none px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-2xl shadow-md transition-colors cursor-pointer"
          >
            Apply Filter
          </button>
          
          {(search || status) && (
            <a 
              href="/admin/payments"
              className="flex-1 md:flex-none px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-2xl transition-colors text-center cursor-pointer border border-zinc-200/50 dark:border-zinc-800/55"
            >
              Clear
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
