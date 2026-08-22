import React from 'react';
import Link from 'next/link';
import { ChevronRight, Award } from 'lucide-react';
import { TopOperator } from '@/lib/admin-dashboard';

export default function AdminTopOperators({ operators }: { operators: TopOperator[] }) {
  const formatRevenue = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[360px] group">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-1.5">
          <Award className="h-4.5 w-4.5 text-indigo-500" />
          Top Operators
        </h3>
        <Link 
          href="/admin/operators" 
          className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-0.5 hover:underline"
        >
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Operators List */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-3">
        {operators.map((op, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between p-2.5 border border-zinc-100/50 dark:border-zinc-800/40 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center">
                #{idx + 1}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-none">
                  {op.name}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-1 leading-none">
                  {op.bookings} bookings
                </span>
              </div>
            </div>
            
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
              {formatRevenue(op.revenue)}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
