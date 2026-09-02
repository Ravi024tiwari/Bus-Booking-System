'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, ArrowLeftRight, Users, Building2, Compass, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { POPULAR_CITIES } from './types';
import { PullUpReveal } from './motion';
import { toast } from 'sonner';

interface SearchWidgetProps {
  fromCity: string;
  toCity: string;
  travelDate: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onDateChange: (val: string) => void;
  onSwapCities: () => void;
  onSearch: () => void;
}

function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const elementRef = React.useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  React.useEffect(() => {
    if (!hasStarted) return;

    let start = 0;
    const end = value;
    const totalFrames = Math.min(end, 60 * duration);
    const increment = end / totalFrames;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      start += increment;
      if (frame >= totalFrames) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, (duration * 1000) / totalFrames);

    return () => clearInterval(timer);
  }, [hasStarted, value, duration]);

  return <span ref={elementRef}>{count.toLocaleString()}+</span>;
}

export default function SearchWidget({
  fromCity,
  toCity,
  travelDate,
  onFromChange,
  onToChange,
  onDateChange,
  onSwapCities,
  onSearch,
}: SearchWidgetProps) {
  const [showFromList, setShowFromList] = useState(false);
  const [showToList, setShowToList] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCity || !toCity) {
      toast.error('Please enter both departure and destination cities');
      return;
    }
    onSearch();
  };

  return (
    <div className="w-full relative z-20">
      
      {/* Search Input Box */}
      <PullUpReveal yOffset={35} delay={0.2}>
        <div className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200/80 dark:border-zinc-800 p-4 md:p-6 rounded-[28px] shadow-2xl shadow-black/20 mt-10 md:mt-12">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            
            {/* Departure */}
            <div className="lg:col-span-4 relative flex flex-col gap-1 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">From</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-[#ff5666]" />
                <Input
                  type="text"
                  placeholder="Starting Point (e.g. Delhi)"
                  className="pl-10 pr-8 bg-zinc-50 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700/80 focus-visible:ring-2 focus-visible:ring-[#ff2d88] text-sm font-semibold h-12 rounded-xl text-zinc-800 dark:text-zinc-100"
                  value={fromCity}
                  onChange={(e) => {
                    onFromChange(e.target.value);
                    setShowFromList(true);
                  }}
                  onFocus={() => setShowFromList(true)}
                  onBlur={() => setTimeout(() => setShowFromList(false), 200)}
                />
                <AnimatePresence>
                  {showFromList && (
                    <motion.ul
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden max-h-48 overflow-y-auto"
                    >
                      {POPULAR_CITIES.filter((c) => c.toLowerCase().includes(fromCity.toLowerCase())).map((city) => (
                        <li
                          key={city}
                          onMouseDown={() => onFromChange(city)}
                          className="px-4 py-2 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer text-zinc-700 dark:text-zinc-200 flex items-center justify-between"
                        >
                          <span>{city}</span>
                          <span className="text-[10px] text-zinc-400 uppercase">Hub</span>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* City Swap Button */}
            <div className="hidden lg:flex lg:col-span-1 justify-center items-end pb-0.5">
              <button
                type="button"
                onClick={onSwapCities}
                className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-600 dark:text-zinc-300 hover:text-[#ff2d88] rounded-full transition-all hover:rotate-180 duration-300 cursor-pointer"
                title="Swap Cities"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            </div>

            {/* Destination */}
            <div className="lg:col-span-3 relative flex flex-col gap-1 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">To</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-[#ff2d88]" />
                <Input
                  type="text"
                  placeholder="Destination (e.g. Jaipur)"
                  className="pl-10 bg-zinc-50 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700/80 focus-visible:ring-2 focus-visible:ring-[#ff2d88] text-sm font-semibold h-12 rounded-xl text-zinc-800 dark:text-zinc-100"
                  value={toCity}
                  onChange={(e) => {
                    onToChange(e.target.value);
                    setShowToList(true);
                  }}
                  onFocus={() => setShowToList(true)}
                  onBlur={() => setTimeout(() => setShowToList(false), 200)}
                />
                <AnimatePresence>
                  {showToList && (
                    <motion.ul
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden max-h-48 overflow-y-auto"
                    >
                      {POPULAR_CITIES.filter((c) => c.toLowerCase().includes(toCity.toLowerCase())).map((city) => (
                        <li
                          key={city}
                          onMouseDown={() => onToChange(city)}
                          className="px-4 py-2 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer text-zinc-700 dark:text-zinc-200 flex items-center justify-between"
                        >
                          <span>{city}</span>
                          <span className="text-[10px] text-zinc-400 uppercase">Hub</span>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Date */}
            <div className="lg:col-span-2 flex flex-col gap-1 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-[#ff5666] pointer-events-none" />
                <Input
                  type="date"
                  className="pl-10 bg-zinc-50 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700/80 focus-visible:ring-2 focus-visible:ring-[#ff2d88] text-xs font-semibold h-12 rounded-xl text-zinc-800 dark:text-zinc-100"
                  value={travelDate}
                  onChange={(e) => onDateChange(e.target.value)}
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="lg:col-span-2 flex flex-col justify-end">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:from-[#ff6b40] hover:to-[#ea1f7b] text-white font-black h-12 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ff2d88]/25 cursor-pointer transition-transform active:scale-95"
              >
                <Search className="h-4 w-4" /> Search Buses
              </Button>
            </div>
          </form>
        </div>
      </PullUpReveal>

      {/* Floating Counter Badges */}
      <PullUpReveal yOffset={30} delay={0.3}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Happy Travelers', value: 5000, icon: Users },
            { label: 'Bus Operators', value: 200, icon: Building2 },
            { label: 'Daily Trips', value: 1000, icon: Compass },
            { label: 'Customer Support', isStatic: '24/7', icon: Clock },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl shadow-xs"
            >
              <div className="p-2.5 bg-gradient-to-br from-[#ff7c52]/20 to-[#ff2d88]/20 text-[#ff5666] border border-white/10 rounded-xl shrink-0">
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h4 className="text-lg md:text-xl font-extrabold text-white leading-none">
                  {stat.isStatic ? stat.isStatic : <AnimatedCounter value={stat.value!} />}
                </h4>
                <p className="text-[10px] font-bold text-zinc-300 mt-1 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </PullUpReveal>

    </div>
  );
}
