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
  X, 
  Search,
  Plus,
  Rocket
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

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch admin profile on mount to ensure session validity
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data?.success && response.data?.data) {
          const u = response.data.data;
          if (u.role !== 'admin') {
            toast.error('Access denied. Redirecting to login...');
            router.push('/login');
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
        console.error('Failed to load admin profile:', err);
        toast.error('Session expired. Please log in.');
        router.push('/login');
      }
    };

    if (!userProfile) {
      fetchProfile();
    }
  }, [dispatch, userProfile, router]);

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Operators', path: '/admin/operators', icon: Building2 },
    { name: 'Buses', path: '/admin/buses', icon: Bus },
    { name: 'Routes', path: '/admin/routes', icon: MapPin },
    { name: 'Bookings', path: '/admin/bookings', icon: Calendar },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell, badge: 8 },
    { name: 'Support', path: '/admin/support', icon: HelpCircle },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
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

  const handleQuickAction = () => {
    toast.success('Quick Action Triggered');
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
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 flex flex-col justify-between p-6 z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen shrink-0 border-r border-zinc-200/50 dark:border-zinc-800/55 overflow-y-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        <div className="flex flex-col gap-6">
          {/* Top Logo & Close Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2.5 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-600/10">
                <Bus className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center">
                  <span className="font-extrabold text-xl text-indigo-600 dark:text-indigo-400 tracking-tight leading-none">Task</span>
                  <span className="font-extrabold text-xl text-indigo-900 dark:text-white tracking-tight leading-none">ora</span>
                </div>
                <span className="text-[9px] text-zinc-400 font-extrabold tracking-widest uppercase mt-1 block">Super Admin</span>
              </div>
            </div>
            
            <button 
              onClick={() => dispatch(setSidebarOpen(false))}
              className="lg:hidden text-zinc-400 hover:text-zinc-600 dark:hover:text-white outline-none"
            >
              <X className="h-6 w-6" />
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
                  onClick={() => dispatch(setSidebarOpen(false))}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 group ${
                    isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' 
                      : 'hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                    {item.name}
                  </div>
                  {item.badge && (
                    <span className="h-4.5 w-4.5 bg-indigo-500 text-[9px] font-black text-white rounded-full flex items-center justify-center select-none shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Upgrade Card / Support footer */}
        <div className="flex flex-col gap-5 mt-6">
          {/* Upgrade Card matching mockup screenshot */}
          <div className="relative bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950/40 rounded-3xl p-5 overflow-hidden flex flex-col items-center gap-3 text-center shadow-[0_10px_30px_rgba(99,102,241,0.02)] select-none">
            <div className="absolute top-[-20%] right-[-20%] w-[100px] h-[100px] bg-indigo-500/10 rounded-full blur-[30px] pointer-events-none" />
            <Rocket className="h-8 w-8 text-indigo-500 animate-pulse shrink-0 z-10" />
            <div className="z-10">
              <span className="text-xs font-black text-zinc-800 dark:text-white leading-tight block">Upgrade to Pro</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1 block max-w-[150px] leading-normal">
                Unlock advanced features and grow your platform.
              </span>
            </div>
            <button 
              onClick={() => toast.success('Redirecting to plans...')}
              className="z-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md transition-all w-full cursor-pointer outline-none"
            >
              Upgrade Now
            </button>
          </div>

          {/* User profile section matching mockup footer */}
          <div className="flex items-center justify-between border-t border-zinc-150 dark:border-zinc-800/80 pt-4 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-9.5 w-9.5 border border-indigo-200/50 dark:border-zinc-800/60 shrink-0">
                <AvatarImage 
                  src={userProfile?.avatar || '/images/rohit-avatar.jpg'} 
                  alt={userProfile?.name || 'Admin'} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-indigo-50 dark:bg-indigo-950/30 font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center justify-center h-full w-full">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 leading-none truncate">
                  {userProfile?.name || 'Admin'}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-1 leading-none truncate">
                  Super Admin
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer select-none p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 outline-none">
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
              className="p-2 -ml-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-white outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-indigo-600" />
              <span className="font-extrabold text-lg tracking-tight">Taskora</span>
            </div>
          </div>

          {/* Search Field */}
          <div className="hidden sm:flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/20 dark:border-zinc-700/10 px-4 py-2.5 rounded-2xl w-full max-w-[400px] focus-within:ring-2 focus-within:ring-indigo-600/20 transition-all duration-300">
            <Search className="h-4 w-4 text-zinc-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search users, bookings, buses, routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-700 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-4 ml-auto sm:ml-0">
            
            {/* Quick Action Button */}
            <button 
              onClick={handleQuickAction}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md shadow-indigo-600/10 transition-colors cursor-pointer outline-none"
            >
              <Plus className="h-4.5 w-4.5 text-white shrink-0" />
              Quick Action
            </button>

            {/* Notification Bell */}
            <button className="relative p-2.5 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors text-zinc-500 hover:text-zinc-800 dark:hover:text-white outline-none">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-indigo-600 text-[8px] font-black text-white rounded-full flex items-center justify-center border border-white dark:border-zinc-900 select-none shadow-sm animate-pulse">
                8
              </span>
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
                    onClick={() => router.push('/admin/settings')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer outline-none w-full"
                  >
                    <Settings className="h-4 w-4" />
                    System Configuration
                  </DropdownMenuItem>
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
