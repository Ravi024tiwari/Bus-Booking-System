'use client';

import React from 'react';
import Image from 'next/image';
import { PullUpReveal } from './motion';

export default function MetricsBanner() {
  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 mb-20">
      <PullUpReveal yOffset={60}>
        <div className="bg-gradient-to-r from-[#0e0a30] via-[#170f44] to-[#0e0a30] border border-white/10 text-white rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff2d88]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ff7c52]/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative h-16 w-32 shrink-0">
              <Image 
                src="/images/volvo2.png" 
                alt="TripGo Bus Fleet" 
                fill 
                sizes="128px"
                className="object-contain"
              />
            </div>
            <div className="hidden sm:block text-left">
              <h4 className="font-extrabold text-base text-white">India&apos;s Preferred Network</h4>
              <p className="text-xs text-zinc-300">Connecting millions of smiles daily on TripGo</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center md:text-left relative z-10">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white">5K+</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Happy Travelers</p>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white">200+</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Bus Operators</p>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white">1K+</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Daily Trips</p>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white">100+</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Cities Connected</p>
            </div>
          </div>

        </div>
      </PullUpReveal>
    </section>
  );
}
