"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Zap, 
  Copy, 
  Check, 
  Tag, 
  Percent, 
  Clock, 
  CheckCircle2, 
  Info,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface PromoOffer {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  discountType: 'percentage' | 'flat';
  minBooking: string;
  validTill: string;
  category: string;
  color: string;
  badge: string;
}

const AVAILABLE_OFFERS: PromoOffer[] = [
  {
    id: 'promo-1',
    code: 'FIRSTTRIP',
    title: 'First Journey Special',
    description: 'Get 20% instant discount on your first bus reservation across all operator routes.',
    discount: '20% OFF',
    discountType: 'percentage',
    minBooking: 'Min. booking ₹500',
    validTill: 'Valid until 31 Dec',
    category: 'Welcome Offer',
    color: 'from-orange-500 to-[#ff5666]',
    badge: 'Popular'
  },
  {
    id: 'promo-2',
    code: 'SEATPLUS50',
    title: 'Flat ₹50 Savings',
    description: 'Enjoy a flat ₹50 instant deduction on any AC Sleeper or Multi-Axle luxury coach.',
    discount: '₹50 FLAT',
    discountType: 'flat',
    minBooking: 'Min. booking ₹400',
    validTill: 'Valid all weekdays',
    category: 'Daily Deal',
    color: 'from-[#ff5666] to-[#ff2d88]',
    badge: 'Daily'
  },
  {
    id: 'promo-3',
    code: 'WEEKEND15',
    title: 'Weekend Getaway',
    description: 'Save 15% on Friday through Sunday departures for intercity routes.',
    discount: '15% OFF',
    discountType: 'percentage',
    minBooking: 'Min. 2 seats',
    validTill: 'Fri - Sun journeys',
    category: 'Weekend Saver',
    color: 'from-pink-500 to-purple-600',
    badge: 'Weekend'
  },
  {
    id: 'promo-4',
    code: 'VIPROYALTY',
    title: 'Frequent Traveler Privilege',
    description: 'Exclusive 25% discount for Gold and Platinum loyalty members on premium Volvo buses.',
    discount: '25% OFF',
    discountType: 'percentage',
    minBooking: 'Min. booking ₹800',
    validTill: 'Limited slots',
    category: 'Loyalty Exclusive',
    color: 'from-[#ff2d88] to-rose-600',
    badge: 'Exclusive'
  }
];

export default function OffersClient() {
  const dispatch = useDispatch<AppDispatch>();
  
  const [activeTab, setActiveTab] = useState<'available' | 'claimed'>('available');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Redux rewards state
  const { list: rewardsList, totalSavings, claimedCount, loading, error } = useSelector(
    (state: RootState) => state.rewards
  );
  const userProfile = useSelector((state: RootState) => state.user.profile);

  useEffect(() => {
    dispatch(fetchMyRewards());
  }, [dispatch]);

  // Handle promo code copy
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 3000);
  };

  // Dynamic Tier Logic based on totalSavings
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

  return (
    <div className="flex flex-col gap-8 pb-12 select-none">
      
      {/* 1. HEADER SECTION (Consistent with other customer dashboard pages) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Tag className="h-7 w-7 text-[#ff5666] shrink-0" />
            Offers & Loyalty Rewards
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Discover active promotional discount codes and monitor your traveler loyalty status.
          </p>
        </div>

        <Link
          href="/customer/book"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#ff5666] to-[#ff2d88] hover:opacity-95 shadow-md shadow-[#ff2d88]/20 transition-all shrink-0 cursor-pointer active:scale-95"
        >
          <span>Book a Trip Now</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 2. LOYALTY TIER STATUS HERO CARD (Soft Muted Rose & Dusky Pink Aesthetic) */}
      <div className="bg-gradient-to-br from-[#d95d6a]/90 via-[#c4436e]/85 to-[#cf6953]/85 text-white rounded-[2rem] p-6 sm:p-7.5 border border-white/15 shadow-lg shadow-rose-900/5 relative overflow-hidden backdrop-blur-sm">
        {/* Subtle, softer ambient lighting */}
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
                You have accumulated <strong className="text-amber-100 font-bold">₹{totalSavings}</strong> in total booking savings. Every trip discount brings you closer to higher tier rewards and exclusive perks.
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
                  className={`h-full bg-gradient-to-r from-amber-200 via-rose-100 to-pink-200 transition-all duration-1000 ease-out`}
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
        {/* Mobile Scroll Indicator */}
        <div className="flex items-center justify-between sm:hidden mb-2 px-1 select-none">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ff5666] animate-pulse" />
            Rewards Overview
          </span>
          <span className="text-[10px] font-semibold text-[#ff5666] dark:text-pink-400 flex items-center gap-1">
            Scroll to view all <ArrowRight className="w-3 h-3 animate-bounce-x" />
          </span>
        </div>

        {/* Container: Horizontal Scroll on Mobile, Compact Auto-Fit Grid on Sm+ */}
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
          <span>Available Promo Codes</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
            activeTab === 'available'
              ? 'bg-white/20 text-white'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
          }`}>
            {AVAILABLE_OFFERS.length}
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
        /* AVAILABLE PROMO CODES GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AVAILABLE_OFFERS.map((offer) => {
            const isCopied = copiedCode === offer.code;

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[1.75rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Top Row: Category and Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    {offer.category}
                  </span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-pink-500/10 text-[#ff2d88] dark:text-pink-400 border border-pink-500/20">
                    {offer.badge}
                  </span>
                </div>

                {/* Middle: Title, Discount & Description */}
                <div className="my-4 flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                      {offer.title}
                    </h3>
                    <span className="text-lg font-black text-[#ff5666] dark:text-pink-400 shrink-0 font-sans">
                      {offer.discount}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                    {offer.description}
                  </p>
                </div>

                {/* Validity Rules */}
                <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-medium border-t border-zinc-100 dark:border-zinc-800/80 pt-3 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {offer.validTill}
                  </span>
                  <span>•</span>
                  <span>{offer.minBooking}</span>
                </div>

                {/* Bottom Row: Copy Code & Apply CTA */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center justify-between bg-pink-50/60 dark:bg-pink-950/20 border border-dashed border-pink-200 dark:border-pink-800/50 rounded-xl px-3.5 py-2">
                    <span className="font-mono font-black text-xs text-[#ff2d88] dark:text-pink-200 tracking-widest">
                      {offer.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(offer.code)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff5666] dark:text-pink-400 hover:text-[#ff2d88] transition-colors cursor-pointer"
                      title="Copy promo code"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <Link
                    href={`/customer/book?promo=${offer.code}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ff5666] to-[#ff2d88] hover:opacity-95 shadow-sm shadow-[#ff2d88]/20 transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                  >
                    <span>Use Code</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* REDEEMED TRIP HISTORY TAB */
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-36 animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-6 rounded-2xl text-center text-xs font-semibold">
                {error}
              </div>
            ) : !rewardsList || rewardsList.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center">
                <Ticket className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  No Redeemed Offers Recorded
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 leading-relaxed">
                  You haven't used any discount promo codes on your past trips yet. Apply an active code from the available list when booking your next journey!
                </p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ff5666] to-[#ff2d88] hover:opacity-95 text-white shadow-md shadow-[#ff2d88]/20 transition-all cursor-pointer active:scale-95"
                >
                  Browse Available Codes
                </button>
              </div>
            ) : (
              rewardsList.map((reward) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col sm:flex-row justify-between"
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
