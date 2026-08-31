'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import Image from 'next/image';
import { 
  RootState, 
  AppDispatch, 
  fetchAdminBookings, 
  setActiveTab,
  AdminTrip 
} from '@/store';
import { 
  Calendar, 
  Search, 
  RefreshCw, 
  User as UserIcon, 
  Bus, 
  ArrowRight, 
  Tag, 
  Users,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Info,
  X,
  MapPin,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBookingsPage() {
  const dispatch = useDispatch<AppDispatch>();

  // Fetch Redux States
  const activeTab = useSelector((s: RootState) => s.adminBookings.activeTab);
  const loading = useSelector((s: RootState) => s.adminBookings.loading);
  const error = useSelector((s: RootState) => s.adminBookings.error);
  
  const tabCache = useSelector((s: RootState) => s.adminBookings[activeTab]);
  const trips = tabCache.list;
  const page = tabCache.page;
  const hasMore = tabCache.hasMore;

  // Local UI States
  const [searchVal, setSearchVal] = useState('');

  // Trigger data fetch on mount or activeTab changes
  useEffect(() => {
    if (trips.length === 0) {
      dispatch(fetchAdminBookings({ page: 1, limit: 9, filter: activeTab }));
    }
  }, [dispatch, activeTab, trips.length]);

  const handleTabChange = (tab: 'all' | 'today' | 'upcoming' | 'previous') => {
    dispatch(setActiveTab(tab));
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      dispatch(fetchAdminBookings({ page: page + 1, limit: 9, filter: activeTab }));
    }
  };

  const handleRefresh = () => {
    dispatch(fetchAdminBookings({ page: 1, limit: 9, filter: activeTab }));
    toast.success(`Refreshed ${activeTab} trips cache!`);
  };

  // Client-side quick filter / search (searches source, destination, operator name, bus number)
  const filteredTrips = trips.filter((t) => {
    const query = searchVal.toLowerCase();
    const sourceMatches = t.source?.toLowerCase().includes(query);
    const destinationMatches = t.destination?.toLowerCase().includes(query);
    const operatorName = t.operatorDetails?.name?.toLowerCase().includes(query);
    const busNo = t.busNumber?.toLowerCase().includes(query);
    const busType = t.busType?.toLowerCase().includes(query);

    return sourceMatches || destinationMatches || operatorName || busNo || busType;
  });

  // KPI calculations based on current tab's active cache list
  const getTabStats = () => {
    const totalCount = trips.length;
    const activeCount = trips.filter(t => t.status === 'SCHEDULED' || t.status === 'BOARDING' || t.status === 'DEPARTED' || t.status === 'IN_TRANSIT').length;
    const completedCount = trips.filter(t => t.status === 'ARRIVED').length;
    
    // Estimated revenue from confirmed seat bookings
    const totalRevenue = trips.reduce((sum, t) => sum + (t.seatsBooked * t.fare), 0);

    return { totalCount, activeCount, completedCount, totalRevenue };
  };

  const stats = getTabStats();

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ARRIVED':
        return {
          label: 'Completed',
          icon: <CheckCircle className="h-3 w-3" />,
          cls: 'text-emerald-700 bg-emerald-50/90 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: <XCircle className="h-3 w-3" />,
          cls: 'text-rose-700 bg-rose-50/90 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
        };
      case 'SCHEDULED':
        return {
          label: 'Scheduled',
          icon: <Clock className="h-3 w-3" />,
          cls: 'text-indigo-700 bg-indigo-50/90 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50'
        };
      case 'BOARDING':
      case 'DEPARTED':
      case 'IN_TRANSIT':
        return {
          label: 'In Transit',
          icon: <Clock className="h-3 w-3 animate-pulse" />,
          cls: 'text-amber-700 bg-amber-50/90 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-indigo-900/50'
        };
      default:
        return {
          label: 'Scheduled',
          icon: <Clock className="h-3 w-3" />,
          cls: 'text-zinc-500 bg-zinc-50/90 border-zinc-200/60 dark:bg-zinc-800/40 dark:text-zinc-450 dark:border-zinc-850'
        };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Operator Trips <Calendar className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
            Track operational routes, schedules, operator details, and seat occupancies.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 text-xs font-bold text-zinc-700 dark:text-zinc-300 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-850 select-none cursor-pointer active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        {/* Total Loaded */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-5 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Total Trips</span>
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1.5 block">
            {stats.totalCount} <span className="text-[11px] font-semibold text-zinc-450 font-sans">runs</span>
          </span>
        </div>

        {/* Active/Scheduled Trips */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-5 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <span className="text-[10px] text-indigo-505 font-bold uppercase tracking-wider block font-sans">Active Runs</span>
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1.5 block">
            {stats.activeCount} <span className="text-[11px] font-semibold text-zinc-400 font-sans">scheduled</span>
          </span>
        </div>

        {/* Completed Trips */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-5 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">Completed</span>
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1.5 block">
            {stats.completedCount} <span className="text-[11px] font-semibold text-zinc-450">arrived</span>
          </span>
        </div>

        {/* Revenue */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-5 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <span className="text-[10px] text-amber-550 font-bold uppercase tracking-wider block">Total Estimated Revenue</span>
          <span className="text-2xl font-extrabold text-zinc-950 dark:text-indigo-400 mt-1.5 block">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* FILTER TABS & SEARCH INPUT BAR */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
        
        {/* Tabs */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-800 md:border-none overflow-x-auto gap-1 select-none scrollbar-none shrink-0">
          {(['all', 'today', 'upcoming', 'previous'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`py-2.5 px-4 text-xs font-extrabold rounded-xl capitalize transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100/40 dark:border-indigo-900/30'
                    : 'text-zinc-450 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-transparent'
                }`}
              >
                {tab === 'all' ? 'All Trips' : `${tab} Trips`}
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="flex items-center gap-3 bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200/20 dark:border-zinc-800/40 px-4 py-2.5 rounded-2xl w-full max-w-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-300">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search operator, route, or bus number..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-700 dark:text-zinc-200 placeholder-zinc-400"
          />
          {searchVal && (
            <button 
              onClick={() => setSearchVal('')} 
              className="text-zinc-400 hover:text-zinc-600 outline-none cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* GRID LAYOUT - TRIP CARDS */}
      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((t) => {
            const badge = getStatusBadge(t.status);
            const occupancyRatio = t.capacity > 0 ? (t.seatsBooked / t.capacity) * 100 : 0;
            
            return (
              <Link 
                key={t.id}
                href={`/admin/bookings/${t.id}`}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2.2rem] overflow-hidden flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.015)] hover:shadow-md transition-shadow duration-300 relative group cursor-pointer"
              >
                {/* 1. TOP BUS IMAGE HEADER */}
                <div className="relative h-44 w-full bg-zinc-150 dark:bg-zinc-800 overflow-hidden shrink-0 select-none border-b border-zinc-100 dark:border-zinc-800/40">
                  <Image
                    src={(t.busImages && t.busImages.length > 0) ? t.busImages[0] : "/images/bus-hero.jpg"}
                    alt="Reserved Trip Bus Image"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-103"
                    loading="lazy"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  
                  {/* Status Badge overlay */}
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.2 backdrop-blur-md rounded-full text-[9px] font-black tracking-wider uppercase border border-white/20 shadow-sm ${badge.cls}`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>

                  {/* Fare overlay */}
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-white font-extrabold text-xs">
                    ₹{t.fare}
                  </div>

                  {/* Bus details overlay */}
                  <div className="absolute bottom-4 left-4 text-white">
                    <span className="text-[10px] text-zinc-350 font-black block uppercase tracking-widest leading-none">Vehicle Number</span>
                    <span className="text-sm font-black tracking-wider mt-1 block leading-none">{t.busNumber}</span>
                  </div>
                </div>

                {/* 2. CARD CONTENT BODY */}
                <div className="p-6 flex flex-col gap-4 font-semibold">
                  
                  {/* Route stop header */}
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-50 dark:border-zinc-850 pb-3 select-none">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                      <MapPin className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                      <span className="text-sm font-extrabold tracking-tight truncate max-w-[90px]">{t.source}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="text-sm font-extrabold tracking-tight truncate max-w-[90px]">{t.destination}</span>
                    </div>
                  </div>

                  {/* Timing & Operator */}
                  <div className="grid grid-cols-2 gap-3 text-[11px] text-zinc-600 dark:text-zinc-400 select-none">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Departure Schedule</span>
                      <span className="font-extrabold text-zinc-850 dark:text-zinc-200 mt-1 truncate">{t.formattedDate || t.date}</span>
                      <span className="text-[10px] text-zinc-450 mt-0.5 leading-none">{t.formattedTime}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Operator name</span>
                      <span className="font-extrabold text-zinc-850 dark:text-zinc-200 mt-1 truncate" title={t.operatorDetails?.name}>
                        {t.operatorDetails?.name || 'Unknown Operator'}
                      </span>
                      <span className="text-[10px] text-zinc-450 mt-0.5 leading-none truncate">{t.operatorDetails?.email || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Seat Occupancy progress bar */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex justify-between items-center text-[10px] font-bold select-none">
                      <span className="text-zinc-450">Passenger Occupancy</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{t.seatsBooked} / {t.capacity} seats ({Math.round(occupancyRatio)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/5 dark:border-zinc-800/40 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          occupancyRatio > 80 ? 'bg-emerald-500' : occupancyRatio > 40 ? 'bg-indigo-500' : 'bg-amber-500'
                        }`} 
                        style={{ width: `${Math.min(occupancyRatio, 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* 3. CARD ACTION BUTTON FOOTER */}
                  <div 
                    className="mt-2 w-full py-3 bg-zinc-100 dark:bg-zinc-950 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200/50 dark:border-zinc-800/40 hover:border-indigo-200/50 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all select-none"
                  >
                    View Passenger Manifest
                    <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-indigo-500" />
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] py-16 text-center text-zinc-450 dark:text-zinc-505 font-medium shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
              Loading system scheduled runs...
            </span>
          ) : (
            'No matching operator trips scheduled.'
          )}
        </div>
      )}

      {/* LOAD MORE BUTTON */}
      {hasMore && trips.length > 0 && (
        <div className="flex justify-center mt-2 select-none">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="flex items-center gap-2 py-3.5 px-7 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md hover:shadow-indigo-500/10 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                Loading More Runs...
              </>
            ) : (
              'Load More Scheduled Runs'
            )}
          </button>
        </div>
      )}

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-3 text-xs font-semibold text-rose-600 dark:text-rose-455 animate-pulse">
          <Info className="h-4 w-4 shrink-0" />
          Error Syncing Store: {error}
        </div>
      )}

    </div>
  );
}
