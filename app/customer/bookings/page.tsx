'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch, fetchMyBookings } from '@/store';
import {
  Receipt,
  Download,
  ArrowRight,
  Calendar,
  Armchair,
  AlertCircle,
  CheckCircle2,
  Clock4,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MyBookingsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const bookings  = useSelector((s: RootState) => s.bookings.list);
  const isLoading = useSelector((s: RootState) => s.bookings.loading);
  const error     = useSelector((s: RootState) => s.bookings.error);
  const page      = useSelector((s: RootState) => s.bookings.page);
  const hasMore   = useSelector((s: RootState) => s.bookings.hasMore);

  useEffect(() => {
    dispatch(fetchMyBookings({ page: 1, limit: 10 }));
  }, [dispatch]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      dispatch(fetchMyBookings({ page: page + 1, limit: 10 }));
    }
  };

  /* ── helpers ─────────────────────────────────────────────────────── */
  const statusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return {
          label: 'Confirmed',
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          bar: 'from-emerald-400 to-emerald-600',
        };
      case 'PENDING':
      case 'PAYMENT_PENDING':
        return {
          label: 'Payment Pending',
          icon: <Clock4 className="h-3.5 w-3.5" />,
          cls: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
          bar: 'from-[#ff7c52] to-[#ff2d88]',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: <XCircle className="h-3.5 w-3.5" />,
          cls: 'text-zinc-500 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800/60 border-zinc-300/30',
          bar: 'from-zinc-400 to-zinc-500',
        };
      default:
        return {
          label: 'Failed',
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
          cls: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
          bar: 'from-rose-400 to-rose-600',
        };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-50 dark:bg-zinc-950 min-h-0">

      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="mb-6 select-none">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          My Bookings
          <Receipt className="h-6 w-6 text-[#ff2d88]" />
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Receipts, invoices &amp; payment records for all your trips.
        </p>
      </div>

      {/* ── Error banner ───────────────────────────────────────────── */}
      {error && (
        <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Skeleton ───────────────────────────────────────────────── */}
      {isLoading && bookings.length === 0 && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse h-28 sm:h-24 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl"
            />
          ))}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {!isLoading && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl text-center select-none">
          <span className="text-4xl mb-3">🎫</span>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100">No bookings yet</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-1.5">
            You haven't made any bus bookings. Find routes and book your first ticket!
          </p>
          <a
            href="/customer/book"
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white font-bold text-xs rounded-xl shadow hover:opacity-90 active:scale-95 transition-all"
          >
            Book a Ticket
          </a>
        </div>
      )}

      {/* ── Booking cards ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 max-w-4xl">
        {bookings.map((booking) => {
          const cfg = statusConfig(booking.status);
          const bookedDate = booking.createdAt
            ? new Date(booking.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })
            : (booking.date ?? 'N/A');
          const seatList = booking.seatNumbers?.join(', ') ?? booking.seat ?? '—';
          const from = booking.fromStop ?? booking.source ?? '—';
          const to   = booking.toStop   ?? booking.destination ?? '—';
          const pnrDisplay = booking.pnr ?? (booking.razorpayOrderId ?? booking.id.slice(0, 10).toUpperCase());
          const amount = booking.amount ?? booking.fare;

          return (
            <div
              key={booking.id}
              className="relative bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Status colour strip */}
              <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${cfg.bar}`} />

              <div className="pl-4 pr-4 py-4 sm:pl-5 sm:pr-5 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4">

                {/* ── Left: route + meta ─────────────────────────── */}
                <div className="flex-1 min-w-0">

                  {/* PNR + status row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md tracking-wider">
                      {pnrDisplay}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-white truncate">
                    <span className="truncate">{from}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{to}</span>
                  </div>

                  {/* Meta chips */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {bookedDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Armchair className="h-3 w-3" /> Seat {seatList}
                    </span>
                  </div>
                </div>

                {/* ── Right: fare + actions ──────────────────────── */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 sm:shrink-0 sm:pl-4 sm:border-l sm:border-zinc-100 sm:dark:border-zinc-800">
                  <div className="text-right">
                    <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider leading-none">
                      Fare Paid
                    </p>
                    <p className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5 leading-none">
                      ₹{amount}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toast.success(`Invoice for ${pnrDisplay} downloaded`)}
                      title="Download Invoice"
                      className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-500 dark:text-zinc-300 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toast.success(`Viewing receipt: ${pnrDisplay}`)}
                      className="px-3.5 py-2 bg-[#0e0a30] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-[11px] rounded-xl hover:opacity-90 active:scale-95 transition-all"
                    >
                      Receipt
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })}

        {/* ── Load-more skeleton rows while fetching next page ─────── */}
        {isLoading && bookings.length > 0 && (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse h-20 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl"
              />
            ))}
          </div>
        )}

        {/* ── Load more button ──────────────────────────────────────── */}
        {hasMore && bookings.length > 0 && !isLoading && (
          <div className="flex justify-center pt-2 select-none">
            <button
              onClick={loadMore}
              className="px-6 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
