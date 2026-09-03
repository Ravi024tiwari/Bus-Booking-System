'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setUser, clearUser, toggleSidebar, setSidebarOpen } from '@/store';
import axios from 'axios';
import { 
  Bus, 
  LayoutDashboard, 
  Calendar, 
  MapPin, 
  User as UserIcon, 
  MessageSquare,
  LogOut, 
  Menu, 
  X, 
  Bell,
  CheckCircle,
  Crown,
  Sparkles
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

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Redux States
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  // Ref to suppress fetchProfile when logging out
  const isLoggingOutRef = React.useRef(false);

  // Fetch operator profile on mount to ensure Redux sync
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (isLoggingOutRef.current) return;
      try {
        const response = await axios.get('/api/auth/me');
        if (!isMounted || isLoggingOutRef.current) return;
        if (response.data?.success && response.data?.data) {
          const u = response.data.data;
          // Check role validation just in case
          if (u.role !== 'operator') {
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
        if (!isMounted || isLoggingOutRef.current) return;
        if (err.response?.status === 401) {
          router.replace('/login');
          return;
        }
        console.error('Failed to load operator profile:', err);
        toast.error('Failed to load session. Please log in.');
        router.replace('/login');
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [dispatch, router]);

  // Detect if page was restored from browser back-forward cache (BFCache)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Force refresh from server to ensure unauthenticated pages are not restored from memory
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/operator/dashboard', icon: LayoutDashboard },
    { name: 'My Buses', path: '/operator/buses', icon: Bus },
    { name: 'Trips', path: '/operator/trips', icon: Calendar },
    { name: 'Live Tracking', path: '/operator/tracking', icon: MapPin },
    { name: 'Reviews', path: '/operator/reviews', icon: MessageSquare },
    { name: 'Profile', path: '/operator/profile', icon: UserIcon },
  ];

  const handleLogout = async () => {
    try {
      isLoggingOutRef.current = true;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_profile');
      }
      await fetch('/api/auth/logout', { method: 'POST' });
      dispatch(clearUser());
      toast.success('Logged out successfully');
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      } else {
        router.replace('/login');
      }
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
          {/* Top Logo & Close Btn */}
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
                  <span className="text-[9px] text-zinc-400 font-semibold tracking-widest uppercase mt-1 block truncate">Operator Panel</span>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => dispatch(setSidebarOpen(false))}
              className="lg:hidden text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/operator/dashboard'
                ? pathname === '/operator/dashboard'
                : pathname === item.path || pathname.startsWith(`${item.path}/`);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      dispatch(setSidebarOpen(false));
                    }
                  }}
                  className={`flex items-center gap-3.5 py-3 lg:py-3.5 rounded-2xl font-extrabold text-sm lg:text-base transition-all duration-200 group select-none ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white shadow-lg shadow-[#ff2d88]/25' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  } ${
                    sidebarOpen ? 'px-4' : 'lg:px-0 lg:justify-center px-4'
                  }`}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <Icon className={`h-5 w-5 lg:h-5.5 lg:w-5.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                  {sidebarOpen && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User summary in sidebar */}
        <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3.5 py-3 lg:py-3.5 rounded-2xl font-extrabold text-sm lg:text-base text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200 cursor-pointer w-full group ${
              sidebarOpen ? 'px-4' : 'lg:px-0 lg:justify-center px-4'
            }`}
          >
            <LogOut className="h-5 w-5 lg:h-5.5 lg:w-5.5 shrink-0 text-zinc-400 group-hover:text-red-400 transition-transform duration-200 group-hover:translate-x-0.5" />
            {sidebarOpen && (
              <span className="truncate">Logout</span>
            )}
          </button>
        </div>

      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP NAVBAR CONTAINER */}
        <header className="h-20 lg:h-22 bg-white dark:bg-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/50 px-4 sm:px-8 flex items-center justify-between z-30 shrink-0 select-none">
          
          {/* Sidebar Toggle & Mobile Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => dispatch(toggleSidebar())}
              className="p-2.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 cursor-pointer outline-none"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu className="h-5 w-5 lg:h-6 lg:w-6" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <Bus className="h-5 w-5 text-[#ff2d88]" />
              <span className="font-extrabold text-lg tracking-tight">TripGo</span>
            </div>

            {/* Portal Badge / Title */}
            <div className="hidden sm:flex items-center gap-2.5 pl-2">
              <span className="text-xs lg:text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                Operator Portal
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] lg:text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Active
              </span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Notification Bell */}
            <button className="relative p-2.5 lg:p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 rounded-2xl transition-colors duration-200 text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer">
              <Bell className="h-5 w-5 lg:h-5.5 lg:w-5.5" />
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-[#ff2d88] text-[9px] font-black text-white rounded-full flex items-center justify-center border border-white dark:border-zinc-900 select-none shadow-sm">
                0
              </span>
            </button>

            {/* Profile info & Avatar */}
            <div className="flex items-center gap-3 border-l border-zinc-200 dark:border-zinc-800 pl-3 sm:pl-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm lg:text-base font-extrabold text-zinc-800 dark:text-zinc-100 leading-none">
                  {userProfile?.name || 'Operator'}
                </span>
                <span className="text-[10px] lg:text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1 flex items-center justify-end gap-1 leading-none">
                  Operator Verified <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="relative w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full overflow-hidden border-2 border-[#ff2d88]/40 shrink-0 cursor-pointer shadow-md hover:scale-105 transition-transform duration-200 block outline-none">
                  <Avatar className="w-full h-full">
                    <AvatarImage 
                      src={userProfile?.avatar || '/images/rohit-avatar.jpg'} 
                      alt={userProfile?.name || 'Operator'} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 font-extrabold text-zinc-700 dark:text-zinc-300 flex items-center justify-center h-full w-full">
                      {userProfile?.name ? userProfile.name.split(' ').map(n => n[0]).join('') : 'OP'}
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
                    onClick={() => router.push('/operator/profile')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors duration-150 outline-none w-full"
                  >
                    <UserIcon className="h-4 w-4" />
                    My Profile
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
