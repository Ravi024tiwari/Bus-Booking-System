import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { RecentBooking } from '@/lib/admin-dashboard';

export default function AdminRecentBookings({ bookings }: { bookings: RecentBooking[] }) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'PENDING':
      case 'PAYMENT_PENDING':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'CANCELLED':
      case 'PAYMENT_FAILED':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'CONFIRMED') return 'Confirmed';
    if (status === 'PENDING' || status === 'PAYMENT_PENDING') return 'Pending';
    if (status === 'CANCELLED' || status === 'PAYMENT_FAILED') return 'Cancelled';
    return status;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[360px] group">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Recent Bookings</h3>
        <Link 
          href="/admin/bookings" 
          className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-0.5 hover:underline"
        >
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Bookings Table */}
      <div className="flex-1 overflow-x-auto mt-4 pr-1">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase select-none">
              <th className="pb-3 pl-1">PNR</th>
              <th className="pb-3">Passenger</th>
              <th className="pb-3">Route</th>
              <th className="pb-3">Date & Time</th>
              <th className="pb-3">Amount</th>
              <th className="pb-3 text-right pr-1">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100/50 dark:divide-zinc-800/30 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {bookings.map((booking) => {
              const dateFormatted = new Date(booking.departureTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
              const timeFormatted = new Date(booking.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              
              return (
                <tr 
                  key={booking.id} 
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors duration-150"
                >
                  <td className="py-3.5 pl-1 font-bold text-zinc-900 dark:text-white">
                    {booking.pnr}
                  </td>
                  <td className="py-3.5">
                    <span className="block font-bold text-zinc-800 dark:text-zinc-200">
                      {booking.passenger?.name || 'Guest Passenger'}
                    </span>
                  </td>
                  <td className="py-3.5 text-zinc-500 dark:text-zinc-400">
                    {booking.route}
                  </td>
                  <td className="py-3.5 text-zinc-500 dark:text-zinc-400">
                    <span className="block font-bold">{dateFormatted}</span>
                    <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">{timeFormatted}</span>
                  </td>
                  <td className="py-3.5 text-zinc-900 dark:text-white font-extrabold">
                    ₹{booking.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 text-right pr-1">
                    <span className={`inline-block px-2.5 py-1 border text-[10px] font-black rounded-full uppercase leading-none ${getStatusStyle(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800 shrink-0">
        <Link 
          href="/admin/bookings" 
          className="text-xs text-indigo-600 hover:text-indigo-700 font-extrabold flex items-center justify-center gap-1 group-hover:gap-1.5 transition-all duration-200"
        >
          View all bookings <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

    </div>
  );
}
