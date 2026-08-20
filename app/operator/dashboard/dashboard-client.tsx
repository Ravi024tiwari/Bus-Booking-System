'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  MessageSquare
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface KPIInfo {
  totalBookings: number;
  totalBookingsGrowth: number;
  activeRoutes: number;
  activeRoutesGrowth: number;
  totalRevenue: number;
  totalRevenueGrowth: number;
  occupancyRate: number;
  occupancyRateGrowth: number;
  avgRating: number;
  totalReviews: number;
  ratingGrowth: number;
}

interface RouteStatus {
  tripId: string;
  routeName: string;
  busNumber: string;
  busType: string;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  passengersCount: number;
  delayStatus: 'Delayed' | 'On-time';
  coordinates: { latitude: number; longitude: number } | null;
}

interface SalesTrend {
  _id: string; // date YYYY-MM-DD
  bookings: number;
  revenue: number;
}

interface UpcomingSchedule {
  tripId: string;
  routeName: string;
  busNumber: string;
  driverName: string;
  departureTime: string;
  capacity: number;
  occupiedSeats: number;
  status: string;
}

interface DriverPerformance {
  driverName: string;
  onTimeRate: number;
  status: string;
}

interface FeedbackItem {
  passengerName: string;
  profileImage: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface DashboardData {
  kpis: KPIInfo;
  routeStatus: RouteStatus[];
  salesTrends: SalesTrend[];
  upcomingSchedules: UpcomingSchedule[];
  driverPerformance: DriverPerformance[];
  feedbackOverview: FeedbackItem[];
}

export default function OperatorDashboardClient({ operatorName }: { operatorName: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  // Date filters
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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (busType !== 'all') params.busType = busType;

      const res = await axios.get('/api/operator/dashboard', { params });
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        toast.error('Failed to parse dashboard details.');
      }
    } catch (err: any) {
      console.error('[Dashboard Client] Fetch error:', err);
      toast.error('Error fetching dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate, busType]);

  const handleResetFilters = () => {
    setStartDate(firstDay);
    setEndDate(lastDay);
    setBusType('all');
  };

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  const kpis = data?.kpis;

  // Custom visual SVG chart calculation
  const maxRevenue = data?.salesTrends.reduce((max, t) => t.revenue > max ? t.revenue : max, 1) || 1;

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER GREETING & FILTERS ROW */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 select-none">
        <div className="flex flex-col justify-center">
          <TypewriterEffectSmooth words={welcomeWords} className="justify-start my-1 text-2xl sm:text-3xl font-extrabold tracking-tight" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold -mt-2">
            Here is what's happening with your fleet today.
          </p>
        </div>

        {/* FILTERS CONTAINER */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-4 rounded-3xl shadow-sm">
          
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase pl-1">Start Date</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/20 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase pl-1">End Date</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/20 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase pl-1">Bus Class</span>
            <select 
              value={busType}
              onChange={(e) => setBusType(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/20 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none min-w-[120px]"
            >
              <option value="all">All Fleets</option>
              <option value="AC Sleeper">AC Sleeper</option>
              <option value="Non-AC Sleeper">Non-AC Sleeper</option>
              <option value="AC Seater">AC Seater</option>
              <option value="Luxury Seater">Luxury Seater</option>
            </select>
          </div>

          <div className="flex items-end h-full pt-5">
            <button 
              onClick={handleResetFilters}
              className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-xs rounded-xl shadow-sm transition-colors duration-150 flex items-center gap-1.5"
            >
              <RefreshCw className="h-3 w-3" />
              Reset
            </button>
          </div>

        </div>
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* TOTAL BOOKINGS */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 flex items-center gap-4.5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.02)] transition-shadow duration-300 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[100px] h-[100px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[30px] pointer-events-none" />
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex flex-col select-none">
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Total Bookings</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white mt-1 block leading-none">{kpis?.totalBookings || 0}</span>
            <div className="mt-1.5 flex items-center leading-none">
              <span className={`text-[11px] font-bold flex items-center gap-0.5 ${(kpis?.totalBookingsGrowth || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {(kpis?.totalBookingsGrowth || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(kpis?.totalBookingsGrowth || 0)}% vs last period
              </span>
            </div>
          </div>
        </div>

        {/* TOTAL REVENUE */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 flex items-center gap-4.5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.02)] transition-shadow duration-300 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[100px] h-[100px] bg-[#ff7c52]/5 dark:bg-[#ff7c52]/10 rounded-full blur-[30px] pointer-events-none" />
          <div className="h-12 w-12 rounded-2xl bg-[#ff7c52]/10 text-[#ff7c52] flex items-center justify-center shrink-0 shadow-sm">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="flex flex-col select-none">
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Total Revenue</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white mt-1 block leading-none">₹{(kpis?.totalRevenue || 0).toLocaleString('en-IN')}</span>
            <div className="mt-1.5 flex items-center leading-none">
              <span className={`text-[11px] font-bold flex items-center gap-0.5 ${(kpis?.totalRevenueGrowth || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {(kpis?.totalRevenueGrowth || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(kpis?.totalRevenueGrowth || 0)}% vs last period
              </span>
            </div>
          </div>
        </div>

        {/* OCCUPANCY RATE */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 flex items-center gap-4.5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.02)] transition-shadow duration-300 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[100px] h-[100px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[30px] pointer-events-none" />
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
            <Compass className="h-6 w-6" />
          </div>
          <div className="flex flex-col select-none">
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Occupancy Rate</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white mt-1 block leading-none">{kpis?.occupancyRate || 0}%</span>
            <div className="mt-1.5 flex items-center leading-none">
              <span className={`text-[11px] font-bold flex items-center gap-0.5 ${(kpis?.occupancyRateGrowth || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {(kpis?.occupancyRateGrowth || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {kpis?.occupancyRateGrowth !== undefined ? `${kpis.occupancyRateGrowth >= 0 ? '+' : ''}${kpis.occupancyRateGrowth}%` : '0%'} vs last period
              </span>
            </div>
          </div>
        </div>

        {/* CSAT AVERAGE RATING */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 flex items-center gap-4.5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.02)] transition-shadow duration-300 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[100px] h-[100px] bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-[30px] pointer-events-none" />
          <div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0 shadow-sm">
            <Star className="h-6 w-6 fill-violet-500/20" />
          </div>
          <div className="flex flex-col select-none">
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">CSAT Rating</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white mt-1 block leading-none">{kpis?.avgRating || 0} / 5</span>
            <div className="mt-1.5 flex items-center leading-none">
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
                Based on {kpis?.totalReviews || 0} customer reviews
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* REVENUE GRAPH & LIVE TRACKING GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        
        {/* REVENUE TRENDING VISUAL CHART (8 columns) */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Revenue & Sales Trends</h3>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">Grouped Daily</span>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
              Visual breakdown of earnings during the current filtered range.
            </p>
          </div>

          {/* CUSTOM SVG/CSS CHART PLOTTER */}
          <div className="mt-6 flex-1 flex flex-col justify-end">
            {(!data?.salesTrends || data.salesTrends.length === 0) ? (
              <div className="h-48 flex items-center justify-center text-zinc-400 font-bold text-xs">
                No sales data recorded for this date range.
              </div>
            ) : (
              <div className="w-full">
                {/* Visual Chart Bars Container */}
                <div className="h-44 flex items-end justify-between gap-2.5 px-2 relative border-b border-zinc-200/40 dark:border-zinc-800/40 pb-1">
                  
                  {/* Background grid lines */}
                  <div className="absolute inset-x-0 top-0 h-px bg-zinc-100 dark:bg-zinc-800/30" />
                  <div className="absolute inset-x-0 top-1/3 h-px bg-zinc-100 dark:bg-zinc-800/30" />
                  <div className="absolute inset-x-0 top-2/3 h-px bg-zinc-100 dark:bg-zinc-800/30" />

                  {data.salesTrends.map((trend) => {
                    const heightPercent = Math.max(10, Math.round((trend.revenue / maxRevenue) * 100));
                    const dateFormatted = new Date(trend._id).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    return (
                      <div key={trend._id} className="flex-1 flex flex-col items-center group relative z-10">
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-[105%] bg-zinc-950 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-black rounded-lg px-2 py-1 shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 w-max text-center">
                          <span className="block font-bold">{dateFormatted}</span>
                          <span className="block text-[#ff7c52]">₹{trend.revenue.toLocaleString()}</span>
                          <span className="block text-zinc-400 dark:text-zinc-500">{trend.bookings} bookings</span>
                        </div>
                        
                        {/* Bar */}
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-[#ff7c52] to-[#ff2d88] opacity-80 group-hover:opacity-100 transition-all duration-200 shadow-md shadow-[#ff2d88]/10"
                        />
                      </div>
                    );
                  })}
                </div>
                
                {/* X-Axis labels */}
                <div className="flex justify-between px-2 pt-2 text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 select-none">
                  <span>{new Date(data.salesTrends[0]._id).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                  {data.salesTrends.length > 2 && (
                    <span>{new Date(data.salesTrends[Math.floor(data.salesTrends.length / 2)]._id).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                  )}
                  <span>{new Date(data.salesTrends[data.salesTrends.length - 1]._id).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LIVE ROUTE STATUS & TELEMETRY (4 columns) */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-850">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Live Route status
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-extrabold px-2 py-0.5 rounded-full select-none">
              Real-time
            </span>
          </div>

          {/* Live routes list */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-3">
            {(!data?.routeStatus || data.routeStatus.length === 0) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <Bus className="h-8 w-8 mb-2 opacity-30" />
                <span className="text-xs font-bold">No fleets currently on road.</span>
              </div>
            ) : (
              data.routeStatus.map((route) => (
                <div 
                  key={route.tripId} 
                  className="p-3.5 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl flex flex-col gap-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 leading-none">{route.routeName}</h4>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold block mt-1">{route.busNumber} • {route.busType}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      route.status === 'IN_TRANSIT' ? 'bg-indigo-500/10 text-indigo-500' :
                      route.status === 'DEPARTED' ? 'bg-[#ff7c52]/10 text-[#ff7c52]' :
                      'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {route.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 select-none">
                    <span>Passengers: {route.passengersCount} seats</span>
                    <span className={route.delayStatus === 'On-time' ? 'text-emerald-500' : 'text-rose-500'}>
                      {route.delayStatus}
                    </span>
                  </div>

                  {/* GPS Telemetry Coordinates */}
                  {route.coordinates && (
                    <div className="pt-2 border-t border-dashed border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                        GPS: {route.coordinates.latitude.toFixed(4)}, {route.coordinates.longitude.toFixed(4)}
                      </span>
                      <button 
                        onClick={() => toast.info(`Viewing live location coordinates: Lat ${route.coordinates?.latitude}, Lng ${route.coordinates?.longitude}`)}
                        className="text-violet-600 hover:text-violet-700 font-bold flex items-center gap-0.5 transition-colors duration-150"
                      >
                        Track <Eye className="h-3 w-3" />
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
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-850">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Upcoming Departures</h3>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">Next 10 Trips</span>
          </div>

          <div className="overflow-x-auto mt-4">
            {(!data?.upcomingSchedules || data.upcomingSchedules.length === 0) ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-zinc-400">
                <Calendar className="h-8 w-8 mb-2 opacity-30" />
                <span className="text-xs font-bold">No upcoming schedules planned.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase select-none">
                    <th className="pb-3 pl-1">Route / Bus</th>
                    <th className="pb-3">Driver Name</th>
                    <th className="pb-3">Departure Time</th>
                    <th className="pb-3">Occupancy</th>
                    <th className="pb-3 text-right pr-1">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/30 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {data.upcomingSchedules.map((trip) => {
                    const dateFormatted = new Date(trip.departureTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    const timeFormatted = new Date(trip.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const occupancyPercent = Math.round((trip.occupiedSeats / trip.capacity) * 100);
                    return (
                      <tr key={trip.tripId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors duration-150">
                        <td className="py-4 pl-1">
                          <span className="block font-bold text-zinc-800 dark:text-zinc-200">{trip.routeName}</span>
                          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">{trip.busNumber}</span>
                        </td>
                        <td className="py-4 text-zinc-500 dark:text-zinc-400">{trip.driverName}</td>
                        <td className="py-4 text-zinc-500 dark:text-zinc-400">
                          <span className="block font-bold">{dateFormatted}</span>
                          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">{timeFormatted}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1 w-24">
                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${occupancyPercent}%` }} 
                                className="h-full bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] rounded-full"
                              />
                            </div>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">{trip.occupiedSeats} / {trip.capacity} ({occupancyPercent}%)</span>
                          </div>
                        </td>
                        <td className="py-4 text-right pr-1">
                          <button 
                            onClick={() => toast.info(`Managing trip ${trip.tripId}`)}
                            className="px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 transition-colors duration-150"
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
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-850">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-violet-500" />
              Recent Feedback
            </h3>
            <span className="text-[10px] bg-violet-500/10 text-violet-500 font-extrabold px-2 py-0.5 rounded-full select-none">
              Reviews
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-4">
            {(!data?.feedbackOverview || data.feedbackOverview.length === 0) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <Star className="h-8 w-8 mb-2 opacity-30" />
                <span className="text-xs font-bold">No feedback received recently.</span>
              </div>
            ) : (
              data.feedbackOverview.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2.5 border-b border-dashed border-zinc-100 dark:border-zinc-800/60 pb-3 last:border-none last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border border-zinc-200/40">
                        <AvatarImage src={item.profileImage || '/images/rohit-avatar.jpg'} alt={item.passengerName} />
                        <AvatarFallback className="text-[9px] font-extrabold bg-zinc-100 text-zinc-500 flex items-center justify-center">
                          {item.passengerName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">{item.passengerName}</span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 dark:text-zinc-800'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed pl-9">
                    "{item.comment}"
                  </p>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold pl-9">
                    {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* DRIVER PERFORMANCE SECTION */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col gap-4">
        <div>
          <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Driver Performance Leaderboard</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
            Real-time rating of drivers based on on-time rate parameters.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {(!data?.driverPerformance || data.driverPerformance.length === 0) ? (
            <div className="col-span-4 text-center text-zinc-400 text-xs py-4 font-bold">
              No driver performance logs found.
            </div>
          ) : (
            data.driverPerformance.map((drv, idx) => (
              <div 
                key={idx}
                className="p-4 border border-zinc-100 dark:border-zinc-850 rounded-2xl flex flex-col gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all duration-200 select-none"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-[#ff7c52]/10 text-[#ff7c52] flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 leading-none">{drv.driverName}</h4>
                    <span className="text-[9px] text-zinc-400 font-bold block mt-1">Bus Pilot</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs font-bold">
                  <span className="text-zinc-400">On-Time Rate</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{drv.onTimeRate.toFixed(1)}%</span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                  <span>Status</span>
                  <span className={`flex items-center gap-1 ${drv.status === 'Positive' ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {drv.status === 'Positive' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                    {drv.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

// LOADING SKELETON COMPONENT
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
