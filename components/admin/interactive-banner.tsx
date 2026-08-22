'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, ShieldCheck, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminInteractiveBanner() {
  const [time, setTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    toast.info(`Searching platform for: "${searchQuery}"`);
  };

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
            {greeting}, Admin! 👋
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

        {/* Interactive Search Overlay */}
        <motion.form 
          onSubmit={handleSearchSubmit}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/15 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/50 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl w-full max-w-[340px] focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all duration-300 shadow-lg self-start md:self-end"
        >
          <Search className="h-4.5 w-4.5 text-zinc-300 shrink-0" />
          <input 
            type="text" 
            placeholder="Quick search user or booking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-xs font-bold text-white placeholder-zinc-300"
          />
          <button 
            type="submit"
            className="text-[10px] uppercase font-black tracking-wider text-indigo-200 hover:text-white shrink-0 outline-none"
          >
            Go
          </button>
        </motion.form>
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
