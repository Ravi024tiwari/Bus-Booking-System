'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import SearchWidget from './SearchWidget';
import { customEase } from './motion';

interface HeroSectionProps {
  fromCity: string;
  toCity: string;
  travelDate: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onDateChange: (val: string) => void;
  onSwapCities: () => void;
  onSearch: () => void;
}

export default function HeroSection({
  fromCity,
  toCity,
  travelDate,
  onFromChange,
  onToChange,
  onDateChange,
  onSwapCities,
  onSearch,
}: HeroSectionProps) {
  return (
    <section
      id="home"
      className="relative bg-gradient-to-b from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white pt-32 pb-20 md:pb-28 rounded-b-[40px] md:rounded-b-[60px] shadow-2xl overflow-hidden"
    >
      {/* Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
        <div className="absolute top-[-10%] right-[-10%] w-[550px] h-[550px] bg-cyan-400/25 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] bg-orange-500/20 rounded-full blur-[130px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* Main Hero Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 flex flex-col items-start text-left z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full py-1.5 px-4 text-xs font-semibold text-white mb-6 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" /> Your Journey, Our Responsibility
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: customEase }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]"
            >
              Smart Bus Booking <br />
              for a <span className="text-[#FF6B00]">Better Journey</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: customEase }}
              className="text-sm md:text-base text-blue-100 mt-5 leading-relaxed max-w-lg"
            >
              Discover, compare, and book bus trips across cities with ease on TripGo. Safe, reliable, and comfortable travel – all in one place with instant booking confirmations.
            </motion.p>
          </div>

          {/* Right Bus Hero Image */}
          <div className="lg:col-span-6 relative w-full h-[280px] sm:h-[360px] md:h-[420px] lg:h-[460px] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: customEase }}
              className="relative w-full h-full"
            >
              <Image
                src="/images/bus-hero.jpg"
                alt="TripGo Luxury Multi-Axle Bus"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover rounded-3xl shadow-2xl border border-white/20 select-none"
                priority
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#1E40AF]/80 via-transparent to-transparent pointer-events-none" />

              {/* Live Tracking GPS Pill */}
              <div className="absolute bottom-4 left-4 bg-slate-950/75 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-lg text-xs font-semibold text-white">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Live GPS & Telemetry Active
              </div>
            </motion.div>
          </div>

        </div>

        {/* Search Booking Widget */}
        <SearchWidget
          fromCity={fromCity}
          toCity={toCity}
          travelDate={travelDate}
          onFromChange={onFromChange}
          onToChange={onToChange}
          onDateChange={onDateChange}
          onSwapCities={onSwapCities}
          onSearch={onSearch}
        />

      </div>
    </section>
  );
}
