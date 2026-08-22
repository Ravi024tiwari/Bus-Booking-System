'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight, BellRing } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAlertsNotifications() {
  const alerts = [
    { id: '1', message: 'High number of cancellations today', severity: 'High' },
    { id: '2', message: 'Bus MP 09 XY 1234 is under maintenance', severity: 'Medium' },
    { id: '3', message: 'Operator documents pending verification', severity: 'Medium' },
    { id: '4', message: 'New refund request received', severity: 'Low' },
    { id: '5', message: 'Server backup completed successfully', severity: 'Low' }
  ];

  const getSeverityStyle = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'high':
        return 'text-rose-500 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30';
      case 'medium':
        return 'text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30';
      case 'low':
        return 'text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30';
      default:
        return 'text-zinc-500 bg-zinc-50 border-zinc-100 dark:bg-zinc-950/20 dark:border-zinc-900/30';
    }
  };

  const handleAlertClick = (msg: string) => {
    toast.info(`Viewing details: "${msg}"`);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[360px] group select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-2">
          <BellRing className="h-4.5 w-4.5 text-indigo-500 animate-swing" />
          Alerts & Notifications
        </h3>
        <Link 
          href="/admin/notifications" 
          className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-0.5 hover:underline"
        >
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Alert Listings */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            onClick={() => handleAlertClick(alert.message)}
            className="flex items-center justify-between p-3 border border-zinc-100/50 dark:border-zinc-800/40 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <AlertCircle className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate leading-none">
                {alert.message}
              </span>
            </div>
            
            <span className={`px-2.5 py-1 border text-[9px] font-black rounded-md uppercase shrink-0 leading-none ${getSeverityStyle(alert.severity)}`}>
              {alert.severity}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800">
        <Link 
          href="/admin/notifications" 
          className="text-xs text-indigo-600 hover:text-indigo-700 font-extrabold flex items-center justify-center gap-1 group-hover:gap-1.5 transition-all duration-200"
        >
          View all alerts <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

    </div>
  );
}
