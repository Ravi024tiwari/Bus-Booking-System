"use client";

import React, { useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function OffersClient() {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux rewards state
  const { list: rewardsList, totalSavings, claimedCount, loading, error } = useSelector(
    (state: RootState) => state.rewards
  );
  const userProfile = useSelector((state: RootState) => state.user.profile);

  useEffect(() => {
    dispatch(fetchMyRewards());
  }, [dispatch]);

  // 1. Dynamic Tier Logic
  // Tiers based on totalSavings (money saved)
  const getTierInfo = (savings: number) => {
    if (savings >= 1000) {
      return {
        name: 'Platinum Elite',
        icon: Crown,
        color: 'text-purple-400 bg-purple-950/20 border-purple-500/30',
        gradient: 'from-purple-500 via-indigo-600 to-pink-600',
        nextTier: 'Max Tier Reached',
        needed: 0,
        progress: 100,
        benefits: ['Double Reward points', 'VIP Priority booking support', 'Zero cancellation charges']
      };
    }
    if (savings >= 500) {
      return {
        name: 'Gold Member',
        icon: Crown,
        color: 'text-amber-400 bg-amber-950/20 border-amber-500/30',
        gradient: 'from-amber-400 via-[#ff7c52] to-[#ff2d88]',
        nextTier: 'Platinum Elite',
        needed: 1000 - savings,
        progress: ((savings - 500) / 500) * 100,
        benefits: ['10% extra discount coupons', 'Free water bottle onboard', 'Priority boarding']
      };
    }
    if (savings >= 200) {
      return {
        name: 'Silver Club',
        icon: Award,
        color: 'text-slate-350 bg-slate-800/20 border-slate-700/30',
        gradient: 'from-slate-400 to-indigo-500',
        nextTier: 'Gold Member',
        needed: 500 - savings,
        progress: ((savings - 200) / 300) * 100,
        benefits: ['Access to exclusive flash sales', '5% Priority coupon locks']
      };
    }
    return {
      name: 'Bronze Standard',
      icon: Award,
      color: 'text-orange-400 bg-orange-950/20 border-orange-500/30',
      gradient: 'from-orange-500 to-[#ff7c52]',
      nextTier: 'Silver Club',
      needed: 200 - savings,
      progress: (savings / 200) * 100,
      benefits: ['Standard ticket discount offers']
    };
  };

  const tier = getTierInfo(totalSavings);
  const TierIcon = tier.icon;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-1 sm:p-4 min-h-screen flex flex-col gap-8 text-zinc-800 dark:text-zinc-200">
      
      {/* 1. HEADER HERO PANEL */}
      <div className="w-full rounded-[32px] relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between p-6 sm:p-10 shadow-md border border-rose-200/50 dark:border-rose-950/60 bg-gradient-to-br from-rose-50 via-pink-50/70 to-rose-100/50 dark:from-[#221422] dark:via-[#180e1c] dark:to-[#1a0e1a] select-none">
        <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] bg-gradient-to-tr from-rose-400/10 to-pink-500/10 dark:from-rose-500/5 dark:to-pink-600/5 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-5%] w-[250px] h-[250px] bg-pink-400/5 dark:bg-pink-500/5 rounded-full blur-[70px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-rose-500/10 dark:bg-white/5 border border-rose-200 dark:border-white/10 rounded-full px-3.5 py-1.5 w-fit">
            <span className="text-[10px] text-rose-700 dark:text-zinc-300 font-semibold uppercase tracking-wider">Offers & Loyalty Rewards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-rose-950 dark:text-white leading-none">
            Your Savings Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-rose-900/80 dark:text-zinc-300 font-medium max-w-lg mt-1 leading-relaxed opacity-90">
            Hey {userProfile?.name || 'Ravi'}, track your promotional claims, monitor your rewards level, and copy active coupons to save on your next commute.
          </p>
          
          {totalSavings > 0 ? (
            <div className="mt-4 flex items-center gap-2.5 bg-rose-500/10 border border-rose-200/50 dark:border-rose-950/40 rounded-2xl px-4 py-3 text-rose-950 dark:text-rose-200 text-xs font-medium max-w-lg">
              <Sparkles className="h-4 w-4 text-rose-500 dark:text-rose-400 shrink-0 animate-pulse" />
              <span>
                🎉 <strong>Wonderful choices!</strong> You have saved a total of <strong>₹{totalSavings}</strong> on your bookings. Every discount brings you closer to your next loyalty tier benefits!
              </span>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2.5 bg-rose-500/5 border border-rose-200/40 dark:border-rose-950/30 rounded-2xl px-4 py-3 text-rose-900 dark:text-rose-300 text-xs font-medium max-w-lg">
              <Sparkles className="h-4 w-4 text-rose-500 dark:text-rose-400 shrink-0 animate-pulse" />
              <span>
                👋 <strong>Welcome onboard!</strong> Start booking trips to earn royalty status and unlock exclusive discount rewards.
              </span>
            </div>
          )}
        </div>

        {/* Royalty Tier Badge Card */}
        <div className="mt-6 lg:mt-0 relative border border-rose-200/50 dark:border-rose-950/50 rounded-3xl p-5 shrink-0 flex flex-col gap-3.5 min-w-[260px] bg-white/60 dark:bg-white/5 backdrop-blur-md shadow-lg overflow-hidden">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-2xl border flex items-center justify-center ${tier.color}`}>
              <TierIcon className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-rose-800/60 dark:text-zinc-400 font-semibold uppercase tracking-wider">Current Royalty Level</span>
              <span className="text-sm font-bold text-rose-950 dark:text-white mt-0.5">{tier.name}</span>
            </div>
          </div>

          {/* Progress to next tier */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-medium text-rose-800/60 dark:text-zinc-400">
              <span>Tier Progress</span>
              <span>{tier.needed > 0 ? `₹${tier.needed} to ${tier.nextTier}` : 'Max level achieved'}</span>
            </div>
            <div className="w-full h-2 bg-rose-200/50 dark:bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${tier.gradient} transition-all duration-[1s] ease-out`}
                style={{ width: `${tier.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* 2. STATS ROW (KPI CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Stat 1: Total Savings */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[28px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex items-center gap-5 relative overflow-hidden group">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Total Savings</span>
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1 font-mono">
              ₹{totalSavings}
            </span>
          </div>
          <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] group-hover:scale-110 transition-transform duration-300 pointer-events-none">
            <TrendingUp className="h-28 w-28 text-zinc-900 dark:text-white" />
          </div>
        </div>

        {/* Stat 2: Claimed Offers Count */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[28px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex items-center gap-5 relative overflow-hidden group">
          <div className="h-12 w-12 rounded-2xl bg-[#ff2d88]/10 text-[#ff2d88] flex items-center justify-center shrink-0">
            <Gift className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Redeemed Promo Offers</span>
            <span className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1 font-mono">
              {claimedCount} {claimedCount === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>
          <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] group-hover:scale-110 transition-transform duration-300 pointer-events-none">
            <Gift className="h-28 w-28 text-zinc-900 dark:text-white" />
          </div>
        </div>

        {/* Stat 3: Royalty Benefits */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[28px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex items-center gap-5 relative overflow-hidden group col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block">Active Tier Benefits</span>
            <div className="flex flex-col gap-0.5 mt-1 select-none">
              {tier.benefits.slice(0, 2).map((b, i) => (
                <span key={i} className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 truncate">
                  <Zap className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CORE CONTENT (Redeemed Offers) */}
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white uppercase tracking-wider font-sans">Your Redeemed Offers</h2>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-medium mt-1">
            Active and past tickets where operator discounts were claimed.
          </p>
        </div>      </div>

        <div className="flex flex-col gap-5">
          <AnimatePresence mode="popLayout">
            {loading ? (
              // Shimmer Skeleton Loader
              <div className="flex flex-col gap-4">
                {[1, 2].map((i) => (
                  <div 
                    key={i} 
                    className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 rounded-3xl h-44 animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/10 dark:bg-red-950/20 text-red-500 p-6 rounded-3xl text-center text-xs font-semibold">
                {error}
              </div>
            ) : !rewardsList || rewardsList.length === 0 ? (
              // Empty state
              <div 
                className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 rounded-[32px] p-12 text-center flex flex-col items-center justify-center select-none"
              >
                <Ticket className="h-10 w-10 text-zinc-300 dark:text-zinc-700 animate-pulse" />
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-4 uppercase tracking-wider">No Claimed Offers Yet</span>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium max-w-[260px] mt-1.5 leading-relaxed">
                  You haven't booked any trips using operator discounts yet. Book a new trip with a discount badge to claim rewards!
                </p>
              </div>
            ) : (
              rewardsList.map((reward) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-250/40 dark:border-zinc-805/80 rounded-[30px] shadow-sm relative overflow-hidden flex flex-col sm:flex-row justify-between"
                >
                  {/* Left: Journey details and discount summary */}
                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-widest font-semibold text-zinc-400 font-mono">PNR: {reward.pnr}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-lg font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
                        {reward.status}
                      </span>
                    </div>

                    {/* Travel Route Stops */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-zinc-900 dark:text-white leading-none">
                          {reward.source}
                        </span>
                        <ArrowRight className="h-3 w-3 text-zinc-450 shrink-0" />
                        <span className="font-bold text-sm text-zinc-900 dark:text-white leading-none">
                          {reward.destination}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-1">
                        {reward.busType} | Seat: {reward.seat}
                      </span>
                    </div>

                    <div className="h-px bg-zinc-150/40 dark:bg-zinc-800/40 w-full" />

                    {/* Travel Date / Time Info */}
                    <div className="flex items-center gap-5 text-[10px] font-medium text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{reward.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{reward.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dotted coupon divider */}
                  <div className="hidden sm:block relative w-px h-full shrink-0 select-none">
                    <div className="absolute top-0 -left-1.5 h-3 w-3 rounded-full bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/50 dark:border-zinc-800" />
                    <div className="absolute bottom-0 -left-1.5 h-3 w-3 rounded-full bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200/50 dark:border-zinc-805" />
                    <div className="border-l border-dashed border-zinc-250 dark:border-zinc-800 h-full w-0" />
                  </div>

                  {/* Right: Savings amount section */}
                  <div className="p-6 sm:w-[170px] bg-rose-500/5 dark:bg-rose-950/10 border-t sm:border-t-0 sm:border-l border-zinc-150 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider leading-none">Discount Saved</span>
                    <span className="text-2xl font-bold text-rose-500 tracking-tight leading-none mt-2 font-mono">
                      ₹{reward.discountAmount}
                    </span>
                    <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-medium mt-1 font-mono">
                      for {reward.discountedSeatsCount || 1} seat{(reward.discountedSeatsCount || 1) > 1 ? 's' : ''}
                    </span>

                    <button
                      onClick={() => reward.pnr && navigator.clipboard.writeText(reward.pnr).then(() => toast.success('PNR copied!'))}
                      className="mt-3.5 py-1.5 px-3 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer outline-none"
                    >
                      Copy PNR
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
  );
}
