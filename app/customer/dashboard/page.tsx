import React from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import jwt from 'jsonwebtoken';
import KpiCards from './kpi-cards';
import UpcomingTripCard from './upcoming-trip-card';
import RecentBookingsList from './recent-bookings';
import PopularRoutes from './popular-routes';
import ExclusiveOffers from './exclusive-offers';

import { getTopRatedPopularRoutes } from '@/lib/popular-routes';
import { getActiveDiscountedOffers } from '@/lib/offers';

export const dynamic = 'force-dynamic';

import {
  Ticket,
  ChevronRight,
  Share2,
  MessageSquare,
  PhoneCall,
  ArrowRight,
  Percent
} from 'lucide-react';

export default async function DashboardPage() {
  // Retrieve user name from JWT cookie server-side
  let firstName = 'Traveler';
  let popularRoutes: any[] = [];
  let discountedOffers: any[] = [];
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
      const decoded: any = jwt.verify(token, jwtSecret);
      if (decoded && decoded.name) {
        firstName = decoded.name.split(' ')[0]; 
      }
    }
  } catch (err) {
    console.error('[Dashboard Page Server] Failed to resolve name:', err);
  }

  try {
    popularRoutes = await getTopRatedPopularRoutes(6);
  } catch (err) {
    console.error('[Dashboard Page Server] Failed to load popular routes:', err);
  }

  try {
    discountedOffers = await getActiveDiscountedOffers(5);
  } catch (err) {
    console.error('[Dashboard Page Server] Failed to load discounted offers:', err);
  }

  // Dynamic greeting based on current hour
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex flex-col gap-6">

      {/* GREETING SECTION */}
      <div className="flex flex-col select-none">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          {greeting}, {firstName} 
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
          Where would you like to travel today?
        </p>
      </div>

      {/* REACTIVE / DB-CONNECTED KPI CARDS */}
      <KpiCards />

      {/* MAIN SPLIT GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">

        {/* LEFT COLUMN: 8 spans */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* DYNAMIC UPCOMING TRIP CARD */}
          <UpcomingTripCard />

          {/* CLIENT-CONNECTED RECENT BOOKINGS SECTION */}
          <RecentBookingsList />

          {/* DYNAMIC POPULAR ROUTES GRID */}
          <PopularRoutes initialRoutes={popularRoutes} />

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

            <Link
              href="/customer/offers"
              className="py-3 px-6 bg-white text-zinc-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition-all duration-200 shrink-0 z-10 inline-block text-center"
            >
              Refer Now
            </Link>
          </div>

        </div>

        {/* RIGHT COLUMN: 4 spans */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* QUICK ACTIONS CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-white select-none">Quick Actions</h3>

            <div className="flex flex-col gap-3">
              {[
                { label: 'Booking Trips', desc: 'Search & book buses', path: '/customer/book', color: 'bg-rose-500/10 text-rose-600 border-rose-500/15' },
                { label: 'Live Bus Tracking', desc: 'Track your bus in real-time', path: '/customer/tracking', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/15' },
                { label: 'Cancel Ticket', desc: 'Hassle-free cancellation', path: '/customer/bookings', color: 'bg-pink-500/10 text-pink-500 border-pink-500/15' },
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

          {/* DYNAMIC EXCLUSIVE OFFERS PANEL */}
          <ExclusiveOffers initialOffers={discountedOffers} />

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
              <Link
                href="/customer/help"
                className="flex items-center gap-3.5 p-3.5 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors duration-200"
              >
                <div className="h-10 w-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/15">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 leading-none">Chat with us</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1 leading-none">Get instant online support</span>
                </div>
              </Link>

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
