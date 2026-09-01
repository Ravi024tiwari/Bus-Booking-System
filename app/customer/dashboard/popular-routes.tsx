'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ArrowRight, 
  Star, 
  Bus, 
  ShieldCheck,
  Flame,
  ArrowUpRight
} from 'lucide-react';

const LOCAL_BUS_FALLBACKS = [
  '/images/volvo.png',
  '/images/volvo2.png',
  '/images/bus1.jpg',
  '/images/bus2.jpg',
  '/images/bus-hero.jpg',
  '/images/customer_bus_banner.jpg',
];

function getRouteImage(route: { image?: string }, index: number): string {
  if (route.image && route.image.trim() !== '' && !route.image.includes('unsplash.com')) {
    return route.image;
  }
  return LOCAL_BUS_FALLBACKS[index % LOCAL_BUS_FALLBACKS.length];
}

export default function PopularRoutes({ initialRoutes }: { initialRoutes?: any[] }) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const reduxRoutes = useSelector((state: RootState) => state.customerDashboard.popularRoutes);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Prioritize live Redux state if populated, else use server-passed initialRoutes
  const routes = (reduxRoutes && reduxRoutes.length > 0)
    ? reduxRoutes
    : (initialRoutes && initialRoutes.length > 0)
      ? initialRoutes
      : [
          { 
            tripId: 'fb-1',
            source: 'Raipur', 
            destination: 'Mumbai', 
            fare: '1,099', 
            busType: 'AC Sleeper',
            busNumber: 'CG-04-AB-1234',
            averageRating: 4.9,
            totalReviews: 84,
            image: '/images/volvo.png' 
          },
          { 
            tripId: 'fb-2',
            source: 'Raipur', 
            destination: 'Delhi', 
            fare: '1,299', 
            busType: 'Multi-Axle Volvo',
            busNumber: 'CG-04-CD-5678',
            averageRating: 4.9,
            totalReviews: 62,
            image: '/images/volvo2.png' 
          },
          { 
            tripId: 'fb-3',
            source: 'Nagpur', 
            destination: 'Pune', 
            fare: '799', 
            busType: 'AC Seater',
            busNumber: 'MH-31-EF-9012',
            averageRating: 4.8,
            totalReviews: 45,
            image: '/images/bus1.jpg' 
          },
          { 
            tripId: 'fb-4',
            source: 'Bhopal', 
            destination: 'Indore', 
            fare: '699', 
            busType: 'Executive Coach',
            busNumber: 'MP-09-GH-3456',
            averageRating: 4.8,
            totalReviews: 38,
            image: '/images/bus2.jpg' 
          },
          { 
            tripId: 'fb-5',
            source: 'Delhi', 
            destination: 'Jaipur', 
            fare: '499', 
            busType: 'Royal Express',
            busNumber: 'DL-01-JK-7890',
            averageRating: 4.7,
            totalReviews: 53,
            image: '/images/bus-hero.jpg' 
          },
          { 
            tripId: 'fb-6',
            source: 'Bengaluru', 
            destination: 'Hyderabad', 
            fare: '899', 
            busType: 'BharatBenz Glider',
            busNumber: 'KA-05-LM-2345',
            averageRating: 4.9,
            totalReviews: 91,
            image: '/images/volvo.png' 
          }
        ];

  const updateScrollState = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);

      // Compute active card index based on scroll position
      const cardWidth = clientWidth < 640 ? clientWidth * 0.82 : 240;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(0, index), routes.length - 1));
    }
  };

  useEffect(() => {
    updateScrollState();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState, { passive: true });
      window.addEventListener('resize', updateScrollState);
      return () => {
        container.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [routes]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollToIndex = (idx: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.clientWidth < 640 ? container.clientWidth * 0.82 + 16 : 260;
      container.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
    }
  };

  const handleCardClick = (route: any) => {
    const params = new URLSearchParams();
    if (route.source) params.set('from', route.source);
    if (route.destination) params.set('to', route.destination);
    if (route.tripId && !route.tripId.startsWith('fb-')) params.set('tripId', route.tripId);
    router.push(`/customer/book?${params.toString()}`);
  };

  return (
    <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/70 dark:border-zinc-800/80 rounded-[2rem] p-4.5 sm:p-6 flex flex-col gap-4.5 shadow-[0_12px_36px_rgba(0,0,0,0.03)] relative overflow-hidden select-none transition-all duration-300">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/5 dark:bg-amber-500/5 rounded-full blur-2xl pointer-events-none -z-0" />

      {/* Header with Title, Badges, and Navigation */}
      <div className="flex items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-violet-600/10 dark:bg-violet-400/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
              <Flame className="h-4 w-4" />
            </div>
            <h3 className="font-black text-base sm:text-lg text-zinc-900 dark:text-white tracking-tight">
              Top-Rated Routes
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/50 dark:to-fuchsia-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40 shadow-2xs">
            <Sparkles className="h-3 w-3 text-amber-500 animate-pulse shrink-0" /> Verified Passenger Picks
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Scroll Navigation Arrows (Desktop / Tablet) */}
          <div className="hidden sm:flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-800/80 p-1 rounded-full border border-zinc-200/50 dark:border-zinc-700/50">
            <button 
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`h-7 w-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                canScrollLeft 
                  ? 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-2xs hover:scale-105 active:scale-95' 
                  : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed opacity-40'
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`h-7 w-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                canScrollRight 
                  ? 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-2xs hover:scale-105 active:scale-95' 
                  : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed opacity-40'
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button 
            onClick={() => router.push('/customer/book')}
            className="text-xs font-black text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 cursor-pointer flex items-center gap-1 group py-1 px-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all duration-200"
          >
            <span>Browse All</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Main Relative Container with Horizontal Scroll and Edge Fade Hints */}
      <div className="relative">
        {/* Left Fade Hint for Smooth Visual Overflow */}
        <div 
          className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`} 
        />

        {/* Right Fade Hint for Smooth Visual Overflow */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`} 
        />

        {/* Horizontally Scrollable Container with Smooth Snap & Touch-Pan */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-3.5 sm:gap-4.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory touch-pan-x overscroll-x-contain py-2 px-1 -mx-1 z-10"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {routes.map((route, i) => (
            <div
              key={route.tripId || i}
              onClick={() => handleCardClick(route)}
              className="group relative rounded-[1.6rem] overflow-hidden border border-zinc-200/80 dark:border-zinc-800 bg-zinc-950 flex flex-col w-[78vw] max-w-[250px] sm:w-[230px] md:w-[250px] shrink-0 snap-center sm:snap-start aspect-[4/5] shadow-sm hover:shadow-2xl hover:shadow-violet-500/20 dark:hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.98]"
            >
              {/* Bus Photography with smooth zoom */}
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={getRouteImage(route, i)}
                  alt={`${route.source} to ${route.destination}`}
                  fill
                  sizes="(max-width: 640px) 78vw, (max-width: 768px) 230px, 250px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-112 group-hover:rotate-0.5"
                  loading="lazy"
                />
              </div>

              {/* Multi-layered cinematic gradient overlays for high legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25 pointer-events-none" />
              <div className="absolute inset-0 bg-radial-at-t from-transparent via-transparent to-black/60 pointer-events-none" />

              {/* Top Bar: Floating Verified Rating Badge & Fare Pill */}
              <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-1.5">
                {/* Rating Badge */}
                <div className="flex items-center gap-1.2 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-amber-400/35 text-amber-300 text-[11px] font-black shadow-lg shadow-black/40">
                  <Star className="h-3.2 w-3.2 fill-amber-400 text-amber-400 shrink-0 drop-shadow-xs" />
                  <span>{route.averageRating ? Number(route.averageRating).toFixed(1) : '4.9'}</span>
                  {route.totalReviews ? (
                    <span className="text-[9.5px] text-zinc-300/90 font-medium">({route.totalReviews})</span>
                  ) : null}
                </div>

                {/* Price Pill */}
                <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-black shadow-md shadow-violet-900/40 border border-white/20 flex items-center gap-0.5">
                  <span className="text-[9px] opacity-80">₹</span>
                  <span>{route.fare}</span>
                </div>
              </div>

              {/* Top Right Floating Hover Quick Arrow */}
              <div className="absolute top-11 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 hidden sm:block">
                <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-md">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Bottom Card Content Area */}
              <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white z-10 flex flex-col gap-2 select-none">
                
                {/* Bus Details: Category Pill & Bus Number */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {route.busType ? (
                    <span className="text-[9.5px] font-extrabold text-violet-200 bg-violet-950/70 border border-violet-400/30 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 truncate max-w-full">
                      <Bus className="h-2.5 w-2.5 shrink-0 text-violet-300" />
                      <span className="truncate">{route.busType}</span>
                    </span>
                  ) : null}

                  {route.busNumber ? (
                    <span className="text-[9px] font-bold text-zinc-300 bg-black/50 border border-white/10 px-1.5 py-0.5 rounded-md backdrop-blur-xs truncate">
                      {route.busNumber}
                    </span>
                  ) : null}
                </div>

                {/* Origin ➔ Destination Route */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-sm sm:text-base font-black tracking-tight text-white drop-shadow-sm leading-tight">
                    <span className="truncate">{route.source}</span>
                    <span className="text-violet-400 shrink-0 font-normal">➔</span>
                    <span className="truncate">{route.destination}</span>
                  </div>
                </div>

                {/* Interactive Action Pill Button */}
                <div className="pt-0.5">
                  <div className="w-full py-1.8 px-3 rounded-xl bg-white/15 hover:bg-white text-white hover:text-zinc-950 backdrop-blur-md border border-white/25 text-[11px] font-black flex items-center justify-between transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-fuchsia-600 group-hover:text-white group-hover:border-violet-400/50 shadow-md">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-400 group-hover:text-white" />
                      Instant Booking
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <span>Select</span>
                      <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Mobile Indicator Pagination Dots */}
      {routes.length > 1 ? (
        <div className="flex sm:hidden items-center justify-center gap-1.5 pt-1">
          {routes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === idx 
                  ? 'w-5 bg-violet-600 dark:bg-violet-400' 
                  : 'w-1.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600'
              }`}
              aria-label={`Go to route ${idx + 1}`}
            />
          ))}
        </div>
      ) : null}

    </div>
  );
}
