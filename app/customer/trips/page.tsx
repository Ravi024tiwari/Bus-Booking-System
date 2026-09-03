'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch, fetchMyTrips, TripBooking } from '@/store';
import axios from 'axios';
import {
  Compass,
  Bus,
  Map,
  Star,
  Share2,
  AlertCircle,
  Armchair,
  ArrowRight,
  Clock4,
  Zap,
  XCircle,
  CheckCheck,
  X,
  MessageSquare
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { io } from 'socket.io-client';

type TabType = 'today' | 'upcoming' | 'history';

const TABS: { key: TabType; label: string }[] = [
  { key: 'today',    label: "Today" },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'history',  label: 'History' },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Poor (1/5)',
  2: 'Fair (2/5)',
  3: 'Good (3/5)',
  4: 'Very Good (4/5)',
  5: 'Outstanding Experience! (5/5)'
};

export default function MyTripsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  const list      = useSelector((s: RootState) => s.trips[activeTab]);
  const isLoading = useSelector((s: RootState) => s.trips.loading[activeTab]);
  const error     = useSelector((s: RootState) => s.trips.error);

  // Rating Modal States
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<TripBooking | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);

  useEffect(() => {
    dispatch(fetchMyTrips({ tab: activeTab }));
  }, [activeTab, dispatch]);

  // Real-time status update listener via Socket.io
  useEffect(() => {
    let socket: any;
    try {
      socket = io();
      socket.on('trip:status-updated', () => {
        dispatch(fetchMyTrips({ tab: activeTab }));
      });
    } catch (err) {
      console.warn('Socket connect failed on MyTripsPage:', err);
    }
    return () => {
      if (socket) socket.disconnect();
    };
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

  const handleOpenRatingModal = (item: TripBooking) => {
    setSelectedBooking(item);
    setSelectedRating(item.myRating || 5);
    setHoverRating(0);
    setRatingComment('');
    setRatingModalOpen(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedBooking) return;
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      toast.error('Please select a star rating between 1 and 5');
      return;
    }

    setIsSubmittingRating(true);
    try {
      const res = await axios.post('/api/reviews', {
        bookingId: selectedBooking.id,
        rating: selectedRating,
        comment: ratingComment.trim()
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Rating submitted successfully!');
        setRatingModalOpen(false);
        // Refresh active tab trips to reflect updated myRating and average
        dispatch(fetchMyTrips({ tab: activeTab }));
      } else {
        toast.error(res.data?.message || 'Failed to submit rating.');
      }
    } catch (err: any) {
      console.error('[Rating Submission Error]:', err);
      toast.error(err?.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setIsSubmittingRating(false);
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
              className="animate-pulse h-40 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl"
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

      {/* ── Trip cards with Shadcn UI Card System ─────────────────────── */}
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
            <Card
              key={item.id}
              className="border border-zinc-200/70 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-250 overflow-hidden flex flex-col justify-between py-0 gap-0"
            >
              {/* 1. CARD HEADER */}
              <CardHeader className="flex flex-row items-center justify-between p-3.5 sm:px-5 sm:py-3.5 border-b border-zinc-100 dark:border-zinc-800/60 gap-2.5 select-none">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 border border-zinc-200/50 dark:border-zinc-700/40">
                    <Bus className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CardTitle className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white leading-tight truncate">
                        TripGo Express
                      </CardTitle>
                      {/* Trip Average Verified Rating Badge */}
                      {trip.averageRating && trip.averageRating > 0 ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-600 dark:text-amber-400 font-bold text-[9px] sm:text-[10px] rounded-md leading-none shrink-0">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          {trip.averageRating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <CardDescription className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5 truncate">
                      {trip.busNumber} · {trip.busType}
                    </CardDescription>
                  </div>
                </div>

                <Badge variant="outline" className={`inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border shrink-0 ${sc.cls}`}>
                  {sc.icon} {sc.label}
                </Badge>
              </CardHeader>

              {/* 2. JOURNEY ROUTE & TIMELINE */}
              <CardContent className="p-3.5 sm:p-5 flex flex-col gap-3 sm:gap-4">
                
                {/* Desktop Horizontal Route View (sm+) */}
                <div className="hidden sm:flex items-center justify-between gap-4">
                  {/* From */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15 shrink-0 animate-pulse" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Origin</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.fromStop}</p>
                      <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{depDateStr} · {depTimeStr}</p>
                    </div>
                  </div>

                  {/* Mid Line */}
                  <div className="flex flex-col items-center px-3 shrink-0 select-none">
                    <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">Direct</p>
                    <div className="flex items-center gap-1.5 w-28">
                      <div className="h-[1.5px] flex-1 bg-gradient-to-r from-emerald-500 to-zinc-300 dark:to-zinc-700 rounded-full" />
                      <Bus className={`h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 ${trip.status === 'IN_TRANSIT' ? 'animate-bounce' : ''}`} />
                      <div className="h-[1.5px] flex-1 bg-gradient-to-r from-zinc-300 dark:from-zinc-700 to-[#ff2d88] rounded-full" />
                    </div>
                  </div>

                  {/* To */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end text-right">
                    <div className="min-w-0">
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Destination</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.toStop}</p>
                      <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Est. Arrival ~{arrTimeStr}</p>
                    </div>
                    <div className="h-2.5 w-2.5 rounded-full bg-[#ff2d88] ring-4 ring-[#ff2d88]/15 shrink-0" />
                  </div>
                </div>

                {/* Mobile Vertical Connected Timeline (xs only) */}
                <div className="flex sm:hidden flex-col select-none">
                  {/* Origin */}
                  <div className="flex items-start gap-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15 shrink-0 mt-1" />
                    <div className="min-w-0">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Boarding</span>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{item.fromStop}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">{depDateStr} · {depTimeStr}</p>
                    </div>
                  </div>

                  {/* Connecting Track Line */}
                  <div className="ml-1 my-0.5 pl-4 border-l border-dashed border-zinc-200 dark:border-zinc-700/80 py-1">
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-100/70 dark:bg-zinc-800/70 rounded text-[9px] text-zinc-500 dark:text-zinc-400 font-medium">
                      <Bus className="h-2.5 w-2.5" />
                      <span>Direct Route</span>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-start gap-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#ff2d88] ring-4 ring-[#ff2d88]/15 shrink-0 mt-1" />
                    <div className="min-w-0">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Dropping</span>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{item.toStop}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Est. Arrival ~{arrTimeStr}</p>
                    </div>
                  </div>
                </div>

                {/* Meta Details Row (Seat & Fare) */}
                <div className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800/70 rounded-xl p-2.5 sm:p-3 flex items-center justify-between text-xs select-none">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300">
                      <Armchair className="h-3 w-3" />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block leading-none">Seat</span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 block leading-none">{item.seatNumbers.join(', ')}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block leading-none">Fare</span>
                    <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mt-0.5 block leading-none">₹{item.amount}</span>
                  </div>
                </div>

              </CardContent>

              {/* 3. CARD ACTION FOOTER */}
              <CardFooter className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between p-3 sm:px-5 sm:py-3 bg-zinc-50/70 dark:bg-zinc-850/30 border-t border-zinc-100 dark:border-zinc-800/60 gap-2">
                
                {/* Share Tracking Link */}
                <button
                  onClick={() => handleShare(trip.id)}
                  title="Share live tracking link"
                  className="p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5 text-[11px] font-semibold shrink-0"
                >
                  <Share2 className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="xs:hidden">Share Tracking</span>
                </button>

                {/* Right Action Group */}
                <div className="flex flex-1 xs:flex-none items-center gap-2">
                  
                  {/* Verified Rating Button */}
                  {item.myRating ? (
                    <button
                      onClick={() => handleOpenRatingModal(item)}
                      title="Click to update your rating"
                      className="flex-1 xs:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-400/40 text-amber-600 dark:text-amber-300 font-bold text-[11px] sm:text-xs rounded-xl hover:bg-amber-500/20 transition-all cursor-pointer select-none"
                    >
                      <span className="text-[9px] sm:text-[10px] font-medium opacity-80 uppercase tracking-wider">Your Rating:</span>
                      <span className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400 font-bold">
                        {item.myRating}.0
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenRatingModal(item)}
                      className="flex-1 xs:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-zinc-950 font-bold text-[11px] sm:text-xs rounded-xl shadow-xs transition-all hover:scale-101 active:scale-98 cursor-pointer select-none"
                    >
                      Rate Trip <Star className="h-3 w-3 fill-zinc-950 text-zinc-950" />
                    </button>
                  )}

                  {/* Live Track Button for non-history tabs */}
                  {activeTab !== 'history' && (
                    <Link
                      href={canTrack ? `/customer/tracking?tripId=${trip.id}` : '#'}
                      onClick={(e) => {
                        if (!canTrack) {
                          e.preventDefault();
                          toast.info('Live tracking becomes active once the bus is boarding or departed.');
                        }
                      }}
                      className={`flex-1 xs:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 font-bold text-[11px] sm:text-xs rounded-xl transition-all ${
                        canTrack
                          ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white shadow-xs hover:opacity-90 active:scale-98'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {canTrack && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                      )}
                      Track Bus <Map className="h-3 w-3" />
                    </Link>
                  )}

                </div>

              </CardFooter>

            </Card>
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

      {/* ── INTERACTIVE RATING MODAL ─────────────────────────────────── */}
      {ratingModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-[360px] sm:max-w-md shadow-2xl relative overflow-hidden flex flex-col gap-3.5 sm:gap-4.5 max-h-[92vh] overflow-y-auto">
            
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />

            {/* Header & Close */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 sm:h-9 sm:w-9 bg-amber-400/10 border border-amber-400/30 rounded-xl flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white leading-tight">
                    {selectedBooking.myRating ? 'Update Your Rating' : 'Rate Your Trip'}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                    Verified Passenger Feedback
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setRatingModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Trip summary badge */}
            <div className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-2.5 sm:p-3 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between font-bold text-zinc-800 dark:text-zinc-200">
                <span className="truncate max-w-[200px] text-xs">{selectedBooking.fromStop} → {selectedBooking.toStop}</span>
                <span className="text-zinc-400 text-[10px] sm:text-[11px] font-medium shrink-0">{selectedBooking.tripDetails?.busNumber}</span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400">
                Seat {selectedBooking.seatNumbers.join(', ')} · ₹{selectedBooking.amount}
              </span>
            </div>

            {/* 5-STAR INTERACTIVE SELECTOR */}
            <div className="flex flex-col items-center justify-center gap-1.5 py-2.5 sm:py-3 bg-amber-50/40 dark:bg-amber-950/15 border border-amber-200/50 dark:border-amber-900/30 rounded-xl">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const isFilled = (hoverRating || selectedRating) >= starIndex;
                  return (
                    <button
                      key={starIndex}
                      type="button"
                      onMouseEnter={() => setHoverRating(starIndex)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(starIndex)}
                      className="p-1 transition-transform duration-150 hover:scale-115 active:scale-95 focus:outline-none cursor-pointer"
                    >
                      <Star 
                        className={`h-6 w-6 sm:h-7 sm:w-7 transition-colors duration-150 ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_2px_6px_rgba(251,191,36,0.45)]'
                            : 'text-zinc-300 dark:text-zinc-700'
                        }`} 
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic feedback text */}
              <span className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wide mt-0.5">
                {RATING_LABELS[hoverRating || selectedRating] || 'Select Rating'}
              </span>
            </div>

            {/* Optional Comment */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Optional Review Feedback:
              </label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="How was the journey, punctuality, cleanliness, staff?"
                rows={2}
                maxLength={400}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1.5 focus:ring-amber-400/40 resize-none font-medium leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRatingModalOpen(false)}
                className="flex-1 py-2 sm:py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-bold text-[11px] sm:text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitRating}
                disabled={isSubmittingRating}
                className="flex-1 py-2 sm:py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-zinc-950 font-bold text-[11px] sm:text-xs rounded-xl shadow-xs transition-all hover:scale-101 active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
              >
                {isSubmittingRating ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span>Submit Rating</span>
                    <Star className="h-3 w-3 fill-zinc-950 text-zinc-950" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

