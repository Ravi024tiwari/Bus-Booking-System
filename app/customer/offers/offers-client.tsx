"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch, fetchMyRewards } from '@/store';
import { 
  Gift, 
  Award, 
  Crown, 
  Ticket, 
  Calendar, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  Copy, 
  Check, 
  Tag, 
  Percent, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Search,
  RefreshCw,
  Bus as BusIcon,
  Flame,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export interface LiveOffer {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountPercentage: number;
  maxDiscountAmount?: number;
  offerLimit: number;
  offerBookedCount: number;
  remainingSeats: number;
  isLimitReached: boolean;
  badgeText?: string;
  bannerImage?: string;
  themeColor?: string;
  validFrom?: string;
  validTill: string;
  operatorName?: string;
  tripDetails?: {
    tripId: string;
    source: string;
    destination: string;
    date: string;
    departureTime: string;
    arrivalTime: string;
    originalFare: number;
    discountedFare: number;
    discountAmount: number;
    busNumber: string;
    busType: string;
    busImage: string;
  } | null;
}

export default function OffersClient() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  // Navigation & filtering state
  const [activeTab, setActiveTab] = useState<'available' | 'claimed'>('available');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'trips' | 'general' | 'high_discount'>('all');

  // Real live offers state from API
  const [liveOffers, setLiveOffers] = useState<LiveOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redux rewards state
  const { list: rewardsList, totalSavings, claimedCount, loading: loadingRewards, error: errorRewards } = useSelector(
    (state: RootState) => state.rewards
  );
  const userProfile = useSelector((state: RootState) => state.user.profile);

  useEffect(() => {
    dispatch(fetchMyRewards());
  }, [dispatch]);

  // Fetch real active offers from database
  const fetchOffers = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoadingOffers(true);

    try {
      const res = await fetch('/api/offers', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLiveOffers(data.data);
      } else {
        setLiveOffers([]);
      }
    } catch (err) {
      console.error('[Fetch Live Offers Error]:', err);
      toast.error('Could not load promotional offers.');
    } finally {
      setLoadingOffers(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Handle promo code copy
  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Promo code "${code}" copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  // Handle "Use Code" / "Book Trip" redirect
  const handleUseOffer = (offer: LiveOffer) => {
    navigator.clipboard.writeText(offer.code);
    setCopiedCode(offer.code);

    if (offer.tripDetails?.tripId) {
      toast.success(`Promo code "${offer.code}" applied! Redirecting to trip booking...`);
      setTimeout(() => {
        router.push(`/customer/book/${offer.tripDetails!.tripId}`);
      }, 350);
    } else {
      toast.success(`Promo code "${offer.code}" copied! Pick your journey to apply.`);
      setTimeout(() => {
        router.push(`/customer/book?promo=${encodeURIComponent(offer.code)}`);
      }, 350);
    }
  };

  // Format valid date
  const formatExpiry = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Valid Today';
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (dateStr: string) => {
    try {
      const target = new Date(dateStr).getTime();
      const now = Date.now();
      const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'Ends Today';
      if (diffDays === 1) return 'Ends Tomorrow';
      return `${diffDays} days left`;
    } catch {
      return 'Limited Time';
    }
  };

  // Dynamic Tier Info based on accumulated savings
  const getTierInfo = (savings: number) => {
    if (savings >= 1000) {
      return {
        name: 'Platinum Elite',
        icon: Crown,
        color: 'text-purple-500 bg-purple-500/10 border-purple-500/30 dark:text-purple-400 dark:bg-purple-950/30',
        badgeColor: 'bg-purple-500 text-white',
        gradient: 'from-purple-600 via-[#ff2d88] to-pink-500',
        nextTier: 'Max Tier Reached',
        needed: 0,
        progress: 100,
        benefits: ['Double Reward points on bookings', 'VIP Priority customer support', 'Zero cancellation fee allowance']
      };
    }
    if (savings >= 500) {
      return {
        name: 'Gold Member',
        icon: Crown,
        color: 'text-amber-600 bg-amber-500/10 border-amber-500/30 dark:text-amber-400 dark:bg-amber-950/30',
        badgeColor: 'bg-amber-500 text-white',
        gradient: 'from-amber-500 via-[#ff7c52] to-[#ff2d88]',
        nextTier: 'Platinum Elite',
        needed: 1000 - savings,
        progress: ((savings - 500) / 500) * 100,
        benefits: ['10% bonus coupon discounts', 'Free complimentary water bottle onboard', 'Priority boarding assistance']
      };
    }
    if (savings >= 200) {
      return {
        name: 'Silver Club',
        icon: Award,
        color: 'text-pink-600 bg-pink-500/10 border-pink-500/30 dark:text-pink-400 dark:bg-pink-950/30',
        badgeColor: 'bg-[#ff2d88] text-white',
        gradient: 'from-pink-500 to-rose-500',
        nextTier: 'Gold Member',
        needed: 500 - savings,
        progress: ((savings - 200) / 300) * 100,
        benefits: ['Access to exclusive flash sales', 'Early seat lock reservation rights']
      };
    }
    return {
      name: 'Bronze Standard',
      icon: Award,
      color: 'text-rose-600 bg-rose-500/10 border-rose-500/30 dark:text-rose-400 dark:bg-rose-950/30',
      badgeColor: 'bg-[#ff5666] text-white',
      gradient: 'from-rose-500 to-[#ff7c52]',
      nextTier: 'Silver Club',
      needed: 200 - savings,
      progress: (savings / 200) * 100,
      benefits: ['Standard ticket promotional discounts', 'Seasonal holiday discount offers']
    };
  };

  const tier = getTierInfo(totalSavings);
  const TierIcon = tier.icon;

  // Filtered live offers
  const filteredOffers = useMemo(() => {
    return liveOffers.filter((offer) => {
      // Type Filter
      if (filterType === 'trips' && !offer.tripDetails) return false;
      if (filterType === 'general' && offer.tripDetails) return false;
      if (filterType === 'high_discount' && offer.discountPercentage < 20) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = offer.code.toLowerCase().includes(q);
        const matchesTitle = offer.title.toLowerCase().includes(q);
        const matchesDescription = offer.description?.toLowerCase().includes(q);
        const matchesOperator = offer.operatorName?.toLowerCase().includes(q);
        const matchesSource = offer.tripDetails?.source?.toLowerCase().includes(q);
        const matchesDestination = offer.tripDetails?.destination?.toLowerCase().includes(q);
        const matchesBusType = offer.tripDetails?.busType?.toLowerCase().includes(q);

        return Boolean(
          matchesCode || 
          matchesTitle || 
          matchesDescription || 
          matchesOperator || 
          matchesSource || 
          matchesDestination || 
          matchesBusType
        );
      }

      return true;
    });
  }, [liveOffers, filterType, searchQuery]);

  return (
    <div className="flex flex-col gap-8 pb-14 select-none">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Tag className="h-7 w-7 text-[#ff5666] shrink-0" />
            Offers & Loyalty Rewards
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Browse real-time operator discounts, promotional codes, and your loyalty member benefits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchOffers(true)}
            disabled={refreshing || loadingOffers}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh active offers"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/customer/book"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#ff5666] to-[#ff2d88] hover:opacity-95 shadow-md shadow-[#ff2d88]/20 transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <span>Book a Trip Now</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 2. LOYALTY TIER STATUS HERO CARD */}
      <div className="bg-gradient-to-br from-[#d95d6a]/90 via-[#c4436e]/85 to-[#cf6953]/85 text-white rounded-[2rem] p-6 sm:p-7.5 border border-white/15 shadow-lg shadow-rose-900/5 relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose-300/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Left Summary */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold uppercase tracking-wider text-white/95 backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-amber-200" />
                Loyalty Tier Status
              </div>
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md ${tier.badgeColor}`}>
                {tier.name}
              </span>
            </div>

            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                Welcome back, {userProfile?.name?.split(' ')[0] || 'Traveler'}
              </h2>
              <p className="text-xs sm:text-[13px] text-rose-100/90 mt-1 leading-relaxed max-w-xl font-normal">
                You have accumulated <strong className="text-amber-100 font-bold">₹{totalSavings}</strong> in total booking discounts. Use active operator offers to earn more travel savings!
              </p>
            </div>

            {/* Tier Progress Bar */}
            <div className="bg-black/10 dark:bg-black/20 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2 max-w-xl">
              <div className="flex items-center justify-between text-xs font-medium text-white/95">
                <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                  <TierIcon className="h-3.5 w-3.5 text-amber-200" />
                  <span>Tier Progression</span>
                </span>
                <span className="text-rose-100/80 text-[11px] sm:text-xs">
                  {tier.needed > 0 ? `₹${tier.needed} needed for ${tier.nextTier}` : 'Highest tier achieved'}
                </span>
              </div>
              <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-200 via-rose-100 to-pink-200 transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(tier.progress, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Benefits Column */}
          <div className="lg:col-span-5 bg-black/10 dark:bg-black/20 backdrop-blur-md border border-white/15 rounded-2xl p-4.5 sm:p-5 flex flex-col gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-100/90 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Active Member Privileges
            </span>
            <div className="flex flex-col gap-2">
              {tier.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-white/95">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium text-[11px] sm:text-xs">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 3. KPI STATS CARDS */}
      <div className="w-full">
        <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto sm:overflow-x-visible no-scrollbar pb-2 sm:pb-0 pt-0.5 px-1 -mx-1 snap-x snap-mandatory sm:snap-none select-none">
          
          {/* Stat 1: Total Savings */}
          <div className="min-w-[165px] max-w-[210px] sm:max-w-none w-[48vw] sm:w-auto shrink-0 sm:shrink snap-start bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center gap-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-200">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/15">
              <TrendingUp className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block truncate">Total Savings</span>
              <span className="text-base sm:text-xl font-extrabold text-zinc-900 dark:text-white mt-0.5 font-sans leading-none block truncate">
                ₹{totalSavings}
              </span>
            </div>
          </div>

          {/* Stat 2: Claimed Offers */}
          <div className="min-w-[165px] max-w-[210px] sm:max-w-none w-[48vw] sm:w-auto shrink-0 sm:shrink snap-start bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center gap-3 relative overflow-hidden group hover:border-pink-500/30 transition-all duration-200">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-pink-500/10 text-[#ff2d88] dark:text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/15">
              <Gift className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block truncate">Claimed Deals</span>
              <span className="text-base sm:text-xl font-extrabold text-zinc-900 dark:text-white mt-0.5 font-sans leading-none block truncate">
                {claimedCount} <span className="text-[10px] sm:text-xs font-semibold text-zinc-400">{claimedCount === 1 ? 'Trip' : 'Trips'}</span>
              </span>
            </div>
          </div>

          {/* Stat 3: Current Status */}
          <div className="min-w-[165px] max-w-[210px] sm:max-w-none w-[48vw] sm:w-auto shrink-0 sm:shrink snap-start bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center gap-3 relative overflow-hidden group hover:border-rose-500/30 transition-all duration-200">
            <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 border ${tier.color}`}>
              <TierIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block truncate">Membership Tier</span>
              <span className="text-sm sm:text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5 leading-none block truncate">
                {tier.name}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. TABS NAVIGATION */}
      <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'available'
              ? 'bg-gradient-to-r from-[#ff5666] to-[#ff2d88] text-white shadow-md shadow-[#ff2d88]/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-pink-50/50 dark:hover:bg-zinc-800'
          }`}
        >
          <Percent className="h-3.5 w-3.5" />
          <span>Active Operator Offers</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
            activeTab === 'available'
              ? 'bg-white/20 text-white'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
          }`}>
            {liveOffers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('claimed')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'claimed'
              ? 'bg-gradient-to-r from-[#ff5666] to-[#ff2d88] text-white shadow-md shadow-[#ff2d88]/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-pink-50/50 dark:hover:bg-zinc-800'
          }`}
        >
          <Ticket className="h-3.5 w-3.5" />
          <span>Redeemed Trip History</span>
          {rewardsList?.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
              activeTab === 'claimed'
                ? 'bg-white/20 text-white'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
            }`}>
              {rewardsList.length}
            </span>
          )}
        </button>
      </div>

      {/* 5. TAB CONTENT */}
      {activeTab === 'available' ? (
        <div className="flex flex-col gap-6">
          
          {/* SEARCH & FILTER CONTROLS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 shadow-xs">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code (e.g. SAVE20), route, city, or operator..."
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-[#ff2d88]/60 transition-colors"
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

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                All Deals ({liveOffers.length})
              </button>

              <button
                onClick={() => setFilterType('trips')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
                  filterType === 'trips'
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                Trip Specials
              </button>

              <button
                onClick={() => setFilterType('high_discount')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
                  filterType === 'high_discount'
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                ≥ 20% OFF
              </button>
            </div>

          </div>

          {/* OFFERS LISTING */}
          {loadingOffers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 rounded-[1.75rem] h-80 animate-pulse"
                />
              ))}
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center shadow-xs">
              <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-[#ff2d88] flex items-center justify-center mb-4">
                <Tag className="h-7 w-7" />
              </div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                {searchQuery ? 'No Matching Offers Found' : 'No Active Offers Available Right Now'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mt-1.5 leading-relaxed">
                {searchQuery 
                  ? `We couldn't find any active deals matching "${searchQuery}". Try searching a different city or clearing filters.`
                  : 'Operators update discounts daily. Check back shortly or browse upcoming standard routes to secure your seats.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => {
                const trip = offer.tripDetails;
                const isCopied = copiedCode === offer.code;
                const isTripSpecific = Boolean(trip && trip.tripId);

                return (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-[1.75rem] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                  >
                    {/* Top Visual Section */}
                    {isTripSpecific && trip ? (
                      <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
                        <Image 
                          src={offer.bannerImage || trip.busImage || '/images/volvo.png'} 
                          alt={`${trip.source} to ${trip.destination}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-106 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
                        
                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs border border-rose-400/30 flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {offer.badgeText || `${offer.discountPercentage}% OFF`}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-black/60 text-amber-300 text-[10px] font-bold backdrop-blur-md border border-amber-400/30 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getDaysRemaining(offer.validTill)}
                          </span>
                        </div>

                        {/* Route Overlay on Image */}
                        <div className="absolute bottom-3 left-3.5 right-3.5 text-white z-10">
                          <div className="flex items-center gap-1.5 text-base font-black tracking-tight drop-shadow-sm">
                            <span className="truncate">{trip.source}</span>
                            <span className="text-rose-400 font-normal">➔</span>
                            <span className="truncate">{trip.destination}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-200 font-bold mt-0.5">
                            <span>{trip.busType}</span>
                            <span>•</span>
                            <span>{trip.date}</span>
                            <span>•</span>
                            <span>{trip.departureTime}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* General Promo Code Card Header */
                      <div className="p-5 pb-0 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-pink-500/10 text-[#ff2d88] dark:text-pink-400 text-[10px] font-black uppercase tracking-wider border border-pink-500/20 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {offer.operatorName || 'Special Promo'}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getDaysRemaining(offer.validTill)}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between gap-2 mt-1">
                          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-tight">
                            {offer.title}
                          </h3>
                          <span className="text-lg font-black text-[#ff5666] dark:text-pink-400 font-sans shrink-0">
                            {offer.discountPercentage}% OFF
                          </span>
                        </div>

                        {offer.description && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed mt-0.5 line-clamp-2">
                            {offer.description}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Card Content Body */}
                    <div className="p-4.5 flex flex-col gap-3.5">
                      
                      {/* Price / Discount Breakdown */}
                      {isTripSpecific && trip ? (
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Special Fare</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-black text-[#ff2d88] dark:text-rose-400 font-sans">
                                ₹{trip.discountedFare}
                              </span>
                              <span className="text-xs text-zinc-400 line-through font-bold font-sans">
                                ₹{trip.originalFare}
                              </span>
                            </div>
                          </div>

                          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 rounded-lg">
                            Save ₹{trip.discountAmount}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
                          <span>Max Discount:</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {offer.maxDiscountAmount ? `Up to ₹${offer.maxDiscountAmount}` : 'No Limit'}
                          </span>
                        </div>
                      )}

                      {/* Seat Quota & Validity Info */}
                      <div className="flex items-center justify-between text-[11px] font-medium pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-zinc-400">
                          Valid till <strong className="text-zinc-600 dark:text-zinc-300 font-semibold">{formatExpiry(offer.validTill)}</strong>
                        </span>

                        {offer.offerLimit > 0 && (
                          <span className={`text-[11px] font-bold ${
                            offer.remainingSeats > 0 ? 'text-[#ff2d88]' : 'text-zinc-400'
                          }`}>
                            {offer.remainingSeats > 0 ? `${offer.remainingSeats} seats left` : 'Quota Filled'}
                          </span>
                        )}
                      </div>

                      {/* Promo Code Box & Action Button */}
                      <div className="flex items-center gap-2 pt-1">
                        
                        {/* Copy Code Pill */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(offer.code, e)}
                          className="flex-1 flex items-center justify-between bg-pink-50/60 dark:bg-pink-950/20 border border-dashed border-pink-200 dark:border-pink-800/50 rounded-xl px-3 py-2 hover:bg-pink-100/50 dark:hover:bg-pink-950/40 transition-colors cursor-pointer group/btn"
                          title="Click to copy promo code"
                        >
                          <span className="font-mono font-black text-xs text-[#ff2d88] dark:text-pink-200 tracking-wider">
                            {offer.code}
                          </span>
                          
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 group-hover/btn:text-[#ff2d88]">
                            {isCopied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </span>
                        </button>

                        {/* Use Code / Book Trip Redirect CTA */}
                        <button
                          type="button"
                          onClick={() => handleUseOffer(offer)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ff5666] to-[#ff2d88] hover:opacity-95 shadow-xs shadow-[#ff2d88]/20 transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                        >
                          <span>{isTripSpecific ? 'Book Trip' : 'Use Code'}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>

                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
        /* REDEEMED TRIP HISTORY TAB */
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {loadingRewards ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-36 animate-pulse"
                  />
                ))}
              </div>
            ) : errorRewards ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-6 rounded-2xl text-center text-xs font-semibold flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{errorRewards}</span>
              </div>
            ) : !rewardsList || rewardsList.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center shadow-xs">
                <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-3">
                  <Ticket className="h-7 w-7" />
                </div>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  No Redeemed Offers Recorded
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 leading-relaxed">
                  You haven't used any discount promo codes on your past trips yet. Apply an active operator offer from the list when booking your next journey!
                </p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ff5666] to-[#ff2d88] hover:opacity-95 text-white shadow-md shadow-[#ff2d88]/20 transition-all cursor-pointer active:scale-95"
                >
                  Browse Active Operator Offers
                </button>
              </div>
            ) : (
              rewardsList.map((reward) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs overflow-hidden flex flex-col sm:flex-row justify-between"
                >
                  {/* Left: Journey info */}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold text-zinc-400">
                        PNR: {reward.pnr}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {reward.status || 'Confirmed'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-zinc-900 dark:text-white">
                          {reward.source}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="font-bold text-sm text-zinc-900 dark:text-white">
                          {reward.destination}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 font-medium">
                        {reward.busType} • Seat: {reward.seat}
                      </span>
                    </div>

                    <div className="flex items-center gap-5 text-xs text-zinc-400 font-medium pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{reward.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{reward.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Saved Amount */}
                  <div className="p-5 sm:w-48 bg-zinc-50 dark:bg-zinc-800/40 border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Discount Saved
                    </span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-sans">
                      ₹{reward.discountAmount}
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-0.5">
                      {reward.discountedSeatsCount || 1} Seat{(reward.discountedSeatsCount || 1) > 1 ? 's' : ''} discounted
                    </span>

                    <button
                      onClick={() => {
                        if (reward.pnr) {
                          navigator.clipboard.writeText(reward.pnr);
                          toast.success('PNR copied to clipboard!');
                        }
                      }}
                      className="mt-3 px-3 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Copy PNR
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
