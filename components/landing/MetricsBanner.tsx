'use client';

import React from 'react';
import Image from 'next/image';
import { PullUpReveal } from './motion';

export default function MetricsBanner() {
  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 mb-20">
      <PullUpReveal yOffset={60}>
        <div className="bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#1D4ED8] text-white rounded-3xl p-8 md:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          
          <div className="flex items-center gap-4">
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
              <p className="text-xs text-blue-100">Connecting millions of smiles daily on TripGo</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center md:text-left">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white">5K+</h3>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Happy Travelers</p>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white">200+</h3>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Bus Operators</p>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white">1K+</h3>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Daily Trips</p>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white">100+</h3>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Cities Connected</p>
            </div>
          </div>

        </div>
      </PullUpReveal>
    </section>
  );
}
