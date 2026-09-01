'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setUser, clearUser, toggleSidebar, setSidebarOpen } from '@/store';
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

  // Sync customer profile on mount from localStorage or API
  useEffect(() => {
    const syncProfile = async () => {
      // 1. Try loading from localStorage first
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('user_profile');
        if (saved) {
          try {
            const profile = JSON.parse(saved);
            dispatch(setUser(profile));
            return;
          } catch (e) {
            console.error('Failed to parse user profile from localStorage:', e);
          }
        }
      }

      // 2. Fallback to API if not in localStorage
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data?.success && response.data?.data) {
          const u = response.data.data;
          // Check role validation
          if (u.role !== 'passenger') {
            toast.error('Unauthorized access. Redirecting...');
            router.replace('/login');
            return;
          }
          dispatch(setUser({
            id: u._id || u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.profileImage || u.avatar || '/images/rohit-avatar.jpg'
          }));
        }
      } catch (err: any) {
        console.error('Failed to load customer profile:', err);
        toast.error('Failed to load session. Please log in.');
        router.replace('/login');
      }
    };

    if (!userProfile) {
      syncProfile();
    }
  }, [dispatch, userProfile, router]);

  const menuItems = [
    { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'Booking Trips', path: '/customer/book', icon: Ticket },
    { name: 'My Bookings', path: '/customer/bookings', icon: Calendar },
    { name: 'Live Tracking', path: '/customer/tracking', icon: MapPin },
    { name: 'My Trips', path: '/customer/trips', icon: Compass },
    { name: 'Profile', path: '/customer/profile', icon: UserIcon },
    { name: 'Offers & Rewards', path: '/customer/offers', icon: Gift },
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
    <div className="min-h-screen flex bg-background font-sans text-foreground">
      
      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* SIDEBAR PANEL */}
      <aside className={`fixed inset-y-0 left-0 bg-[#0e0a30] text-white flex flex-col justify-between p-4 sm:p-5 z-50 transition-all duration-300 ease-in-out shrink-0 border-r border-zinc-900 overflow-y-auto overflow-x-hidden ${
        sidebarOpen 
          ? 'translate-x-0 w-64 lg:static lg:h-screen' 
          : '-translate-x-full lg:translate-x-0 lg:w-20 lg:static lg:h-screen'
      }`}>
        
        <div className="flex flex-col gap-6">
          {/* Top Logo & Toggle/Close Btn */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${!sidebarOpen ? 'lg:justify-center lg:w-full' : ''}`}>
              <div className="bg-white/10 p-2.5 rounded-2xl border border-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
                <Bus className="h-5 w-5 text-white" />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col min-w-0 transition-opacity duration-200">
                  <div className="flex items-center">
                    <span className="font-extrabold text-xl text-white tracking-tight leading-none">Trip</span>
                    <span className="font-extrabold text-xl text-[#ff5666] tracking-tight leading-none">Go</span>
                  </div>
                  <span className="text-[9px] text-zinc-400 font-semibold tracking-widest uppercase mt-1 block truncate">Bus Booking</span>
                </div>
              )}
            </div>
            
            {/* Mobile close button */}
            <button 
              onClick={() => dispatch(setSidebarOpen(false))}
              className="lg:hidden text-zinc-400 hover:text-white p-1"
            >
              <X className="h-5 w-5" />
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
                  title={item.name}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      dispatch(setSidebarOpen(false));
                    }
                  }}
                  className={`flex items-center gap-3.5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group select-none ${
                    sidebarOpen ? 'px-4' : 'lg:px-0 lg:justify-center px-4'
                  } ${
                    isActive 
                      ? 'bg-linear-to-r from-[#ff7c52] to-[#ff2d88] text-white shadow-lg shadow-[#ff2d88]/20' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                  {sidebarOpen && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Logout"
              className={`flex items-center gap-3.5 py-3 rounded-2xl text-sm font-bold text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-all duration-200 text-left w-full mt-4 group select-none ${
                sidebarOpen ? 'px-4' : 'lg:px-0 lg:justify-center px-4'
              }`}
            >
              <LogOut className="h-5 w-5 shrink-0 text-zinc-400 group-hover:text-red-400 transition-transform duration-200 group-hover:translate-x-0.5" />
              {sidebarOpen && (
                <span className="truncate">Logout</span>
              )}
            </button>
          </nav>
        </div>

      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP NAVBAR CONTAINER */}
        <header className="h-20 bg-white dark:bg-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/50 px-4 sm:px-8 flex items-center justify-between z-30 shrink-0 select-none">
          
          {/* Sidebar Toggle & Mobile Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => dispatch(toggleSidebar())}
              className="p-2.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 cursor-pointer outline-none"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <Bus className="h-5 w-5 text-[#ff2d88]" />
              <span className="font-extrabold text-lg tracking-tight">TripGo</span>
            </div>
          </div>

          {/* Right Header items (Profile info & Avatar) */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-none">
                  {userProfile?.name}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-1 flex items-center justify-end gap-1 leading-none">
                  Customer Account
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#ff2d88]/40 shrink-0 cursor-pointer shadow-md hover:scale-105 transition-transform duration-200 block outline-none">
                  <Avatar className="w-full h-full">
                    <AvatarImage 
                      src={userProfile?.avatar} 
                      alt={userProfile?.name} 
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
                    onClick={() => router.push('/customer/trips')}
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
