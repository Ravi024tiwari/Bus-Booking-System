'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminInteractiveBanner() {
  const [time, setTime] = useState<Date | null>(null);
  const [greeting, setGreeting] = useState('Welcome');

  // Real-time clock and greeting logic
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    return () => clearInterval(timer);
  }, []);

  const formattedTime = time ? time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) : '';

  const formattedDate = time ? time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : '';

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative rounded-[2.5rem] overflow-hidden min-h-[220px] md:min-h-[260px] flex flex-col justify-between p-6 md:p-8 shadow-xl select-none group border border-zinc-200/20"
    >
      {/* Banner background image with zoom transition */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-[1.02]"
        style={{ backgroundImage: `url('/images/admin_banner.jpeg')` }}
      />
      {/* High-quality dark overlay with purple tint to ensure perfect readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-zinc-950/60 to-indigo-950/30 dark:from-zinc-950/90 dark:via-zinc-950/70 dark:to-indigo-950/50" />

      {/* Top row status */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/10 dark:bg-zinc-900/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-[10px] sm:text-xs font-bold shadow-md">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          Super Admin Console
        </div>

        {/* Real-time Clock Widget */}
        {time && (
          <div className="flex items-center gap-2.5 bg-white/10 dark:bg-zinc-900/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white font-mono text-xs shadow-md">
            <Clock className="h-3.5 w-3.5 text-indigo-300 animate-pulse shrink-0" />
            <span className="font-extrabold">{formattedTime}</span>
          </div>
        )}
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mt-4 md:mt-8">
        
        {/* Greetings and Platform Description */}
        <div className="flex flex-col max-w-xl text-white">
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight"
          >
            {greeting}, Admin!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-zinc-300 dark:text-zinc-400 text-xs sm:text-sm font-medium mt-2 leading-relaxed"
          >
            Here's what's happening across your bus booking platform today. You can monitor bookings, approve operators, manage fleets, and track daily earnings.
          </motion.p>
        </div>


      </div>

      {/* Date badge */}
      {time && (
        <div className="relative z-10 text-[10px] font-bold text-indigo-200 mt-4 md:mt-2 select-none">
          {formattedDate}
        </div>
      )}
    </motion.div>
  );
}
