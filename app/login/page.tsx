import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Bus, 
  ShieldCheck, 
  Ticket, 
  Gift
} from 'lucide-react';
import LoginForm from './login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 font-sans">
      
      {/* LEFT SIDEBAR PANEL (Desktop Only - Rendered on Server) */}
      <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-b from-[#0e0a30] via-[#090620] to-[#050314] text-white p-12 flex-col justify-between relative overflow-hidden shrink-0 border-r border-zinc-900">
        
        {/* Subtle decorative glowing backdrops */}
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] bg-gradient-to-tr from-pink-500 to-indigo-500 rounded-full blur-[100px] opacity-15 pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[400px] h-[400px] bg-gradient-to-tr from-orange-500 to-violet-500 rounded-full blur-[120px] opacity-15 pointer-events-none" />
        
        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/10 p-2.5 rounded-2xl border border-white/15 backdrop-blur-md flex items-center justify-center">
            <Bus className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-extrabold text-2xl text-white tracking-tight leading-none">Trip</span>
              <span className="font-extrabold text-2xl text-[#ff5666] tracking-tight leading-none">Go</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase mt-1 block">Bus Booking</span>
          </div>
        </div>

        {/* Hero Welcome Back Section */}
        <div className="my-auto py-8 flex flex-col gap-6 relative z-10">
          <div className="flex flex-col gap-3">
            <h2 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Welcome Back!
            </h2>
            <div className="h-1.5 w-16 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] rounded-full" />
            <p className="text-zinc-400 text-sm max-w-sm leading-relaxed mt-1">
              Login to continue your journey and explore amazing destinations.
            </p>
          </div>
          
          {/* Sunset Bus Illustration */}
          <div className="relative mt-2 rounded-[2.5rem] overflow-hidden border border-white/10 aspect-[16/10] shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
            <Image 
              src="/images/bus-hero.jpg" 
              alt="TripGo Scenic Sunset Route"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <div>
                <span className="text-white font-bold text-base block">TripGo Sunset Cruiser</span>
                <span className="text-zinc-300 text-xs mt-0.5 block">Premium Volvo Multi-Axle AC Sleeper</span>
              </div>
              <span className="text-white text-xs bg-gradient-to-r from-orange-500 to-pink-500 backdrop-blur-md px-3 py-1 rounded-full font-semibold shadow-lg">
                Active
              </span>
            </div>
          </div>

          {/* Testimonial Card */}
          <div className="mt-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 relative overflow-hidden flex flex-col gap-4 shadow-xl">
            <span className="text-white/15 text-7xl font-serif absolute right-6 top-0 select-none pointer-events-none">”</span>
            
            <p className="text-zinc-200 text-sm italic leading-relaxed z-10">
              "TripGo made my travel so easy! Great service and best prices."
            </p>

            <div className="flex items-center gap-4 mt-1 z-10">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#ff2d88]/60 shrink-0">
                <Image
                  src="/images/rohit-avatar.jpg"
                  alt="Rohit Sharma"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-none">Rohit Sharma</span>
                <span className="text-[11px] text-zinc-400 font-semibold mt-1">Happy Traveler</span>
              </div>
              <div className="flex gap-0.5 ml-auto">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-3.5 w-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature List */}
        <div className="flex flex-col gap-5 mt-auto relative z-10">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Secure & Reliable</h4>
              <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">Your data is protected with industry-standard security.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/25">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Easy & Quick Booking</h4>
              <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">Book tickets in just a few clicks anytime, anywhere.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/25">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Exciting Offers</h4>
              <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">Get access to best deals and exclusive discounts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT LOGIN FORM PANEL (Contains interactive Client Component LoginForm) */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 relative overflow-hidden">
        
        {/* Soft floating blur backdrops */}
        <div className="absolute top-[-5%] left-[-5%] w-[250px] h-[250px] bg-[#ff7c52]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[300px] h-[300px] bg-[#ff2d88]/10 rounded-full blur-[90px] pointer-events-none" />
        
        {/* Background Skyline SVG (visible at the bottom of form panel) */}
        <div className="absolute bottom-0 left-0 right-0 w-full h-[180px] opacity-15 pointer-events-none z-0">
          <svg className="w-full h-full text-violet-600 fill-current" viewBox="0 0 1440 220" preserveAspectRatio="none">
            <path d="M0,180 L80,175 L160,180 L240,165 L320,170 L400,160 L480,168 L560,150 L640,160 L720,155 L800,162 L880,145 L960,155 L1040,150 L1120,158 L1200,140 L1280,150 L1360,145 L1440,160 L1440,220 L0,220 Z" />
            <rect x="250" y="120" width="8" height="60" rx="2" />
            <rect x="240" y="110" width="28" height="12" rx="3" />
            <path d="M220,180 L220,160 Q220,140 240,140 L268,140 Q288,140 288,160 L288,180 Z" opacity="0.5" />
            {/* Bus Stop Bench Silhouette */}
            <rect x="520" y="140" width="70" height="4" rx="2" />
            <rect x="530" y="144" width="50" height="20" rx="1" fill="none" stroke="currentColor" strokeWidth="3" />
            <line x1="535" y1="164" x2="535" y2="180" stroke="currentColor" strokeWidth="4" />
            <line x1="575" y1="164" x2="575" y2="180" stroke="currentColor" strokeWidth="4" />
            <line x1="525" y1="140" x2="525" y2="180" stroke="currentColor" strokeWidth="4" />
            <line x1="585" y1="140" x2="585" y2="180" stroke="currentColor" strokeWidth="4" />
          </svg>
        </div>

        {/* Embedded Interactive Login Form */}
        <LoginForm />
      </div>

    </div>
  );
}
