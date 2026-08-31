'use client';

import React, { useState } from 'react';
import { Bus } from 'lucide-react';

interface BusHeroBannerProps {
  title: string;
  description: string;
  subBadgeText?: string;
  icon?: React.ReactNode;
  backgroundImage?: string;
  bgPosition?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function BusHeroBanner({ 
  title, 
  description, 
  subBadgeText = 'Fleet Manager Console',
  icon,
  backgroundImage = '/images/bus_bg.png',
  bgPosition = 'center',
  actions,
  className = ''
}: BusHeroBannerProps) {
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHeaderHovered(true)}
      onMouseLeave={() => setIsHeaderHovered(false)}
      className={`relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden min-h-[170px] xs:min-h-[200px] sm:min-h-[240px] md:min-h-[260px] flex items-center justify-between p-6 xs:p-8 sm:p-10 md:p-12 bg-zinc-900 border border-zinc-800/80 shadow-[0_15px_40px_rgba(0,0,0,0.2)] select-none cursor-pointer group shrink-0 ${className}`}
    >
      {/* Background Image Div with Zoom transition */}
      <div 
        className="absolute inset-0 bg-cover transition-all duration-700 ease-out"
        style={{ 
          backgroundImage: `url('${backgroundImage}')`,
          backgroundPosition: bgPosition,
          transform: isHeaderHovered ? 'scale(1.05)' : 'scale(1)'
        }}
      />
      {/* Deep Translucent Overlay with Darkened Left-Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 sm:via-zinc-900/75 to-zinc-950/50 sm:to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#ff7c52]/10 via-transparent to-zinc-950/40 z-10 pointer-events-none" />

      {/* Content over background with slight hover translation */}
      <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between w-full gap-5">
        <div 
          className="flex flex-col gap-2 max-w-2xl text-left transition-all duration-500 ease-out"
          style={{
            transform: isHeaderHovered ? 'translateX(8px)' : 'translateX(0)'
          }}
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 backdrop-blur-md text-white font-black text-[11px] sm:text-xs rounded-full tracking-wider uppercase w-max border border-white/20 shadow-sm transition-colors group-hover:bg-white/25">
            {icon || <Bus className="h-3.5 w-3.5 text-[#ff5666] animate-pulse" />}
            {subBadgeText}
          </span>
          
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight sm:leading-none mt-1 drop-shadow-sm">
            {title}
          </h1>
          
          <p className="text-xs sm:text-sm text-zinc-100 sm:text-zinc-300 font-bold sm:font-semibold leading-relaxed mt-1 sm:mt-2 max-w-xl drop-shadow-xs">
            {description}
          </p>
        </div>

        {actions && (
          <div className="relative z-20 shrink-0 self-start md:self-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

