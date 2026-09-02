"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  Bus as BusIcon, 
  User as UserIcon, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  passenger: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
  trip: {
    id: string;
    source: string;
    destination: string;
    date: string;
    departureTime: string;
    arrivalTime: string;
    fare: number;
    busNumber: string;
    busType: string;
    status: string;
  } | null;
  bus: {
    id: string;
    busNumber: string;
    type: string;
    image: string;
  } | null;
  booking: {
    seatNumbers: string[];
    amount: number;
  } | null;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingCounts: Record<number, number>;
  positivePercentage: number;
}

interface ReviewsClientProps {
  initialReviews: ReviewItem[];
  initialStats: ReviewStats;
  buses: { id: string; busNumber: string; type: string }[];
}

export default function ReviewsClient({ initialReviews, initialStats, buses }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [stats, setStats] = useState<ReviewStats>(initialStats);
  const [refreshing, setRefreshing] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [selectedBus, setSelectedBus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refresh reviews from API
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/operator/reviews', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setReviews(data.data.reviews || []);
        setStats(data.data.stats || initialStats);
        toast.success('Reviews updated to latest feedback.');
      } else {
        toast.error(data.message || 'Failed to refresh reviews.');
      }
    } catch (err) {
      console.error('[Refresh Reviews Error]:', err);
      toast.error('Network error refreshing reviews.');
    } finally {
      setRefreshing(false);
    }
  };

  // Copy review comment
  const handleCopyComment = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Review text copied to clipboard!');
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  // Format relative date
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  // Filtered and sorted reviews
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        // Rating filter
        if (selectedRating !== 'all' && Math.round(r.rating) !== selectedRating) {
          return false;
        }

        // Bus filter
        if (selectedBus !== 'all' && r.bus?.id !== selectedBus && r.bus?.busNumber !== selectedBus) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = r.passenger?.name?.toLowerCase().includes(q);
          const matchesComment = r.comment?.toLowerCase().includes(q);
          const matchesBusNumber = r.bus?.busNumber?.toLowerCase().includes(q);
          const matchesSource = r.trip?.source?.toLowerCase().includes(q);
          const matchesDest = r.trip?.destination?.toLowerCase().includes(q);

          return Boolean(matchesName || matchesComment || matchesBusNumber || matchesSource || matchesDest);
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') {
          return b.rating - a.rating;
        }
        if (sortBy === 'lowest') {
          return a.rating - b.rating;
        }
        // Newest first default
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [reviews, selectedRating, selectedBus, searchQuery, sortBy]);

  // Star Rating Breakdown Helper
  const getRatingPercentage = (count: number) => {
    if (!stats.totalReviews || stats.totalReviews === 0) return 0;
    return Math.round((count / stats.totalReviews) * 100);
  };

  return (
    <div className="flex flex-col gap-8 pb-14 select-none">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare className="h-7 w-7 text-[#ff5666] shrink-0" />
            Passenger Reviews & Ratings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Monitor real-time passenger feedback, ratings, and customer satisfaction across your fleet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh reviews"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Reviews'}</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT STATS & ANALYTICS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Overall Rating Card */}
        <div className="lg:col-span-4 bg-gradient-to-br from-[#ff7c52] to-[#ff2d88] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md shadow-[#ff2d88]/15 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-100 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-200" />
              Fleet Rating Overview
            </span>
            
            <div className="flex items-center gap-3 mt-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight font-sans">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '5.0'}
              </span>
              
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-0.5 text-amber-300">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= Math.round(stats.averageRating || 5)
                          ? 'fill-current text-amber-300'
                          : 'text-white/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-rose-100">
                  {stats.positivePercentage}% Positive Feedback
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-white/15 flex items-center justify-between text-xs text-rose-100">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-white/80">Reviews:</span>
              <span className="text-xs font-black text-white">{stats.totalReviews} Total</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-xs">
              Verified Passengers
            </span>
          </div>
        </div>

        {/* Rating Breakdown Compact Bar Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-2.5">
            <h3 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              Rating Distribution
            </h3>
            <span className="text-[11px] font-medium text-zinc-400">
              {selectedRating !== 'all' ? (
                <button
                  onClick={() => setSelectedRating('all')}
                  className="text-[11px] font-bold text-[#ff2d88] hover:underline cursor-pointer"
                >
                  Reset Filter ({selectedRating}★)
                </button>
              ) : (
                'Click a star card to filter'
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-2.5">
            {[5, 4, 3, 2, 1].map((starVal) => {
              const count = stats.ratingCounts?.[starVal] || 0;
              const percentage = getRatingPercentage(count);
              const isSelected = selectedRating === starVal;

              return (
                <div
                  key={starVal}
                  onClick={() => setSelectedRating(isSelected ? 'all' : starVal)}
                  className={`flex flex-col gap-1 p-2.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected 
                      ? 'bg-[#ff2d88]/10 border-[#ff2d88]/40 ring-1 ring-[#ff2d88]/20' 
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/50 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-0.5">
                      {starVal} <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400">
                      {count}
                    </span>
                  </div>

                  <div className="w-full bg-zinc-200 dark:bg-zinc-700/60 h-1.5 rounded-full overflow-hidden mt-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        starVal >= 4
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : starVal === 3
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <span className="text-[9px] font-bold text-zinc-400 self-end mt-0.5">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Direct passenger travel feedback
            </span>
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">
              {stats.totalReviews} Total Verified Reviews
            </span>
          </div>
        </div>

      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by passenger name, comment, bus number, or city..."
            className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl pl-10 pr-8 py-2.5 text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-[#ff2d88]/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Controls: Bus selector & Rating pills & Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Bus Filter Selector */}
          {buses && buses.length > 0 && (
            <div className="relative">
              <select
                value={selectedBus}
                onChange={(e) => setSelectedBus(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer focus:border-[#ff2d88]/60"
              >
                <option value="all">All Buses ({buses.length})</option>
                {buses.map((b) => (
                  <option key={b.id} value={b.busNumber}>
                    {b.busNumber} ({b.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer focus:border-[#ff2d88]/60"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>

          {/* Clear all active filters if any */}
          {(selectedRating !== 'all' || selectedBus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedRating('all');
                setSelectedBus('all');
                setSearchQuery('');
              }}
              className="px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/30 text-[#ff2d88] hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}

        </div>

      </div>

      {/* 4. REVIEWS LISTING */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="h-16 w-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-[#ff2d88] flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
            {searchQuery || selectedRating !== 'all' || selectedBus !== 'all'
              ? 'No Reviews Matching Your Filters'
              : 'No Passenger Reviews Yet'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mt-1.5 leading-relaxed">
            {searchQuery || selectedRating !== 'all' || selectedBus !== 'all'
              ? 'Try changing your search term or clearing the rating/bus filters.'
              : 'When passengers complete bookings and travel on your scheduled trips, their verified ratings and comments will appear here.'}
          </p>
          {(searchQuery || selectedRating !== 'all' || selectedBus !== 'all') && (
            <button
              onClick={() => {
                setSelectedRating('all');
                setSelectedBus('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredReviews.map((rev) => {
              const isCopied = copiedId === rev.id;

              return (
                <motion.div
                  key={rev.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-[1.75rem] p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                >
                  {/* Top: Passenger Header & Star Rating */}
                  <div className="flex items-start justify-between gap-3">
                    
                    {/* Passenger Profile Avatar & Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-zinc-200/80 dark:border-zinc-700 shrink-0 bg-zinc-100 dark:bg-zinc-800">
                        <Image
                          src={rev.passenger.avatar || '/images/rohit-avatar.jpg'}
                          alt={rev.passenger.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">
                            {rev.passenger.name}
                          </h4>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider shrink-0">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Verified
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating Display */}
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 px-2.5 py-1 rounded-xl">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-black text-amber-700 dark:text-amber-400 font-sans">
                          {rev.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Middle: Review Content */}
                  <div className="flex flex-col gap-2">
                    {rev.comment ? (
                      <p className="text-xs sm:text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                        "{rev.comment}"
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 italic font-normal">
                        Passenger provided a {rev.rating}-star rating without written comments.
                      </p>
                    )}
                  </div>

                  {/* Bottom: Journey & Bus Details Badge */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-2">
                    
                    {/* Bus & Route Info */}
                    <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 font-bold">
                        <BusIcon className="h-3.5 w-3.5 text-[#ff2d88] shrink-0" />
                        <span className="font-mono">{rev.bus?.busNumber || rev.trip?.busNumber || 'Fleet Coach'}</span>
                        <span className="text-zinc-400 font-normal">•</span>
                        <span className="text-zinc-500 dark:text-zinc-400 font-medium text-[11px]">
                          {rev.bus?.type || rev.trip?.busType || 'AC Sleeper'}
                        </span>
                      </div>

                      {rev.booking?.seatNumbers && rev.booking.seatNumbers.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          Seat: {rev.booking.seatNumbers.join(', ')}
                        </span>
                      )}
                    </div>

                    {/* Route Details if present */}
                    {rev.trip && (
                      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400 font-medium">
                        <div className="flex items-center gap-1 truncate">
                          <span className="truncate">{rev.trip.source}</span>
                          <span className="text-rose-400">➔</span>
                          <span className="truncate">{rev.trip.destination}</span>
                        </div>

                        {rev.comment && (
                          <button
                            type="button"
                            onClick={() => handleCopyComment(rev.id, rev.comment)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            title="Copy feedback"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
