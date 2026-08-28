'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch, fetchMyTrips } from '@/store';
import {
  Compass,
  Bus,
  Map,
  Star,
  Share2,
  AlertCircle,
  Armchair,
  ArrowRight,
  CheckCircle2,
  Clock4,
  Zap,
  XCircle,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type TabType = 'today' | 'upcoming' | 'history';

const TABS: { key: TabType; label: string }[] = [
  { key: 'today',    label: "Today" },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'history',  label: 'History' },
];

export default function MyTripsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  const list      = useSelector((s: RootState) => s.trips[activeTab]);
  const isLoading = useSelector((s: RootState) => s.trips.loading[activeTab]);
  const error     = useSelector((s: RootState) => s.trips.error);

  useEffect(() => {
    dispatch(fetchMyTrips({ tab: activeTab }));
  }, [activeTab, dispatch]);

  /* ── helpers ──────────────────────────────────────────────────────── */
  const handleShare = async (tripId: string) => {
    const url = `${window.location.origin}/customer/tracking?tripId=${tripId}`;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Tracking link copied!');
      } catch (err) {
        toast.error('Failed to copy tracking link.');
      }
    } else {
      toast.error('Clipboard not supported on this device.');
    }
  };

  const statusCfg = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'BOARDING':
        return { label: 'Boarding', icon: <Zap className="h-3 w-3" />, cls: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20' };
      case 'DEPARTED':
      case 'IN_TRANSIT':
        return { label: status === 'DEPARTED' ? 'Departed' : 'In Transit', icon: <Bus className="h-3 w-3" />, cls: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'ARRIVED':
        return { label: 'Arrived', icon: <CheckCheck className="h-3 w-3" />, cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'CANCELLED':
        return { label: 'Cancelled', icon: <XCircle className="h-3 w-3" />, cls: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'SCHEDULED':
      default:
        return { label: 'Scheduled', icon: <Clock4 className="h-3 w-3" />, cls: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-50 dark:bg-zinc-950 min-h-0">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="mb-6 select-none">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          My Trips
          <Compass className="h-6 w-6 text-[#ff2d88]" />
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Live operations, schedules &amp; route tracking for your journeys.
        </p>
      </div>

      {/* ── Error banner ────────────────────────────────────────────── */}
      {error && (
        <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/70 rounded-2xl w-full sm:w-fit border border-zinc-200/40 dark:border-zinc-800/40 mb-6 select-none">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-250 ${
              activeTab === key
                ? 'bg-white dark:bg-zinc-950 text-violet-600 dark:text-violet-400 shadow-sm border border-zinc-200/20 dark:border-zinc-700/30'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Skeleton ────────────────────────────────────────────────── */}
      {isLoading && list.length === 0 && (
        <div className="flex flex-col gap-4 max-w-4xl">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse h-36 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl"
            />
          ))}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {!isLoading && list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl text-center select-none max-w-4xl">
          <span className="text-4xl mb-3">🚌</span>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100">
            {activeTab === 'today' ? 'No trips today'
              : activeTab === 'upcoming' ? 'No upcoming trips'
              : 'No trip history yet'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-1.5">
            {activeTab === 'today'
              ? 'You have no trips scheduled for today.'
              : activeTab === 'upcoming'
              ? 'No future trips found. Ready to explore a new route?'
              : 'Your completed journeys will appear here.'}
          </p>
          {activeTab !== 'history' && (
            <a
              href="/customer/book"
              className="mt-5 px-5 py-2.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white font-bold text-xs rounded-xl shadow hover:opacity-90 active:scale-95 transition-all"
            >
              Plan a Trip
            </a>
          )}
        </div>
      )}

      {/* ── Trip cards ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 max-w-4xl">
        {list.map((item) => {
          const trip = item.tripDetails;
          if (!trip) return null;

          const depDate = new Date(trip.departureTime);
          const arrDate = new Date(trip.arrivalTime);
          const depDateStr = depDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          const depTimeStr = depDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          const arrTimeStr = arrDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

          const canTrack = activeTab === 'today'
            || trip.status === 'IN_TRANSIT'
            || trip.status === 'DEPARTED'
            || trip.status === 'BOARDING';

          const sc = statusCfg(trip.status);

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[1.75rem] shadow-[0_12px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 overflow-hidden"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3.5 sm:px-5 border-b border-zinc-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                    <Bus className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 leading-none">
                      TripGo Express
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {trip.busNumber} · {trip.busType}
                    </p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${sc.cls}`}>
                  {sc.icon} {sc.label}
                </span>
              </div>

              {/* Route timeline */}
              <div className="px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">

                {/* From */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10 shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">From</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.fromStop}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{depDateStr} · {depTimeStr}</p>
                  </div>
                </div>

                {/* Mid line — visible on sm+ */}
                <div className="hidden sm:flex flex-col items-center px-4 shrink-0 select-none">
                  <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">Route</p>
                  <div className="flex items-center gap-1.5 w-28">
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-emerald-500 to-zinc-200 dark:to-zinc-800 rounded-full" />
                    <Bus className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0 ${trip.status === 'IN_TRANSIT' ? 'animate-bounce' : ''}`} />
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-zinc-200 dark:from-zinc-800 to-[#ff2d88] rounded-full" />
                  </div>
                </div>

                {/* Mobile arrow */}
                <div className="flex sm:hidden items-center gap-2 ml-5">
                  <div className="h-px w-5 bg-zinc-200 dark:bg-zinc-700" />
                  <ArrowRight className="h-3 w-3 text-zinc-400" />
                </div>

                {/* To */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0 sm:justify-end">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff2d88] ring-4 ring-[#ff2d88]/10 shrink-0 sm:order-2" />
                  <div className="min-w-0 sm:text-right">
                    <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">To</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.toStop}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Arr. ~{arrTimeStr}</p>
                  </div>
                </div>

              </div>

              {/* Card footer */}
              <div className="flex items-center justify-between px-4 py-3 sm:px-5 bg-zinc-50 dark:bg-zinc-800/10 border-t border-zinc-100 dark:border-zinc-800/50 gap-3">

                <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <Armchair className="h-3.5 w-3.5" />
                  <span className="font-semibold">
                    {item.seatNumbers.join(', ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShare(trip.id)}
                    title="Share live tracking link"
                    className="p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-500 dark:text-zinc-300 transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>

                  {activeTab === 'history' ? (
                    <button
                      onClick={() => toast.success(`Review form for trip ${trip.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-[11px] rounded-xl transition-all"
                    >
                      Rate <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    </button>
                  ) : (
                    <Link
                      href={canTrack ? `/customer/tracking?tripId=${trip.id}` : '#'}
                      onClick={(e) => {
                        if (!canTrack) {
                          e.preventDefault();
                          toast.info('Live tracking becomes active once the bus is boarding or departed.');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 font-bold text-[11px] rounded-xl transition-all ${
                        canTrack
                          ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white shadow hover:opacity-90 active:scale-95'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {canTrack && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                      Track Bus <Map className="h-3 w-3" />
                    </Link>
                  )}
                </div>

              </div>
            </div>
          );
        })}

        {/* Skeleton while loading next batch */}
        {isLoading && list.length > 0 && (
          <div className="flex flex-col gap-4 mt-1">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse h-36 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl"
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
