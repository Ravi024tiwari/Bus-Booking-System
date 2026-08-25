'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, clearUser, toggleSidebar, setSidebarOpen } from '@/store';
import { 
  Bus, 
  LayoutDashboard, 
  Ticket, 
  Calendar, 
  MapPin, 
  Compass, 
  Heart, 
  CreditCard, 
  User as UserIcon, 
  Gift, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Bell,
  CheckCircle,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Redux States
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'Booking Trips', path: '/customer/book', icon: Ticket },
    { name: 'My Bookings', path: '/customer/bookings', icon: Calendar },
    { name: 'Live Tracking', path: '/customer/dashboard/tracking', icon: MapPin },
    { name: 'My Trips', path: '/customer/trips', icon: Compass },
    { name: 'Profile', path: '/customer/profile', icon: UserIcon },
    { name: 'Offers & Rewards', path: '/customer/dashboard/offers', icon: Gift },
    { name: 'Help & Support', path: '/customer/help', icon: HelpCircle },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      dispatch(clearUser());
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      
      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* SIDEBAR PANEL */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0e0a30] text-white flex flex-col justify-between p-6 z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen shrink-0 border-r border-zinc-900 overflow-y-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        <div className="flex flex-col gap-8">
          {/* Top Logo & Close Btn */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2.5 rounded-2xl border border-white/15 backdrop-blur-md flex items-center justify-center">
                <Bus className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center">
                  <span className="font-extrabold text-xl text-white tracking-tight leading-none">Trip</span>
                  <span className="font-extrabold text-xl text-[#ff5666] tracking-tight leading-none">Go</span>
                </div>
                <span className="text-[9px] text-zinc-400 font-semibold tracking-widest uppercase mt-1 block">Bus Booking</span>
              </div>
            </div>
            
            <button 
              onClick={() => dispatch(setSidebarOpen(false))}
              className="lg:hidden text-zinc-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => dispatch(setSidebarOpen(false))}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white shadow-lg shadow-[#ff2d88]/20' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-all duration-200 text-left w-full mt-4 group"
            >
              <LogOut className="h-5 w-5 text-zinc-400 group-hover:text-red-400 transition-transform duration-200 group-hover:translate-x-0.5" />
              Logout
            </button>
          </nav>
        </div>

        {/* Sidebar Upgrade Card */}
        <div className="mt-8 relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 overflow-hidden flex flex-col gap-4 shadow-xl select-none">
          <div className="absolute top-[-10%] right-[-10%] w-[100px] h-[100px] bg-gradient-to-tr from-pink-500 to-indigo-500 rounded-full blur-[40px] opacity-20 pointer-events-none" />
          
          <div className="z-10">
            <span className="text-[10px] text-[#ff7c52] font-extrabold uppercase tracking-widest block">Upgrade to</span>
            <span className="text-base font-extrabold text-white mt-0.5 flex items-center gap-1.5 leading-none">
              Premium <Crown className="h-4.5 w-4.5 text-amber-400 fill-amber-400" />
            </span>
          </div>

          <ul className="text-zinc-400 text-[11px] flex flex-col gap-1.5 font-semibold z-10">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              Exclusive Discounts
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              Priority Booking
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              Free Cancellation
            </li>
          </ul>

          <button className="w-full py-2.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all duration-200 z-10">
            Upgrade Now
          </button>
          
          {/* Sunset Road Background Bus Silhouette in Premium Card */}
          <div className="relative h-20 w-full rounded-2xl overflow-hidden mt-1 border border-white/10 shrink-0">
            <Image
              src="/images/bus-hero.jpg"
              alt="Premium Sunset route"
              fill
              sizes="(max-width: 1024px) 100vw, 216px"
              className="object-cover opacity-60"
              loading='eager'
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a30] via-transparent to-transparent" />
          </div>
        </div>

      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP NAVBAR CONTAINER */}
        <header className="h-20 bg-white dark:bg-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 sm:px-8 flex items-center justify-between z-30 shrink-0">
          
          {/* Mobile Hamburger & Logo */}
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 -ml-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-[#ff2d88]" />
              <span className="font-extrabold text-lg tracking-tight">TripGo</span>
            </div>
          </div>

          {/* Search Field (Desktop & Mobile-ish) */}
          <div className="hidden sm:flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/20 px-4 py-2.5 rounded-2xl w-full max-w-[400px] focus-within:ring-2 focus-within:ring-[#ff7c52]/30 transition-all duration-300">
            <Search className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search buses, routes, or cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs font-medium text-zinc-700 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* Right Header items (Notifications, User avatar) */}
          <div className="flex items-center gap-5 ml-auto sm:ml-0">
            
            {/* Notification Bell */}
            <button className="relative p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 rounded-2xl transition-colors duration-200 text-zinc-500 hover:text-zinc-800 dark:hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-[#ff2d88] text-[9px] font-black text-white rounded-full flex items-center justify-center border border-white dark:border-zinc-900 select-none shadow-sm">
                1
              </span>
            </button>

            {/* Profile info & Avatar */}
            <div className="flex items-center gap-3 border-l border-zinc-200 dark:border-zinc-800 pl-5">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-none">
                  {userProfile?.name || 'Ravi Tiwari'}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-1 flex items-center justify-end gap-1 leading-none">
                  Premium Member <Crown className="h-3 w-3 text-amber-500 fill-amber-500" />
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#ff2d88]/40 shrink-0 cursor-pointer shadow-md hover:scale-105 transition-transform duration-200 block outline-none">
                  <Avatar className="w-full h-full">
                    <AvatarImage 
                      src={userProfile?.avatar || '/images/rohit-avatar.jpg'} 
                      alt={userProfile?.name || 'Ravi Tiwari'} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 font-extrabold text-zinc-700 dark:text-zinc-300 flex items-center justify-center h-full w-full">
                      {userProfile?.name ? userProfile.name.split(' ').map(n => n[0]).join('') : 'RT'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 p-1.5 shadow-xl select-none z-[100]">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      My Account
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-1" />
                  <DropdownMenuItem 
                    onClick={() => router.push('/customer/profile')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors duration-150 outline-none w-full"
                  >
                    <UserIcon className="h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => router.push('/customer/profile#settings')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors duration-150 outline-none w-full"
                  >
                    <CreditCard className="h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => router.push('/customer/dashboard/trips')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors duration-150 outline-none w-full"
                  >
                    <Compass className="h-4 w-4" />
                    My Trips
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-1" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors duration-150 w-full text-left outline-none"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </div>

        </header>

        {/* SCROLLABLE MAIN CONTENT WRAPPER */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          {children}
        </main>

      </div>

    </div>
  );
}
