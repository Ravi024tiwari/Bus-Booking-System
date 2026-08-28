'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PullUpReveal, AppleIcon } from './motion';
import { toast } from 'sonner';

export default function AppDownloadBanner() {
  const [tiltStyle, setTiltStyle] = useState({});
  const bannerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bannerRef.current || window.innerWidth < 768) return;
    const rect = bannerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 30;
    const angleY = (x - xc) / 30;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`,
      transition: 'transform 0.1s ease-out',
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
      transition: 'transform 0.5s ease-out',
    });
  };

  return (
    <section id="app" className="max-w-[1400px] mx-auto px-4 md:px-8 mb-20">
      <PullUpReveal yOffset={70}>
        <div
          ref={bannerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={tiltStyle}
          className="bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#1D4ED8] text-white rounded-3xl p-8 md:p-14 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden"
        >
          {/* Ambient Glows */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-300/30 rounded-full blur-[100px]" />
          </div>

          {/* Left Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left gap-3.5 z-10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF6B00] bg-white/10 px-3 py-1 rounded-full border border-white/20">
              DOWNLOAD OUR APP
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Book on the Go with TripGo!
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-md leading-relaxed">
              Get the TripGo app for a faster booking experience, real-time live bus GPS tracking, and exclusive promo offers.
            </p>

            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                onClick={() => toast.info('Android APK / Google Play download starting soon!')}
                className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs h-11 px-5 rounded-xl flex items-center gap-2 shadow-md"
              >
                <Smartphone className="h-4 w-4 text-emerald-600" /> Google Play
              </Button>
              <Button
                onClick={() => toast.info('iOS App Store release coming next month!')}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-xs h-11 px-5 rounded-xl flex items-center gap-2 shadow-md"
              >
                <AppleIcon className="h-4 w-4 text-white" /> App Store
              </Button>
            </div>
          </div>

          {/* Right Bus / Mockup Image */}
          <div className="lg:col-span-5 relative h-56 sm:h-72 w-full flex items-center justify-center">
            <Image
              src="/images/bus-hero.jpg"
              alt="TripGo App Banner"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover rounded-2xl border border-white/20 shadow-xl"
            />
          </div>
        </div>
      </PullUpReveal>
    </section>
  );
}
