'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { 
  RootState, 
  AppDispatch, 
  fetchAdminBookings, 
  setActiveTab,
  clearAdminCache,
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
  ChevronRight,
  Star,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
      dispatch(fetchAdminBookings({ page: 1, limit: 12, filter: activeTab }));
    }
  }, [dispatch, activeTab, trips.length]);

  const handleTabChange = (tab: 'all' | 'today' | 'upcoming' | 'previous') => {
    dispatch(setActiveTab(tab));
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      dispatch(fetchAdminBookings({ page: page + 1, limit: 12, filter: activeTab }));
    }
  };

  const handleRefresh = () => {
    dispatch(clearAdminCache());
    dispatch(fetchAdminBookings({ page: 1, limit: 12, filter: activeTab }));
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
          icon: <CheckCircle className="h-2.5 w-2.5" />,
          cls: 'text-emerald-300 bg-emerald-500/20 border-emerald-400/40'
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: <XCircle className="h-2.5 w-2.5" />,
          cls: 'text-rose-300 bg-rose-500/20 border-rose-400/40'
        };
      case 'SCHEDULED':
        return {
          label: 'Scheduled',
          icon: <Clock className="h-2.5 w-2.5" />,
          cls: 'text-indigo-300 bg-indigo-500/20 border-indigo-400/40'
        };
      case 'BOARDING':
      case 'DEPARTED':
      case 'IN_TRANSIT':
        return {
          label: 'In Transit',
          icon: <Clock className="h-2.5 w-2.5 animate-pulse" />,
          cls: 'text-amber-300 bg-amber-500/20 border-amber-400/40'
        };
      default:
        return {
          label: 'Scheduled',
          icon: <Clock className="h-2.5 w-2.5" />,
          cls: 'text-zinc-300 bg-zinc-500/20 border-zinc-400/40'
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
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-850 select-none cursor-pointer active:scale-95 transition-all duration-200 disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="w-full">
        {/* Mobile Scroll Indicator */}
        <div className="flex items-center justify-between sm:hidden mb-2.5 px-1 select-none">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Booking Stats
          </span>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            Scroll to view all <ArrowRight className="w-3 h-3 animate-bounce-x" />
          </span>
        </div>

        {/* KPI Cards Container: auto-fitting, compact, content-aware layout */}
        <div className="flex overflow-x-auto sm:overflow-x-visible no-scrollbar sm:flex-wrap gap-3 sm:gap-4 pb-2 sm:pb-0 pt-0.5 px-1 -mx-1 snap-x snap-mandatory sm:snap-none select-none">
          {/* Total Loaded */}
          <div className="min-w-[165px] max-w-[210px] sm:max-w-none sm:flex-1 sm:min-w-[180px] sm:max-w-[240px] w-[48vw] sm:w-auto shrink-0 sm:shrink snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-zinc-700/80 group-hover:scale-105 transition-transform">
              <Bus className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block truncate">Total Trips</span>
              <span className="text-base sm:text-xl font-extrabold text-zinc-900 dark:text-white mt-0.5 block leading-none truncate">
                {stats.totalCount} <span className="text-[10px] sm:text-xs font-normal text-zinc-400 font-sans">runs</span>
              </span>
            </div>
          </div>

          {/* Active/Scheduled Trips */}
          <div className="min-w-[165px] max-w-[210px] sm:max-w-none sm:flex-1 sm:min-w-[180px] sm:max-w-[240px] w-[48vw] sm:w-auto shrink-0 sm:shrink snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block truncate">Active Runs</span>
              <span className="text-base sm:text-xl font-extrabold text-zinc-900 dark:text-white mt-0.5 block leading-none truncate">
                {stats.activeCount} <span className="text-[10px] sm:text-xs font-normal text-zinc-400 font-sans">scheduled</span>
              </span>
            </div>
          </div>

          {/* Completed Trips */}
          <div className="min-w-[165px] max-w-[210px] sm:max-w-none sm:flex-1 sm:min-w-[180px] sm:max-w-[240px] w-[48vw] sm:w-auto shrink-0 sm:shrink snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block truncate">Completed</span>
              <span className="text-base sm:text-xl font-extrabold text-zinc-900 dark:text-white mt-0.5 block leading-none truncate">
                {stats.completedCount} <span className="text-[10px] sm:text-xs font-normal text-zinc-400">arrived</span>
              </span>
            </div>
          </div>

          {/* Revenue */}
          <div className="min-w-[165px] max-w-[210px] sm:max-w-none sm:flex-1 sm:min-w-[180px] sm:max-w-[240px] w-[48vw] sm:w-auto shrink-0 sm:shrink snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider block truncate">Est. Revenue</span>
              <span className="text-base sm:text-xl font-extrabold text-zinc-900 dark:text-white mt-0.5 block leading-none truncate">
                ₹{stats.totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH INPUT BAR */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 rounded-[1.75rem] p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        
        {/* Tabs */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-800 md:border-none overflow-x-auto gap-1 select-none scrollbar-none shrink-0">
          {(['all', 'today', 'upcoming', 'previous'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`py-2 px-3.5 text-xs font-black rounded-xl capitalize transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab === 'all' ? 'All Trips' : `${tab} Trips`}
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800 px-3.5 py-2 rounded-xl w-full max-w-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-200">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search operator, route, or bus..."
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

      {/* 4. TRIP CARDS CATALOG GRID */}
      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredTrips.map((t, idx) => {
            const badge = getStatusBadge(t.status);
            const occupancyRatio = t.capacity > 0 ? (t.seatsBooked / t.capacity) * 100 : 0;
            
            const busCoverImage = (t.busImages && t.busImages.length > 0 && t.busImages[0])
              ? t.busImages[0]
              : (idx % 2 === 0 ? '/images/bus1.jpg' : '/images/bus2.jpg');
            
            return (
              <Link 
                key={t.id}
                href={`/admin/bookings/${t.id}`}
                className="block group"
              >
                <Card className="border border-zinc-200/80 dark:border-zinc-800 rounded-[1.75rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between p-3 sm:p-3.5 gap-3 relative overflow-visible bg-white dark:bg-zinc-900 cursor-pointer select-none">
                  
                  {/* 1. TOP COVER PHOTO WITH INSET ROUNDED CORNERS & OVERLAYS */}
                  <div className="relative h-38 sm:h-42 w-full rounded-2xl overflow-hidden select-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-800/80 shadow-xs">
                    <img 
                      src={busCoverImage}
                      alt={`Bus ${t.busNumber}`}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = idx % 2 === 0 ? '/images/bus1.jpg' : '/images/bus2.jpg';
                      }}
                      className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                    />
                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35 rounded-2xl" />

                    {/* Status Badge overlay (top-left) */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase backdrop-blur-md border shadow-xs ${badge.cls}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>

                    {/* Verified Rating Badge overlay (top-right) */}
                    <div className="absolute top-2.5 right-2.5">
                      {t.averageRating && t.averageRating > 0 ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-amber-400/40 text-amber-400 font-black text-[10px] shadow-xs">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 drop-shadow-xs" />
                          <span>{t.averageRating.toFixed(1)}</span>
                          <span className="text-[9px] text-zinc-300 font-medium">({t.totalReviews || 1})</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-zinc-300 font-medium text-[9px]">
                          <Star className="h-2.5 w-2.5 text-zinc-400" />
                          <span>New</span>
                        </div>
                      )}
                    </div>

                    {/* Departure Timing & Date (bottom-left) */}
                    <div className="absolute bottom-2.5 left-2.5 flex flex-col text-white">
                      <span className="text-xs sm:text-sm font-black tracking-tight drop-shadow-sm flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#ff2d88]" />
                        {t.formattedTime || '10:00 AM'}
                      </span>
                      <span className="text-[10px] text-zinc-200 font-semibold drop-shadow-sm">
                        {t.formattedDate || t.date}
                      </span>
                    </div>

                    {/* Discount offer tag if applicable (bottom-right) */}
                    {t.offerPercentage && t.offerPercentage > 0 ? (
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className="px-2 py-0.5 bg-rose-500 text-white rounded-lg text-[9px] font-black tracking-wider uppercase shadow-xs">
                          {t.offerPercentage}% Off
                        </span>
                      </div>
                    ) : (
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/15 text-zinc-200 rounded-lg text-[9px] font-bold truncate max-w-[100px] block">
                          {t.operatorDetails?.name || 'Operator'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 2. CARD CONTENT BODY */}
                  <div className="flex flex-col gap-2.5 px-0.5">
                    
                    {/* Route Header */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white">
                        <span className="font-extrabold text-xs sm:text-sm truncate max-w-[120px]" title={t.source}>
                          {t.source}
                        </span>
                        <ArrowRight className="h-3 w-3 text-zinc-400 shrink-0" />
                        <span className="font-extrabold text-xs sm:text-sm truncate max-w-[120px]" title={t.destination}>
                          {t.destination}
                        </span>
                      </div>
                      {t.viaStops && t.viaStops.length > 0 && (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium truncate">
                          Via: {t.viaStops.join(', ')}
                        </span>
                      )}
                    </div>

                    {/* Bus info & Occupancy Meta Grid */}
                    <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-2 text-xs select-none">
                      {/* Vehicle & Operator details */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="h-6 w-6 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-500">
                          <Bus className="h-3 w-3" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate leading-none">{t.busNumber}</span>
                          <span className="text-[8px] text-zinc-400 truncate mt-0.5 leading-none">{t.busType || 'Standard'}</span>
                        </div>
                      </div>

                      {/* Occupancy */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="h-6 w-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-500">
                          <Layers className="h-3 w-3" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate leading-none">{t.seatsBooked}/{t.capacity}</span>
                          <span className="text-[8px] text-zinc-400 truncate mt-0.5 leading-none">Seats ({Math.round(occupancyRatio)}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. CARD BOTTOM ROW: FARE & ACTION BUTTON */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                      {/* Price Display */}
                      <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider leading-none">Fare</span>
                        <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-white mt-0.5 leading-none">
                          ₹{t.fare}
                        </span>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-[11px] rounded-xl shadow-xs transition-all cursor-pointer group-hover:bg-[#ff2d88] group-hover:text-white dark:group-hover:bg-[#ff2d88] dark:group-hover:text-white active:scale-95"
                      >
                        <span>Manifest</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                  </div>

                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 rounded-[2rem] py-16 text-center text-zinc-400 dark:text-zinc-500 font-medium shadow-xs">
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
            className="flex items-center gap-2 py-3 px-6 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
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
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-xs font-semibold text-rose-600 dark:text-rose-400 animate-pulse">
          <Info className="h-4 w-4 shrink-0" />
          Error Syncing Store: {error}
        </div>
      )}

    </div>
  );
}
