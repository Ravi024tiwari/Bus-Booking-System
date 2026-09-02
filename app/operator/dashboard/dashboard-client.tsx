'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';
import { 
  TrendingUp, 
  TrendingDown, 
  Compass, 
  Calendar, 
  CreditCard, 
  Star, 
  Bus, 
  MapPin, 
  User, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Eye,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  useKPIs, 
  useRouteStatus, 
  useSalesTrends, 
  useUpcomingSchedules, 
  useFeedback 
} from './hooks';
import OperatorRevenueSalesTrends from '@/components/operator/revenue-sales-trends';

export default function OperatorDashboardClient({ operatorName }: { operatorName: string }) {
  // Date filters initial state
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [busType, setBusType] = useState('all');

  const welcomeWords = [
    { text: "Welcome" },
    { text: "back," },
    { text: `${operatorName}!`, className: "text-[#ff2d88] dark:text-[#ff5666]" }
  ];

  // Independent Custom Hooks for Data Fetching
  const { 
    data: kpis, 
    loading: kpisLoading, 
    error: kpisError, 
    refetch: refetchKpis 
  } = useKPIs({ startDate, endDate, busType });

  const { 
    data: salesTrends, 
    loading: salesTrendsLoading, 
    error: salesTrendsError, 
    refetch: refetchSalesTrends 
  } = useSalesTrends({ startDate, endDate, busType });

  const { 
    data: feedbackOverview, 
    loading: feedbackLoading, 
    error: feedbackError, 
    refetch: refetchFeedback 
  } = useFeedback({ startDate, endDate });

  const { 
    data: routeStatus, 
    loading: routeStatusLoading, 
    error: routeStatusError, 
    refetch: refetchRouteStatus 
  } = useRouteStatus();

  const { 
    data: upcomingSchedules, 
    loading: upcomingSchedulesLoading, 
    error: upcomingSchedulesError, 
    refetch: refetchUpcomingSchedules 
  } = useUpcomingSchedules();

  // Reset Filters logic
  const handleResetFilters = () => {
    setStartDate(firstDay);
    setEndDate(lastDay);
    setBusType('all');
  };

  // Trigger manual refresh for everything
  const handleRefreshAll = () => {
    refetchKpis();
    refetchSalesTrends();
    refetchFeedback();
    refetchRouteStatus();
    refetchUpcomingSchedules();
    toast.success('Refreshing dashboard widgets...');
  };

  // Full-page skeleton only on initial concurrent load
  const isInitialLoading = 
    kpisLoading && !kpis && 
    salesTrendsLoading && salesTrends.length === 0 && 
    feedbackLoading && feedbackOverview.length === 0 && 
    routeStatusLoading && routeStatus.length === 0 && 
    upcomingSchedulesLoading && upcomingSchedules.length === 0;

  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  // Custom visual SVG chart calculation
  const maxRevenue = salesTrends?.reduce((max, t) => t.revenue > max ? t.revenue : max, 1) || 1;

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER GREETING & FILTERS ROW */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 select-none">
        <div className="flex flex-col justify-center">
          <TypewriterEffectSmooth words={welcomeWords} className="justify-start my-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" />
          <p className="text-xs sm:text-sm lg:text-base text-zinc-500 dark:text-zinc-400 font-semibold -mt-2">
            Here is what's happening with your fleet today.
          </p>
        </div>

        {/* FILTERS CONTAINER */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-3.5 sm:p-4 rounded-3xl shadow-xs">
          
          <div className="flex flex-col gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Start Date</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/30 dark:border-zinc-700/30 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">End Date</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/30 dark:border-zinc-700/30 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Bus Class</span>
            <select 
              value={busType}
              onChange={(e) => setBusType(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/30 dark:border-zinc-700/30 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 outline-none min-w-[120px] sm:min-w-[135px] cursor-pointer"
            >
              <option value="all">All Fleets</option>
              <option value="AC Sleeper">AC Sleeper</option>
              <option value="Non-AC Sleeper">Non-AC Sleeper</option>
              <option value="AC Seater">AC Seater</option>
              <option value="Luxury Seater">Luxury Seater</option>
            </select>
          </div>

          <div className="flex items-end h-full pt-5 gap-2">
            <button 
              onClick={handleResetFilters}
              className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>

            <button 
              onClick={handleRefreshAll}
              className="px-3.5 py-2 bg-[#ff2d88]/10 hover:bg-[#ff2d88]/20 dark:bg-[#ff5666]/10 dark:hover:bg-[#ff5666]/20 text-[#ff2d88] dark:text-[#ff5666] font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
              Refresh All
            </button>
          </div>

        </div>
      </div>

      {/* KPI METRIC CARDS GRID */}
      {kpisLoading && !kpis ? (
        <div className="w-full">
          <div className="flex overflow-x-auto sm:overflow-x-visible no-scrollbar flex-nowrap gap-3 sm:gap-4 lg:gap-5 pb-2 sm:pb-0 pt-0.5 px-1 -mx-1 snap-x snap-mandatory sm:snap-none w-full sm:w-auto animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className="w-[175px] sm:w-[205px] lg:flex-1 shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 lg:p-4.5 flex items-center gap-3.5 shadow-xs"
              >
                <div className="h-11 w-11 lg:h-12 lg:w-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="flex flex-col gap-2 w-full">
                  <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-5 lg:h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : kpisError ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs sm:text-sm font-semibold p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <span>Failed to load KPI metrics: {kpisError}</span>
          <button onClick={refetchKpis} className="underline hover:text-rose-600 font-bold transition-colors cursor-pointer">Retry</button>
        </div>
      ) : (
        <div className="w-full">
          {/* Mobile Scroll Indicator */}
          <div className="flex items-center justify-between sm:hidden mb-2 px-1 select-none">
            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Business KPIs
            </span>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              Scroll to view all <ArrowRight className="w-3 h-3 animate-bounce-x" />
            </span>
          </div>

          {/* KPI Cards Row */}
          <div className="flex overflow-x-auto sm:overflow-x-visible no-scrollbar flex-nowrap gap-3.5 sm:gap-4 lg:gap-5 pb-2 sm:pb-0 pt-0.5 px-1 -mx-1 snap-x snap-mandatory sm:snap-none w-full sm:w-auto">
            
            {/* TOTAL BOOKINGS */}
            <div className="w-[175px] sm:w-[205px] lg:flex-1 shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-4.5 lg:p-5 flex items-center gap-3.5 lg:gap-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
              <div className="h-11 w-11 lg:h-12 lg:w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-500/20">
                <Users className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
              <div className="flex flex-col select-none min-w-0">
                <span className="text-zinc-400 dark:text-zinc-500 text-[11px] sm:text-xs lg:text-sm font-bold uppercase tracking-wider block truncate">Total Bookings</span>
                <span className="text-lg sm:text-xl lg:text-2xl font-black text-zinc-900 dark:text-white mt-0.5 block leading-tight truncate">{kpis?.totalBookings || 0}</span>
                <div className="mt-1 flex items-center leading-none">
                  <span className={`text-[11px] lg:text-xs font-bold flex items-center gap-0.5 shrink-0 ${(kpis?.totalBookingsGrowth || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(kpis?.totalBookingsGrowth || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(kpis?.totalBookingsGrowth || 0)}% vs last mo.
                  </span>
                </div>
              </div>
            </div>

            {/* TOTAL REVENUE */}
            <div className="w-[175px] sm:w-[205px] lg:flex-1 shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-4.5 lg:p-5 flex items-center gap-3.5 lg:gap-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
              <div className="h-11 w-11 lg:h-12 lg:w-12 rounded-2xl bg-[#ff7c52]/10 text-[#ff7c52] flex items-center justify-center shrink-0 border border-[#ff7c52]/20">
                <CreditCard className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
              <div className="flex flex-col select-none min-w-0">
                <span className="text-zinc-400 dark:text-zinc-500 text-[11px] sm:text-xs lg:text-sm font-bold uppercase tracking-wider block truncate">Total Revenue</span>
                <span className="text-lg sm:text-xl lg:text-2xl font-black text-zinc-900 dark:text-white mt-0.5 block leading-tight truncate">₹{(kpis?.totalRevenue || 0).toLocaleString('en-IN')}</span>
                <div className="mt-1 flex items-center leading-none">
                  <span className={`text-[11px] lg:text-xs font-bold flex items-center gap-0.5 shrink-0 ${(kpis?.totalRevenueGrowth || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(kpis?.totalRevenueGrowth || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(kpis?.totalRevenueGrowth || 0)}% vs last mo.
                  </span>
                </div>
              </div>
            </div>

            {/* OCCUPANCY RATE */}
            <div className="w-[175px] sm:w-[205px] lg:flex-1 shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-4.5 lg:p-5 flex items-center gap-3.5 lg:gap-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
              <div className="h-11 w-11 lg:h-12 lg:w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Compass className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
              <div className="flex flex-col select-none min-w-0">
                <span className="text-zinc-400 dark:text-zinc-500 text-[11px] sm:text-xs lg:text-sm font-bold uppercase tracking-wider block truncate">Occupancy Rate</span>
                <span className="text-lg sm:text-xl lg:text-2xl font-black text-zinc-900 dark:text-white mt-0.5 block leading-tight truncate">{kpis?.occupancyRate || 0}%</span>
                <div className="mt-1 flex items-center leading-none">
                  <span className={`text-[11px] lg:text-xs font-bold flex items-center gap-0.5 shrink-0 ${(kpis?.occupancyRateGrowth || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(kpis?.occupancyRateGrowth || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpis?.occupancyRateGrowth !== undefined ? `${kpis.occupancyRateGrowth >= 0 ? '+' : ''}${kpis.occupancyRateGrowth}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* CSAT AVERAGE RATING */}
            <div className="w-[175px] sm:w-[205px] lg:flex-1 shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-4.5 lg:p-5 flex items-center gap-3.5 lg:gap-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden">
              <div className="h-11 w-11 lg:h-12 lg:w-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0 border border-violet-500/20">
                <Star className="h-5 w-5 lg:h-6 lg:w-6 fill-violet-500/20" />
              </div>
              <div className="flex flex-col select-none min-w-0">
                <span className="text-zinc-400 dark:text-zinc-500 text-[11px] sm:text-xs lg:text-sm font-bold uppercase tracking-wider block truncate">CSAT Rating</span>
                <span className="text-lg sm:text-xl lg:text-2xl font-black text-zinc-900 dark:text-white mt-0.5 block leading-tight truncate">{kpis?.avgRating || 0} / 5</span>
                <div className="mt-1 flex items-center leading-none">
                  <span className="text-[11px] lg:text-xs font-semibold text-zinc-400 dark:text-zinc-500 truncate">
                    {kpis?.totalReviews || 0} reviews
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REVENUE GRAPH & LIVE TRACKING GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        
        {/* REVENUE TRENDING VISUAL CHART (8 columns) */}
        <div className="lg:col-span-8">
          <OperatorRevenueSalesTrends 
            salesTrends={salesTrends} 
            loading={salesTrendsLoading} 
            error={salesTrendsError} 
            onRetry={refetchSalesTrends} 
          />
        </div>

        {/* LIVE ROUTE STATUS & TELEMETRY (4 columns) */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-850">
            <h3 className="font-extrabold text-base lg:text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Live Route Status
            </h3>
            <span className="text-[11px] sm:text-xs bg-emerald-500/10 text-emerald-500 font-extrabold px-2.5 py-0.5 rounded-full select-none">
              Real-time
            </span>
          </div>

          {/* Live routes list */}
          <div className="flex-1 overflow-y-auto mt-3.5 pr-1 flex flex-col gap-3">
            {routeStatusLoading && routeStatus.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400 gap-2">
                <div className="h-6 w-6 rounded-full border-2 border-zinc-200 border-t-zinc-500 animate-spin" />
                <span className="text-xs sm:text-sm font-bold">Loading live route status...</span>
              </div>
            ) : routeStatusError ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-rose-500 gap-2">
                <span className="text-xs sm:text-sm font-bold">Failed to load routes: {routeStatusError}</span>
                <button onClick={refetchRouteStatus} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 text-xs font-bold cursor-pointer">Retry</button>
              </div>
            ) : routeStatus.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <Bus className="h-8 w-8 mb-2 opacity-30" />
                <span className="text-xs sm:text-sm font-bold">No fleets currently on road.</span>
              </div>
            ) : (
              routeStatus.map((route) => (
                <div 
                  key={route.tripId} 
                  className="p-3.5 sm:p-4 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl flex flex-col gap-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm lg:text-base text-zinc-800 dark:text-zinc-200 leading-snug">{route.routeName}</h4>
                      <span className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-semibold block mt-0.5">{route.busNumber} • {route.busType}</span>
                    </div>
                    <span className={`text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      route.status === 'IN_TRANSIT' ? 'bg-indigo-500/10 text-indigo-500' :
                      route.status === 'DEPARTED' ? 'bg-[#ff7c52]/10 text-[#ff7c52]' :
                      'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {route.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-zinc-500 select-none">
                    <span>Passengers: {route.passengersCount} seats</span>
                    <span className={route.delayStatus === 'On-time' ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                      {route.delayStatus}
                    </span>
                  </div>

                  {/* GPS Telemetry Coordinates */}
                  {route.coordinates && (
                    <div className="pt-2 border-t border-dashed border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between text-[11px] sm:text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        GPS: {route.coordinates.latitude.toFixed(4)}, {route.coordinates.longitude.toFixed(4)}
                      </span>
                      <button 
                        onClick={() => toast.info(`Viewing live location coordinates: Lat ${route.coordinates?.latitude}, Lng ${route.coordinates?.longitude}`)}
                        className="text-violet-600 hover:text-violet-700 font-bold flex items-center gap-0.5 transition-colors duration-150 cursor-pointer"
                      >
                        Track <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* UPCOMING SCHEDULES & FEEDBACK SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* UPCOMING TRIP SCHEDULES (8 columns) */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-850">
            <h3 className="font-extrabold text-base lg:text-lg text-zinc-900 dark:text-white">Upcoming Departures</h3>
            <span className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 font-semibold">Next 10 Trips</span>
          </div>

          <div className="overflow-y-auto flex-1 mt-3.5">
            {upcomingSchedulesLoading && upcomingSchedules.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-zinc-400 gap-3">
                <div className="h-6 w-6 rounded-full border-2 border-zinc-200 border-t-zinc-500 animate-spin" />
                <span className="text-xs sm:text-sm font-bold">Loading upcoming schedules...</span>
              </div>
            ) : upcomingSchedulesError ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-rose-500 gap-2">
                <span className="text-xs sm:text-sm font-bold">Failed to load schedules: {upcomingSchedulesError}</span>
                <button onClick={refetchUpcomingSchedules} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 text-xs font-bold cursor-pointer">Retry</button>
              </div>
            ) : upcomingSchedules.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-zinc-400">
                <Calendar className="h-8 w-8 mb-2 opacity-30" />
                <span className="text-xs sm:text-sm font-bold">No upcoming schedules planned.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] sm:text-xs lg:text-sm text-zinc-400 dark:text-zinc-500 font-bold uppercase select-none">
                    <th className="pb-3 pl-1">Route / Bus</th>
                    <th className="pb-3">Driver Name</th>
                    <th className="pb-3">Departure Time</th>
                    <th className="pb-3">Occupancy</th>
                    <th className="pb-3 text-right pr-1">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/30 text-xs sm:text-sm lg:text-base font-medium text-zinc-700 dark:text-zinc-300">
                  {upcomingSchedules.map((trip) => {
                    const dateFormatted = new Date(trip.departureTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    const timeFormatted = new Date(trip.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const occupancyPercent = Math.round((trip.occupiedSeats / trip.capacity) * 100);
                    return (
                      <tr key={trip.tripId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors duration-150">
                        <td className="py-3.5 pl-1">
                          <span className="block font-bold text-zinc-800 dark:text-zinc-200">{trip.routeName}</span>
                          <span className="block text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">{trip.busNumber}</span>
                        </td>
                        <td className="py-3.5 text-zinc-500 dark:text-zinc-400">{trip.driverName}</td>
                        <td className="py-3.5 text-zinc-500 dark:text-zinc-400">
                          <span className="block font-bold">{dateFormatted}</span>
                          <span className="block text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">{timeFormatted}</span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex flex-col gap-1 w-24 sm:w-28">
                            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${occupancyPercent}%` }} 
                                className="h-full bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] rounded-full"
                              />
                            </div>
                            <span className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-bold">{trip.occupiedSeats} / {trip.capacity} ({occupancyPercent})%</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-right pr-1">
                          <button 
                            onClick={() => toast.info(`Managing trip ${trip.tripId}`)}
                            className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-colors duration-150 cursor-pointer"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* FEEDBACK & REVIEWS OVERVIEW (4 columns) */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-850">
            <h3 className="font-extrabold text-base lg:text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-violet-500" />
              Recent Feedback
            </h3>
            <span className="text-[11px] sm:text-xs bg-violet-500/10 text-violet-500 font-bold px-2.5 py-0.5 rounded-full select-none">
              Reviews
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3.5 pr-1 flex flex-col gap-3.5">
            {feedbackLoading && feedbackOverview.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400 gap-2">
                <div className="h-6 w-6 rounded-full border-2 border-zinc-200 border-t-zinc-500 animate-spin" />
                <span className="text-xs sm:text-sm font-bold">Loading feedback...</span>
              </div>
            ) : feedbackError ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-rose-500 gap-2">
                <span className="text-xs sm:text-sm font-bold">Failed to load feedback: {feedbackError}</span>
                <button onClick={refetchFeedback} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 text-xs font-bold cursor-pointer">Retry</button>
              </div>
            ) : feedbackOverview.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <Star className="h-8 w-8 mb-2 opacity-30" />
                <span className="text-xs sm:text-sm font-bold">No feedback received recently.</span>
              </div>
            ) : (
              feedbackOverview.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2.5 border-b border-dashed border-zinc-100 dark:border-zinc-800/60 pb-3 last:border-none last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-zinc-200/40">
                        <AvatarImage src={item.profileImage || '/images/rohit-avatar.jpg'} alt={item.passengerName} />
                        <AvatarFallback className="text-[10px] sm:text-xs font-extrabold bg-zinc-100 text-zinc-500 flex items-center justify-center">
                          {item.passengerName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs sm:text-sm lg:text-base font-bold text-zinc-800 dark:text-zinc-200">{item.passengerName}</span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3.5 w-3.5 ${i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 dark:text-zinc-800'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed pl-10">
                    "{item.comment}"
                  </p>
                  <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium pl-10">
                    {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

// LOADING SKELETON COMPONENT (Full initial concurrent load skeleton)
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse select-none">
      
      {/* HEADER SKELETON */}
      <div className="flex flex-col gap-2.5">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      {/* KPI SKELETONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 flex items-center gap-4.5"
          >
            <div className="h-12 w-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
            <div className="flex flex-col gap-2 w-full">
              <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-3.5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* MAIN SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 h-80" />
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 h-80" />
      </div>

      {/* FOOTER SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 h-80" />
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 h-80" />
      </div>

    </div>
  );
}
