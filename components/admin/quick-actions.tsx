'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Bus, MapPin, Calendar, CreditCard, FileText, Bell, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminQuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'Add Operator',
      icon: UserPlus,
      path: '/admin/operators',
      color: 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100/80 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50',
    },
    {
      label: 'Add Bus',
      icon: Bus,
      path: '/admin/buses',
      color: 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50',
    },
    {
      label: 'Add Route',
      icon: MapPin,
      path: '/admin/routes',
      color: 'bg-amber-50 text-amber-500 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:hover:bg-amber-950/50',
    },
    {
      label: 'View Bookings',
      icon: Calendar,
      path: '/admin/bookings',
      color: 'bg-rose-50 text-rose-500 hover:bg-rose-100/80 dark:bg-rose-950/30 dark:hover:bg-rose-950/50',
    },
    {
      label: 'View Payments',
      icon: CreditCard,
      path: '/admin/payments',
      color: 'bg-teal-50 text-teal-500 hover:bg-teal-100/80 dark:bg-teal-950/30 dark:hover:bg-teal-950/50',
    },
    {
      label: 'Generate Report',
      icon: FileText,
      path: '/admin/analytics',
      color: 'bg-blue-50 text-blue-500 hover:bg-blue-100/80 dark:bg-blue-950/30 dark:hover:bg-blue-950/50',
    },
    {
      label: 'Send Notification',
      icon: Bell,
      path: '/admin/notifications',
      color: 'bg-violet-50 text-violet-500 hover:bg-violet-100/80 dark:bg-violet-950/30 dark:hover:bg-violet-950/50',
    },
    {
      label: 'System Settings',
      icon: Settings,
      path: '/admin/settings',
      color: 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/50 dark:text-zinc-300',
    },
  ];

  const handleActionClick = (act: typeof actions[0]) => {
    toast.success(`Opening ${act.label}`);
    router.push(act.path);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[360px] select-none">
      
      {/* Header */}
      <div className="pb-3 border-b border-zinc-150 dark:border-zinc-800">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Quick Actions</h3>
      </div>

      {/* Grid of Actions */}
      <div className="grid grid-cols-4 gap-3 flex-1 items-center py-4">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              onClick={() => handleActionClick(act)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 outline-none shrink-0 cursor-pointer h-20 ${act.color}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-black text-center mt-2 leading-tight block truncate max-w-full">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
