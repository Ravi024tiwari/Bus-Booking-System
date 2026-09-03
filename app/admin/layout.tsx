'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setUser, clearUser, toggleSidebar, setSidebarOpen } from '@/store';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Bus, 
  LayoutDashboard, 
  Users,
  Building2,
  MapPin, 
  Calendar, 
  CreditCard,
  Tag,
  BarChart3,
  Bell,
  HelpCircle,
  Settings,
  LogOut, 
  Menu, 
  X
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch admin profile on mount to ensure session validity
  // Ref to suppress fetchProfile when logging out
  const isLoggingOutRef = React.useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (isLoggingOutRef.current) return;
      try {
        const response = await axios.get('/api/auth/me');
        if (!isMounted || isLoggingOutRef.current) return;
        if (response.data?.success && response.data?.data) {
          const u = response.data.data;
          if (u.role !== 'admin') {
            toast.error('Access denied. Redirecting to login...');
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
        console.error('Failed to load admin profile:', err);
        toast.error('Session expired. Please log in.');
        router.replace('/login');
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [dispatch, router]);

  // Fetch unread notifications count from database
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('/api/admin/notifications/unread-count');
        if (response.data?.success) {
          setUnreadCount(response.data.count);
        }
      } catch (err) {
        console.error('Failed to fetch unread notifications count:', err);
      }
    };

    if (userProfile) {
      fetchUnreadCount();
    }
  }, [userProfile]);

  // Automatically clear unread badge count when visiting the notifications page
  useEffect(() => {
    if (pathname === '/admin/notifications') {
      setUnreadCount(0);
    }
  }, [pathname]);

  // Connect to Socket.io on mount for real-time notifications
  useEffect(() => {
    const socket = io();

    socket.on('connect', () => {
      console.log('[Socket] Connected to server as Admin. ID:', socket.id);
      // Join the admin room using the existing join-trip socket event handler
      socket.emit('join-trip', 'admin');
    });

    socket.on('admin:notification', (data: { type: string; title: string; message: string; createdAt: string }) => {
      console.log('[Socket] Admin notification received:', data);
      
      // Show Sonner floating toast notification
      toast.success(data.title, {
        description: data.message,
        duration: 6000,
      });

      // Increment badge count dynamically
      setUnreadCount((prev) => prev + 1);
    });

    // Cleanup connection on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

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
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Operators', path: '/admin/operators', icon: Building2 },
    { name: 'Buses', path: '/admin/buses', icon: Bus },
    { name: 'Routes', path: '/admin/routes', icon: MapPin },
    { name: 'Bookings', path: '/admin/bookings', icon: Calendar },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { name: 'Support', path: '/admin/support', icon: HelpCircle },
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
      <aside className={`fixed inset-y-0 left-0 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 flex flex-col justify-between p-4 sm:p-5 z-50 transition-all duration-300 ease-in-out shrink-0 border-r border-zinc-200/50 dark:border-zinc-800/55 overflow-y-auto overflow-x-hidden ${
        sidebarOpen 
          ? 'translate-x-0 w-64 lg:static lg:h-screen' 
          : '-translate-x-full lg:translate-x-0 lg:w-20 lg:static lg:h-screen'
      }`}>
        
        <div className="flex flex-col gap-6">
          {/* Top Logo & Close Button */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${!sidebarOpen ? 'lg:justify-center lg:w-full' : ''}`}>
              <div className="bg-indigo-600 p-2.5 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-600/10 shrink-0">
                <Bus className="h-5 w-5 text-white" />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col min-w-0 transition-opacity duration-200">
                  <div className="flex items-center">
                    <span className="font-extrabold text-xl text-zinc-900 dark:text-white tracking-tight leading-none">Trip</span>
                    <span className="font-extrabold text-xl text-[#ff5666] tracking-tight leading-none">Go</span>
                  </div>
                  <span className="text-[9px] text-zinc-400 font-extrabold tracking-widest uppercase mt-1 block truncate">Admin Panel</span>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => dispatch(setSidebarOpen(false))}
              className="lg:hidden text-zinc-400 hover:text-zinc-600 dark:hover:text-white outline-none p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path === '/admin/dashboard' && pathname === '/admin');
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
                  className={`flex items-center py-3 rounded-2xl text-xs font-bold transition-all duration-200 group select-none ${
                    sidebarOpen ? 'justify-between px-4' : 'lg:justify-center lg:px-0 px-4'
                  } ${
                    isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' 
                      : 'hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className={`flex items-center gap-3 ${!sidebarOpen ? 'lg:gap-0' : ''}`}>
                    <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                    {sidebarOpen && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </div>
                  {sidebarOpen && item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-600 text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile footer */}
        <div className={`mt-auto border-t border-zinc-150 dark:border-zinc-800/80 pt-4 ${sidebarOpen ? 'px-1' : 'lg:px-0 lg:flex lg:justify-center'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center gap-2.5 min-w-0 ${!sidebarOpen ? 'lg:justify-center lg:w-full' : ''}`}>
              <Avatar className="h-9.5 w-9.5 border border-indigo-200/50 dark:border-zinc-800/60 shrink-0">
                <AvatarImage 
                  src={userProfile?.avatar || '/images/rohit-avatar.jpg'} 
                  alt={userProfile?.name || 'Admin'} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-indigo-50 dark:bg-indigo-950/30 font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center justify-center h-full w-full text-xs">
                  AD
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="flex flex-col min-w-0 transition-opacity duration-200">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 leading-none truncate">
                    {userProfile?.name || 'Admin'}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-1 leading-none truncate">
                    Super Admin
                  </span>
                </div>
              )}
            </div>

            {sidebarOpen && (
              <DropdownMenu>
                <DropdownMenuTrigger className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer select-none p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 outline-none shrink-0">
                  <Settings className="h-4.5 w-4.5 shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 mt-1 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 p-1 shadow-lg z-[100] select-none">
                  <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    Quick Controls
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-1" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer outline-none w-full text-left"
                  >
                    <LogOut className="h-3.5 w-3.5 shrink-0" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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

          {/* Right Header items */}
          <div className="flex items-center gap-4 ml-auto">
            


            {/* Notification Bell */}
            <button className="relative p-2.5 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors text-zinc-500 hover:text-zinc-800 dark:hover:text-white outline-none">
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-indigo-600 text-[8px] font-black text-white rounded-full flex items-center justify-center border border-white dark:border-zinc-900 select-none shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User profile trigger */}
            <div className="flex items-center gap-3 border-l border-zinc-200 dark:border-zinc-800 pl-4 select-none">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100 leading-none">
                  {userProfile?.name || 'Admin'}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-1 leading-none">
                  Super Admin
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="relative w-10.5 h-10.5 rounded-full overflow-hidden border-2 border-indigo-600/30 shrink-0 cursor-pointer shadow-sm hover:scale-102 transition-transform block outline-none">
                  <Avatar className="w-full h-full">
                    <AvatarImage 
                      src={userProfile?.avatar || '/images/rohit-avatar.jpg'} 
                      alt={userProfile?.name || 'Admin'} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-indigo-50 dark:bg-indigo-950/30 font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center justify-center h-full w-full">
                      AD
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 mt-2 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 p-1.5 shadow-xl select-none z-[100]">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                      Admin Settings
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-1" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer w-full text-left outline-none"
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
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-zinc-50 dark:bg-zinc-950">
          {children}
        </main>

      </div>

    </div>
  );
}
