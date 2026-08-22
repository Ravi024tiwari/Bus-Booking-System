import React from 'react';
import Link from 'next/link';
import { UserCheck, Bus, FileText, ChevronRight } from 'lucide-react';
import { PendingApprovals } from '@/lib/admin-dashboard';

export default function AdminPendingApprovals({ approvals }: { approvals: PendingApprovals }) {
  const items = [
    {
      name: 'Operator Registrations',
      count: approvals.operatorRegistrations,
      icon: UserCheck,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
    },
    {
      name: 'Bus Approvals',
      count: approvals.busApprovals,
      icon: Bus,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      name: 'Document Verifications',
      count: approvals.documentVerifications,
      icon: FileText,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
    },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[360px] group">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Pending Approvals</h3>
        <Link 
          href="/admin/operators" 
          className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-0.5 hover:underline"
        >
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* List items */}
      <div className="flex-1 flex flex-col justify-center gap-4 py-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx}
              className="flex items-center justify-between p-3 border border-zinc-100/50 dark:border-zinc-800/40 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {item.name}
                </span>
              </div>
              <span className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-black text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
                {item.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800">
        <Link 
          href="/admin/operators?status=PENDING" 
          className="text-xs text-indigo-600 hover:text-indigo-700 font-extrabold flex items-center justify-center gap-1 group-hover:gap-1.5 transition-all duration-200 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 py-2.5 rounded-xl text-center w-full"
        >
          Review Approvals <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

    </div>
  );
}
