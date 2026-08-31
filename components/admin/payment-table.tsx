import React from 'react';
import { ArrowRight, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface PaymentTableProps {
  orders: any[];
}

export default function PaymentTable({ orders }: PaymentTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return {
          label: 'Confirmed',
          icon: <CheckCircle className="h-2.5 w-2.5" />,
          cls: 'text-emerald-300 bg-emerald-500/20 border-emerald-400/40'
        };
      case 'PENDING':
      case 'PAYMENT_PENDING':
        return {
          label: 'Pending',
          icon: <Clock className="h-2.5 w-2.5" />,
          cls: 'text-amber-300 bg-amber-500/20 border-amber-400/40'
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: <XCircle className="h-2.5 w-2.5" />,
          cls: 'text-zinc-400 bg-zinc-500/20 border-zinc-400/40'
        };
      default:
        return {
          label: 'Failed',
          icon: <AlertTriangle className="h-2.5 w-2.5" />,
          cls: 'text-rose-300 bg-rose-500/20 border-rose-400/40'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 rounded-[1.75rem] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col gap-1 mb-5">
        <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white tracking-tight">Transaction Logs</h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold">
          {orders.length} transaction records found matching the active filters.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-950/60 border-y border-zinc-100 dark:border-zinc-800/80 text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider select-none">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Passenger Details</th>
              <th className="py-3 px-4">Route Segment</th>
              <th className="py-3 px-4">Seats</th>
              <th className="py-3 px-4">Transaction Amount</th>
              <th className="py-3 px-4">Payment Status</th>
              <th className="py-3 px-4">Razorpay Identifiers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            {orders.length > 0 ? (
              orders.map((o: any) => {
                const badge = getStatusBadge(o.status);
                const formattedDate = new Date(o.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={o._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400 text-xs font-bold">
                      {formattedDate}
                    </td>

                    {/* Passenger */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-zinc-900 dark:text-white font-extrabold text-xs">
                          {o.passengerId?.name || 'Deleted User'}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold leading-none">
                          {o.passengerId?.email || 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Stops Segment */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span className="truncate max-w-[100px]" title={o.fromStop}>
                          {o.fromStop}
                        </span>
                        <ArrowRight className="h-3 w-3 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[100px]" title={o.toStop}>
                          {o.toStop}
                        </span>
                      </div>
                    </td>

                    {/* Seats */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {o.seatNumbers.map((seat: string, idx: number) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md font-bold text-[10px]"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-black text-sm text-zinc-900 dark:text-white">
                      ₹{o.amount.toLocaleString('en-IN')}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-xs ${badge.cls}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </td>

                    {/* Razorpay Identifiers */}
                    <td className="py-3.5 px-4 text-[10px] text-zinc-500 dark:text-zinc-400 select-all">
                      <div className="flex flex-col gap-1">
                        <div>
                          <span className="text-[8px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block leading-none font-bold mb-0.5">Order ID</span>
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">{o.razorpayOrderId || 'N/A'}</span>
                        </div>
                        {o.razorpayPaymentId && (
                          <div>
                            <span className="text-[8px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block leading-none font-bold mb-0.5">Payment ID</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{o.razorpayPaymentId}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-400 dark:text-zinc-500 font-semibold">
                  No transaction records match the active search and status filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

