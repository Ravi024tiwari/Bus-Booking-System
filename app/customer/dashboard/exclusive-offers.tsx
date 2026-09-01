'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Percent, 
  Sparkles, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Bus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiscountedTripOffer } from '@/lib/offers';

interface ExclusiveOffersProps {
  initialOffers: DiscountedTripOffer[];
}

export default function ExclusiveOffers({ initialOffers }: ExclusiveOffersProps) {
  const router = useRouter();
  const [offers, setOffers] = useState<DiscountedTripOffer[]>(initialOffers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (initialOffers && initialOffers.length > 0) {
      setOffers(initialOffers);
    }
  }, [initialOffers]);

  // Auto cycle offers every 5 seconds if multiple
  useEffect(() => {
    if (!isAutoPlaying || offers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, offers.length]);

  if (!offers || offers.length === 0) return null;

  const activeOffer = offers[currentIndex];

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const handleSelectDeal = (offer: DiscountedTripOffer) => {
    if (offer.tripId && !offer.tripId.startsWith('fb-')) {
      router.push(`/customer/book/${offer.tripId}`);
    } else {
      router.push(`/customer/book?from=${offer.source}&to=${offer.destination}&offer=${offer.code}`);
    }
  };

  return (
    <div 
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/80 rounded-[1.75rem] p-4 sm:p-4.5 flex flex-col gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.02)] select-none relative overflow-hidden transition-all duration-300"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Compact Header */}
      <div className="flex items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-2">
          <div className="h-6.5 w-6.5 rounded-lg bg-gradient-to-r from-rose-500 to-[#ff2d88] text-white flex items-center justify-center shadow-xs shrink-0">
            <Flame className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-black text-sm sm:text-base text-zinc-900 dark:text-white tracking-tight">
            Special Deals
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Navigation Arrows */}
          {offers.length > 1 && (
            <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-full border border-zinc-200/50 dark:border-zinc-700/50">
              <button
                onClick={handlePrev}
                className="h-5.5 w-5.5 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-all cursor-pointer"
                aria-label="Previous Deal"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                onClick={handleNext}
                className="h-5.5 w-5.5 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-all cursor-pointer"
                aria-label="Next Deal"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}

          <Link
            href="/customer/offers"
            className="text-[11px] font-bold text-[#ff2d88] dark:text-rose-400 hover:underline flex items-center gap-0.5"
          >
            <span>All</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* COMPACT FEATURED DEAL CARD */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeOffer.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          onClick={() => handleSelectDeal(activeOffer)}
          className="relative bg-zinc-950 rounded-[1.35rem] overflow-hidden shadow-md border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between h-[165px] sm:h-[175px] group cursor-pointer active:scale-[0.99] transition-all"
        >
          {/* Background Bus Image with smooth zoom */}
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={activeOffer.busImage || '/images/volvo.png'}
              alt={`${activeOffer.source} to ${activeOffer.destination}`}
              fill
              sizes="(max-width: 640px) 90vw, 360px"
              className="object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
              priority
            />
          </div>

          {/* Cinematic Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/30 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-at-t from-transparent via-transparent to-black/60 pointer-events-none" />

          {/* Top Bar: Floating Discount Badge & Promo Code */}
          <div className="relative z-10 p-2.5 sm:p-3 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-600/90 text-white text-[10px] font-black tracking-wide shadow-xs uppercase backdrop-blur-md border border-rose-400/40">
              <Sparkles className="h-2.5 w-2.5 animate-pulse" />
              <span>{activeOffer.badgeText}</span>
            </div>

            <div className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-amber-300 font-mono font-black text-[9.5px] shadow-2xs tracking-wider">
              {activeOffer.code}
            </div>
          </div>

          {/* Bottom Card Body */}
          <div className="relative z-10 p-2.5 sm:p-3 text-white flex flex-col gap-1.5">
            
            {/* Route & Vehicle Tag */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-sm sm:text-[15px] font-black tracking-tight drop-shadow-sm leading-tight">
                <span className="truncate">{activeOffer.source}</span>
                <span className="text-rose-400 font-normal shrink-0 text-xs">➔</span>
                <span className="truncate">{activeOffer.destination}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[9.5px] text-zinc-300 font-medium mt-0.5">
                <span className="flex items-center gap-1 truncate max-w-[130px]">
                  <Bus className="h-2.5 w-2.5 shrink-0 text-rose-300" />
                  <span className="truncate">{activeOffer.busType}</span>
                </span>
                {activeOffer.date && (
                  <>
                    <span>•</span>
                    <span className="truncate">{activeOffer.date}</span>
                  </>
                )}
              </div>
            </div>

            {/* Price & Action Row */}
            <div className="flex items-center justify-between pt-1 border-t border-white/15 gap-2">
              {/* Discount Pricing */}
              <div className="flex items-baseline gap-1 min-w-0">
                <span className="text-base sm:text-lg font-black text-rose-400 font-mono leading-none">
                  ₹{activeOffer.discountedFare}
                </span>
                <span className="text-[10px] text-zinc-400 line-through font-bold leading-none">
                  ₹{activeOffer.originalFare}
                </span>
                <span className="text-[8.5px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1 py-0.2 rounded leading-none hidden sm:inline-block">
                  -₹{activeOffer.discountAmount}
                </span>
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectDeal(activeOffer);
                }}
                className="py-1.2 px-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-[#ff2d88] text-white font-black text-[10.5px] uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-[#ff2d88]/25 hover:opacity-95 transition-all cursor-pointer shrink-0"
              >
                <span>Book</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination Indicator Dots */}
      {offers.length > 1 && (
        <div className="flex items-center justify-center gap-1 pt-0.5">
          {offers.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(idx);
              }}
              className={`h-1.2 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx 
                  ? 'w-4 bg-gradient-to-r from-rose-500 to-[#ff2d88]' 
                  : 'w-1.2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400'
              }`}
              aria-label={`Go to deal ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Compact Mini List of Other Available Deals */}
      {offers.length > 1 && (
        <div className="flex flex-col gap-1.5 pt-0.5">
          <span className="text-[9.5px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            More Discounted Departures
          </span>

          <div className="flex flex-col gap-1">
            {offers
              .filter((_, idx) => idx !== currentIndex)
              .slice(0, 2)
              .map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => handleSelectDeal(deal)}
                  className="flex items-center justify-between p-2 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/70 dark:bg-zinc-850/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-6.5 w-6.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-[10px] shrink-0">
                      <Percent className="h-3 w-3" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1 text-[11.5px] font-black text-zinc-800 dark:text-zinc-200 truncate">
                        <span className="truncate">{deal.source}</span>
                        <span className="text-rose-400 font-normal text-[10px]">➔</span>
                        <span className="truncate">{deal.destination}</span>
                      </div>
                      <span className="text-[9px] text-zinc-400 truncate">
                        {deal.busType} • {deal.discountPercentage}% OFF
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex flex-col text-right">
                      <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 leading-none">₹{deal.discountedFare}</span>
                      <span className="text-[8.5px] text-zinc-400 line-through leading-none mt-0.5">₹{deal.originalFare}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-zinc-400 group-hover:text-[#ff2d88] transition-colors" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

    </div>
  );
}
