import React from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import jwt from 'jsonwebtoken';
import KpiCards from './kpi-cards';
import RecentBookingsList from './recent-bookings';

export const dynamic = 'force-dynamic';
import {
  Bus,
  MapPin,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Share2,
  MessageSquare,
  PhoneCall,
  ArrowRight,
  TrendingUp,
  Percent
} from 'lucide-react';

export default async function DashboardPage() {
  // Retrieve user name from JWT cookie server-side
  let firstName = 'Ravi';
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
      const decoded: any = jwt.verify(token, jwtSecret);
      if (decoded && decoded.name) {
        firstName = decoded.name.split(' ')[0]; // Extract first name
      }
    }
  } catch (err) {
    console.error('[Dashboard Page Server] Failed to resolve name:', err);
  }

  const popularRoutes = [
    { source: 'Raipur', destination: 'Mumbai', fare: '1,099', gradient: 'from-[#ff7c52] to-[#ff2d88]', image: '/images/bus-hero.jpg' },
    { source: 'Raipur', destination: 'Delhi', fare: '1,299', gradient: 'from-blue-600 to-indigo-600', image: '/images/bus-hero.jpg' },
    { source: 'Nagpur', destination: 'Pune', fare: '799', gradient: 'from-violet-600 to-fuchsia-600', image: '/images/bus-hero.jpg' },
    { source: 'Bhopal', destination: 'Indore', fare: '699', gradient: 'from-emerald-600 to-teal-600', image: '/images/bus-hero.jpg' }
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* GREETING SECTION */}
      <div className="flex flex-col select-none">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          Good Morning, {firstName} <span className="animate-bounce">👋</span>
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
          Where would you like to go today?
        </p>
      </div>

      {/* SERVER-RENDERED KPI CARDS */}
      <KpiCards />

      {/* MAIN SPLIT GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">

        {/* LEFT COLUMN: 8 spans */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* UPCOMING TRIP SECTION */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Upcoming Trips</h3>
              <Link
                href="/customer/dashboard/trips"
                className="text-xs font-bold text-violet-600 hover:text-violet-700"
              >
                View All
              </Link>
            </div>

            {/* Trip Detail Card */}
            <div className="flex flex-col md:flex-row gap-6 p-4 border border-zinc-100 dark:border-zinc-800/50 rounded-[2.2rem] hover:shadow-md transition-shadow duration-300 relative overflow-hidden">

              {/* Bus image illustration */}
              <div className="relative w-full md:w-[180px] h-[120px] rounded-2xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 select-none">
                <Image
                  src="/images/bus-hero.jpg"
                  alt="Upcoming Trip Bus"
                  fill
                  sizes="(max-width: 768px) 100vw, 180px"
                  className="object-cover"
                  loading='lazy'
                />
              </div>

              {/* Central Information */}
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 uppercase tracking-wide">
                      ON TIME
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-lg font-black text-zinc-900 dark:text-white mt-1.5 leading-none">
                    <span>Raipur</span>
                    <span className="text-zinc-400 font-bold">→</span>
                    <span>Mumbai</span>
                  </div>

                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-2.5 block leading-none">
                    24 May 2025 • 08:30 PM
                  </div>

                  {/* Route points info */}
                  <div className="flex flex-col gap-1.5 mt-3 text-xs text-zinc-600 dark:text-zinc-400 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Swami Vivekanand Bus Stand, Raipur</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff2d88] shrink-0" />
                      <span>Bandra Kurla Complex, Mumbai</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PNR Block & View Ticket button */}
              <div className="flex flex-col md:text-right justify-between py-1 shrink-0 md:border-l border-zinc-100 dark:border-zinc-800 md:pl-6 md:w-[150px]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider leading-none">
                    PNR Number
                  </span>
                  <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 mt-2 block leading-none select-all">
                    TG12345678
                  </span>
                </div>

                <button className="mt-4 md:mt-0 py-2.5 w-full bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all duration-200">
                  View Ticket
                </button>
              </div>

            </div>

            {/* Bottom mini details bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none">
              <div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Bus Operator</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">TripGo Travels</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Seat</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">A12 (Sleeper)</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Bus Type</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">AC Sleeper (2+1)</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Fare</span>
                <span className="font-bold text-zinc-900 dark:text-white mt-1 block">₹1,250</span>
              </div>
            </div>

          </div>

          {/* CLIENT-CONNECTED RECENT BOOKINGS SECTION */}
          <RecentBookingsList />

          {/* POPULAR ROUTES GRID */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Popular Routes</h3>
              <div className="flex gap-2">
                {/* Arrow buttons for carousel layout indicators */}
                <button className="p-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-400 dark:text-zinc-300">
                  <ChevronRight className="h-4.5 w-4.5 rotate-180" />
                </button>
                <button className="p-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-400 dark:text-zinc-300">
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {popularRoutes.map((route, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 flex flex-col aspect-[4/5] hover:shadow-md transition-shadow duration-300 cursor-pointer"
                >
                  <Image
                    src={route.image}
                    alt={`${route.source} to ${route.destination}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading='lazy'
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 text-white z-10 flex flex-col select-none">
                    <span className="text-xs font-black block leading-none">
                      {route.source} → {route.destination}
                    </span>
                    <span className="text-[10px] text-zinc-300 mt-1 block">
                      From <span className="font-bold text-[#ff5666]">₹{route.fare}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REFER & EARN BANNER */}
          <div className="bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] rounded-[2rem] p-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-[#ff2d88]/10 select-none">
            <div className="absolute top-[-20%] left-[-10%] w-[200px] h-[200px] bg-white/10 rounded-full blur-[50px] pointer-events-none" />

            <div className="flex items-center gap-4.5 z-10">
              <div className="bg-white/15 p-3 rounded-2xl border border-white/20 backdrop-blur-md text-white shrink-0">
                <Share2 className="h-6 w-6" />
              </div>
              <div className="flex flex-col text-white">
                <span className="text-lg font-black leading-none">Refer & Earn Rewards</span>
                <span className="text-xs text-white/80 mt-1.5 leading-relaxed max-w-[340px] font-medium block">
                  Refer your friends and earn exciting reward points that can be redeemed for free bus ticket bookings!
                </span>
              </div>
            </div>

            <button className="py-3 px-6 bg-white text-zinc-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition-all duration-200 shrink-0 z-10">
              Refer Now
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: 4 spans */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* QUICK ACTIONS CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-white select-none">Quick Actions</h3>

            <div className="flex flex-col gap-3">
              {[
                { label: 'Booking Trips', desc: 'Search & book buses', path: '/customer/dashboard/book', color: 'bg-rose-500/10 text-rose-600 border-rose-500/15' },
                { label: 'Live Bus Tracking', desc: 'Track your bus in real-time', path: '/customer/dashboard/tracking', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/15' },
                { label: 'Cancel Ticket', desc: 'Hassle-free cancellation', path: '/customer/dashboard/bookings', color: 'bg-pink-500/10 text-pink-500 border-pink-500/15' },
                { label: 'Download Invoice', desc: 'Download your invoice bills', path: '/customer/dashboard/payments', color: 'bg-violet-500/10 text-violet-500 border-violet-500/15' }
              ].map((act, i) => (
                <Link
                  key={i}
                  href={act.path}
                  className="flex items-center justify-between p-3.5 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors duration-200 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`h-10 w-10 border rounded-xl flex items-center justify-center shrink-0 shadow-sm ${act.color}`}>
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 leading-none">
                        {act.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1 leading-none">
                        {act.desc}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4.5 w-4.5 text-zinc-400 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>

          {/* EXCLUSIVE OFFERS SLIDER PANEL */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] select-none">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Exclusive Offers</h3>
              <Link
                href="/customer/dashboard/offers"
                className="text-xs font-bold text-violet-600 hover:text-violet-700"
              >
                View All
              </Link>
            </div>

            {/* Slider container */}
            <div className="flex flex-col gap-4">

              {/* Premium coupon card */}
              <div className="relative bg-gradient-to-br from-[#533be1] to-[#a33be1] rounded-[2.2rem] p-6 text-white overflow-hidden shadow-lg flex flex-col gap-6 justify-between aspect-[1.3] group">
                {/* Decorative glows */}
                <div className="absolute top-[-10%] right-[-10%] w-[120px] h-[120px] bg-white/10 rounded-full blur-[30px] pointer-events-none" />
                <div className="absolute bottom-[-15%] left-[-15%] w-[150px] h-[150px] bg-[#ff2d88]/20 rounded-full blur-[50px] pointer-events-none" />

                {/* Background bus overlay */}
                <div className="absolute right-0 bottom-0 w-[55%] h-[60%] opacity-40 pointer-events-none">
                  <Image
                    src="/images/bus-hero.jpg"
                    alt="Offer Bus"
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover rounded-tl-[2rem]"
                    loading='lazy'
                  />
                </div>

                <div className="flex flex-col gap-1 z-10">
                  <span className="text-[10px] text-zinc-300 font-extrabold uppercase tracking-widest leading-none">Special Discount</span>
                  <span className="text-xl font-black mt-1 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-200">
                    Flat 20% OFF
                  </span>
                  <span className="text-xs text-zinc-300 font-semibold mt-1">On Your First Booking</span>
                </div>

                <div className="flex flex-col gap-3.5 z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 bg-white/15 border border-white/20 rounded-xl text-[10px] font-black tracking-widest uppercase block leading-none">
                      FIRST20
                    </span>
                    <span className="text-[10px] text-zinc-300 font-bold">Copy Code</span>
                  </div>

                  <button className="py-2.5 px-5 bg-white text-zinc-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition-all duration-200 self-start leading-none flex items-center gap-1 group/btn">
                    Book Now
                    <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                  </button>
                </div>
              </div>

              {/* Smaller coupon list */}
              <div className="flex flex-col gap-3">
                {[
                  { title: 'Upto ₹300 OFF', desc: 'On Round Trip Bookings', code: 'ROUND300' },
                  { title: 'Get 15% OFF', desc: 'On Bookings above ₹1500', code: 'SAVE15' }
                ].map((promo, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/10 hover:shadow-sm transition-shadow duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-orange-500/15">
                        <Percent className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 leading-none">
                          {promo.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1 leading-none">
                          {promo.desc}
                        </span>
                      </div>
                    </div>

                    <span className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 text-[10px] font-black tracking-wider uppercase rounded-xl leading-none select-all text-zinc-800 dark:text-zinc-200 shadow-sm">
                      {promo.code}
                    </span>
                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* NEED HELP CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] select-none">
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Need Help?</h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-1 uppercase tracking-wider">
                We are here to help you
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {/* Chat option */}
              <a
                href="/customer/dashboard/help"
                className="flex items-center gap-3.5 p-3.5 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors duration-200"
              >
                <div className="h-10 w-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/15">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 leading-none">Chat with us</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1 leading-none">Get instant online support</span>
                </div>
              </a>

              {/* Phone call option */}
              <a
                href="tel:+9118001234567"
                className="flex items-center gap-3.5 p-3.5 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors duration-200"
              >
                <div className="h-10 w-10 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center shrink-0 border border-orange-500/15">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 leading-none">Call our support</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1 leading-none">+91 1800 123 4567</span>
                </div>
              </a>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
