'use client';

import React, { useState } from 'react';
import { Bus, LucideIcon } from 'lucide-react';

interface BusHeroBannerProps {
  title: string;
  description: string;
  subBadgeText?: string;
  icon?: React.ReactNode;
}

export default function BusHeroBanner({ 
  title, 
  description, 
  subBadgeText = 'Fleet Manager Console',
  icon
}: BusHeroBannerProps) {
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHeaderHovered(true)}
      onMouseLeave={() => setIsHeaderHovered(false)}
      className="relative rounded-[2.5rem] overflow-hidden min-h-[240px] sm:min-h-[260px] md:min-h-[280px] flex items-center p-8 sm:p-10 md:p-12 bg-zinc-900 border border-zinc-850 shadow-[0_15px_40px_rgba(0,0,0,0.2)] select-none cursor-pointer group shrink-0"
    >
      {/* Background Image Div with Zoom transition */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out"
        style={{ 
          backgroundImage: "url('/images/bus_bg.png')",
          transform: isHeaderHovered ? 'scale(1.05)' : 'scale(1)'
        }}
      />
      {/* Deep Translucent Overlay with Darkened Left-Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-900/70 to-transparent z-10" />

      {/* Content over background with slight hover translation */}
      <div 
        className="relative z-20 flex flex-col gap-3 max-w-2xl text-left transition-all duration-500 ease-out"
        style={{
          transform: isHeaderHovered ? 'translateX(8px)' : 'translateX(0)'
        }}
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md text-white font-extrabold text-[10px] rounded-full tracking-wider uppercase w-max border border-white/10 transition-colors group-hover:bg-white/20">
          {icon || <Bus className="h-3 w-3 text-[#ff5666] animate-pulse" />}
          {subBadgeText}
        </span>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none mt-1">
          {title}
        </h1>
        
        <p className="text-xs sm:text-sm text-zinc-300 dark:text-zinc-400 font-semibold leading-relaxed mt-3">
          {description}
        </p>
      </div>
    </div>
  );
}
