'use client';

import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

// Curated destination-specific high-resolution travel photography
const DESTINATION_IMAGES: Record<string, string> = {
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
  pune: 'https://images.unsplash.com/photo-1600100397608-f010f421a97d?auto=format&fit=crop&w=600&q=80',
  indore: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80',
  jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
  hyderabad: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=600&q=80',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
  bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
  bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
  chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
  coimbatore: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80',
  raipur: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
  nagpur: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&w=600&q=80',
  bhopal: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=600&q=80'
};

const DEFAULT_ROUTE_IMAGES = [
  'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80', // Mumbai
  'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80', // Delhi
  'https://images.unsplash.com/photo-1600100397608-f010f421a97d?auto=format&fit=crop&w=600&q=80', // Pune
  'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80', // Indore
  'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80', // Jaipur
  'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=600&q=80', // Hyderabad
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80', // Goa
  'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80', // Bengaluru
];

function getRouteImage(route: { destination?: string; source?: string; image?: string }, index: number): string {
  if (route.image && route.image !== '/images/bus-hero.jpg') {
    return route.image;
  }
  const dest = route.destination?.toLowerCase().trim() || '';
  if (DESTINATION_IMAGES[dest]) {
    return DESTINATION_IMAGES[dest];
  }
  const src = route.source?.toLowerCase().trim() || '';
  if (DESTINATION_IMAGES[src]) {
    return DESTINATION_IMAGES[src];
  }
  return DEFAULT_ROUTE_IMAGES[index % DEFAULT_ROUTE_IMAGES.length];
}

export default function PopularRoutes() {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { popularRoutes } = useSelector((state: RootState) => state.customerDashboard);

  const routes = popularRoutes && popularRoutes.length > 0 ? popularRoutes : [
    { 
      source: 'Raipur', 
      destination: 'Mumbai', 
      fare: '1,099', 
      image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80' 
    },
    { 
      source: 'Raipur', 
      destination: 'Delhi', 
      fare: '1,299', 
      image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80' 
    },
    { 
      source: 'Nagpur', 
      destination: 'Pune', 
      fare: '799', 
      image: 'https://images.unsplash.com/photo-1600100397608-f010f421a97d?auto=format&fit=crop&w=600&q=80' 
    },
    { 
      source: 'Bhopal', 
      destination: 'Indore', 
      fare: '699', 
      image: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80' 
    },
    { 
      source: 'Delhi', 
      destination: 'Jaipur', 
      fare: '499', 
      image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80' 
    },
    { 
      source: 'Bengaluru', 
      destination: 'Hyderabad', 
      fare: '899', 
      image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=600&q=80' 
    },
    { 
      source: 'Mumbai', 
      destination: 'Goa', 
      fare: '1,199', 
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80' 
    },
    { 
      source: 'Chennai', 
      destination: 'Coimbatore', 
      fare: '649', 
      image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80' 
    }
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden select-none">
      {/* Header with Title and Scroll Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Popular Routes</h3>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30">
            <Sparkles className="h-2.5 w-2.5" /> Top picks
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Scroll Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => handleScroll('left')}
              className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer active:scale-90"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={() => handleScroll('right')}
              className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer active:scale-90"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button 
            onClick={() => router.push('/customer/book')}
            className="text-xs font-bold text-violet-600 hover:text-violet-700 cursor-pointer flex items-center gap-1 group"
          >
            Browse All
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Container with uniform dimensions */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-1 -mx-1"
      >
        {routes.map((route, i) => (
          <div
            key={i}
            onClick={() => router.push(`/customer/book?from=${encodeURIComponent(route.source)}&to=${encodeURIComponent(route.destination)}`)}
            className="group relative rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 flex flex-col w-[170px] sm:w-[190px] md:w-[200px] shrink-0 snap-start aspect-[4/5] shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98]"
          >
            <Image
              src={getRouteImage(route, i)}
              alt={`${route.source} to ${route.destination}`}
              fill
              sizes="(max-width: 768px) 170px, 200px"
              className="object-cover transition-transform duration-500 group-hover:scale-108"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="absolute top-3 right-3 z-10">
              <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md border border-white/15 text-[10px] font-extrabold text-white">
                ₹{route.fare}
              </span>
            </div>

            <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white z-10 flex flex-col select-none">
              <span className="text-xs font-black block leading-tight truncate">
                {route.source} → {route.destination}
              </span>
              <span className="text-[10px] text-zinc-300 mt-1 flex items-center gap-1 font-medium">
                Book tickets <ArrowRight className="h-2.5 w-2.5 opacity-70 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
