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
          icon: <CheckCircle className="h-3 w-3" />,
          cls: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/50'
        };
      case 'PENDING':
      case 'PAYMENT_PENDING':
        return {
          label: 'Pending',
          icon: <Clock className="h-3 w-3" />,
          cls: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/50'
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: <XCircle className="h-3 w-3" />,
          cls: 'text-zinc-500 bg-zinc-50 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-455 dark:border-zinc-850'
        };
      default:
        return {
          label: 'Failed',
          icon: <AlertTriangle className="h-3 w-3" />,
          cls: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-900/50'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.015)]">
      <div className="flex flex-col gap-1 mb-6">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Transaction Logs</h3>
        <p className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold">
          {orders.length} transaction records found matching the active filters.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-450 dark:text-zinc-555 font-bold uppercase tracking-widest select-none">
              <th className="py-4 px-5">Date</th>
              <th className="py-4 px-5">Passenger Details</th>
              <th className="py-4 px-5">Stops Segment</th>
              <th className="py-4 px-5">Seats</th>
              <th className="py-4 px-5">Transaction Amount</th>
              <th className="py-4 px-5">Payment Status</th>
              <th className="py-4 px-5">Razorpay Identifiers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs font-bold text-zinc-800 dark:text-zinc-200">
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
                  <tr key={o._id} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-800/10 transition-colors">
                    {/* Date */}
                    <td className="py-4 px-5 whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
                      {formattedDate}
                    </td>

                    {/* Passenger */}
                    <td className="py-4 px-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-zinc-900 dark:text-white font-bold">
                          {o.passengerId?.name || 'Deleted User'}
                        </span>
                        <span className="text-[10px] text-zinc-455 dark:text-zinc-500 font-semibold leading-none">
                          {o.passengerId?.email || 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Stops Segment */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
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
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {o.seatNumbers.map((seat: string, idx: number) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-lg font-bold text-[10px]"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-5 whitespace-nowrap font-bold text-zinc-900 dark:text-white">
                      ₹{o.amount.toLocaleString('en-IN')}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${badge.cls}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </td>

                    {/* Razorpay Identifiers */}
                    <td className="py-4 px-5 font-mono text-[9px] text-zinc-500 dark:text-zinc-400 select-all">
                      <div className="flex flex-col gap-1">
                        <div>
                          <span className="text-[8px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600 block leading-none font-bold mb-0.5">Order ID</span>
                          <span className="font-semibold">{o.razorpayOrderId || 'N/A'}</span>
                        </div>
                        {o.razorpayPaymentId && (
                          <div>
                            <span className="text-[8px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600 block leading-none font-bold mb-0.5">Payment ID</span>
                            <span className="font-semibold text-indigo-500">{o.razorpayPaymentId}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-450 dark:text-zinc-555 font-semibold">
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
