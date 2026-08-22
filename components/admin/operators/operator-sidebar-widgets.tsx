import React from 'react';
import Link from 'next/link';
import { Award, HelpCircle, BookOpen, MessageSquare, ChevronRight } from 'lucide-react';
import { OperatorKPIs } from '@/lib/admin-operators';

export default function OperatorSidebarWidgets({ kpis }: { kpis: OperatorKPIs }) {
  const formatRevenue = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Operators widget */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between group select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
            <Award className="h-4 w-4 text-indigo-500" />
            Top Operators by Revenue
          </h3>
          <Link 
            href="/admin/analytics" 
            className="text-[10px] text-indigo-600 hover:text-indigo-700 font-extrabold hover:underline"
          >
            View All
          </Link>
        </div>

        {/* Operators List */}
        <div className="flex flex-col gap-3.5 mt-4">
          {kpis.topOperators.map((op, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] flex items-center justify-center">
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

      {/* Need Help card widget */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col gap-4 select-none">
        <div>
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
            <HelpCircle className="h-4.5 w-4.5 text-indigo-500" />
            Need Help?
          </h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold mt-2.5 leading-relaxed">
            If you need any help managing operators, reviewing document submissions, or resolving disputes, feel free to inspect our resources.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link 
            href="/admin/support?docs=operators"
            className="flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800/50 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors text-xs font-bold text-zinc-700 dark:text-zinc-300"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500 shrink-0" />
              Operators Guide
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          </Link>
          <Link 
            href="/admin/support"
            className="flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800/50 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors text-xs font-bold text-zinc-700 dark:text-zinc-300"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500 shrink-0" />
              Contact Support
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          </Link>
        </div>
      </div>

    </div>
  );
}
