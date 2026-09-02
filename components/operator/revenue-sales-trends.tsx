'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  IndianRupee, 
  Ticket, 
  Calendar, 
  Flame, 
  Sparkles, 
  ChevronRight, 
  ArrowUpRight,
  Layers,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SalesTrend } from '@/app/operator/dashboard/hooks';

interface OperatorRevenueSalesTrendsProps {
  salesTrends: SalesTrend[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

type ViewMode = 'revenue' | 'bookings' | 'seats';

export default function OperatorRevenueSalesTrends({
  salesTrends,
  loading,
  error,
  onRetry
}: OperatorRevenueSalesTrendsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('revenue');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Aggregate stats from the current dataset
  const stats = useMemo<{
    totalRevenue: number;
    totalBookings: number;
    totalSeats: number;
    avgDailyRevenue: number;
    peakDay: SalesTrend | null;
    peakValue: number;
  }>(() => {
    let totalRevenue = 0;
    let totalBookings = 0;
    let totalSeats = 0;
    let peakDay: SalesTrend | null = null;
    let peakValue = 0;

    salesTrends.forEach((item) => {
      totalRevenue += item.revenue || 0;
      totalBookings += item.bookings || 0;
      totalSeats += item.seats || item.bookings || 0;

      const compValue = viewMode === 'revenue' ? item.revenue : (viewMode === 'bookings' ? item.bookings : (item.seats || item.bookings));
      if (compValue > peakValue) {
        peakValue = compValue;
        peakDay = item;
      }
    });

    const activeDays = salesTrends.filter(t => t.revenue > 0).length || 1;
    const avgDailyRevenue = Math.round(totalRevenue / activeDays);

    return {
      totalRevenue,
      totalBookings,
      totalSeats,
      avgDailyRevenue,
      peakDay,
      peakValue
    };
  }, [salesTrends, viewMode]);

  // SVG dimensions for responsive chart
  const width = 600;
  const height = 180;
  const paddingX = 24;
  const paddingY = 20;

  const getMetricValue = (item: SalesTrend) => {
    if (viewMode === 'revenue') return item.revenue;
    if (viewMode === 'bookings') return item.bookings;
    return item.seats || item.bookings;
  };

  const values = salesTrends.map(getMetricValue);
  const maxValue = Math.max(...values, viewMode === 'revenue' ? 500 : 5);

  const points = useMemo(() => {
    if (salesTrends.length === 0) return [];
    return salesTrends.map((d, index) => {
      const val = getMetricValue(d);
      const x = salesTrends.length > 1
        ? paddingX + (index * (width - paddingX * 2)) / (salesTrends.length - 1)
        : width / 2;
      const y = height - paddingY - (val * (height - paddingY * 2)) / maxValue;
      return { x, y, data: d, val };
    });
  }, [salesTrends, viewMode, maxValue]);

  // Generate SVG Line Path
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  }, [points]);

  // Generate SVG Area Path
  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    return `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  }, [pathD, points]);

  // Active hover/touch item
  const activeItem = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;

  const theme = {
    revenue: {
      color: '#ff2d88',
      secondary: '#ff7c52',
      gradientId: 'operatorRevGrad',
      label: 'Trip Earnings'
    },
    bookings: {
      color: '#6366f1',
      secondary: '#8b5cf6',
      gradientId: 'operatorBookGrad',
      label: 'Confirmed Bookings'
    },
    seats: {
      color: '#10b981',
      secondary: '#14b8a6',
      gradientId: 'operatorSeatGrad',
      label: 'Passenger Seats'
    }
  }[viewMode];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[400px] select-none">
      
      {/* Header & Metrics Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-150 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base sm:text-lg lg:text-xl text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#ff2d88]/10 text-[#ff2d88] dark:bg-[#ff5666]/10 dark:text-[#ff5666]">
                <TrendingUp className="h-4.5 w-4.5" />
              </span>
              Revenue & Ticket Sales Trend
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
            Real customer bookings & earned revenue from your scheduled bus trips
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/70 rounded-2xl border border-zinc-200/40 dark:border-zinc-700/40 text-xs sm:text-sm font-extrabold self-start sm:self-auto">
          <button
            onClick={() => {
              setViewMode('revenue');
              setHoveredIdx(null);
            }}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'revenue'
                ? 'bg-white dark:bg-zinc-900 text-[#ff2d88] dark:text-[#ff5666] shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <IndianRupee className="h-3.5 w-3.5" />
            <span>Revenue</span>
          </button>

          <button
            onClick={() => {
              setViewMode('bookings');
              setHoveredIdx(null);
            }}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'bookings'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Bookings</span>
          </button>

          <button
            onClick={() => {
              setViewMode('seats');
              setHoveredIdx(null);
            }}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'seats'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Ticket className="h-3.5 w-3.5" />
            <span>Seats</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Highlights Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-3">
        
        {/* Total Earned */}
        <div className="bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Earned</span>
          <span className="text-base sm:text-lg lg:text-xl font-black text-zinc-900 dark:text-white mt-1">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-zinc-400 font-medium mt-0.5">From customer tickets</span>
        </div>

        {/* Total Bookings */}
        <div className="bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Bookings</span>
          <span className="text-base sm:text-lg lg:text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {stats.totalBookings.toLocaleString('en-IN')} orders
          </span>
          <span className="text-[11px] text-zinc-400 font-medium mt-0.5">Confirmed trips</span>
        </div>

        {/* Passenger Seats Sold */}
        <div className="bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Seats Booked</span>
          <span className="text-base sm:text-lg lg:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.totalSeats.toLocaleString('en-IN')} seats
          </span>
          <span className="text-[11px] text-zinc-400 font-medium mt-0.5">Passenger capacity</span>
        </div>

        {/* Peak Earning Day */}
        <div className="bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-orange-500" /> Peak Day
          </span>
          <span className="text-base sm:text-lg lg:text-xl font-black text-orange-600 dark:text-orange-400 mt-1 truncate">
            {stats.peakDay ? new Date(stats.peakDay._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
          </span>
          <span className="text-[11px] text-zinc-400 font-medium mt-0.5">
            {stats.peakDay ? `₹${stats.peakDay.revenue.toLocaleString('en-IN')}` : '0'}
          </span>
        </div>

      </div>

      {/* Chart Canvas & Tracking Visualizer */}
      <div className="mt-2 flex-1 flex flex-col justify-end">
        {loading && salesTrends.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-zinc-400 font-bold text-xs sm:text-sm gap-2.5">
            <div className="h-6 w-6 rounded-full border-2 border-zinc-200 border-t-[#ff2d88] animate-spin" />
            <span>Loading earnings and sales trends...</span>
          </div>
        ) : error ? (
          <div className="h-44 flex flex-col items-center justify-center text-rose-500 font-bold text-xs sm:text-sm gap-2">
            <span>Failed to load sales trends: {error}</span>
            <button onClick={onRetry} className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 font-bold cursor-pointer">
              Retry
            </button>
          </div>
        ) : salesTrends.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 font-bold text-xs sm:text-sm text-center px-4">
            <Ticket className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2" />
            <span>No sales recorded for this date range yet.</span>
            <span className="text-xs font-normal mt-0.5 text-zinc-400">Bookings placed on your routes will appear here in real-time.</span>
          </div>
        ) : (
          <div className="w-full relative">
            
            {/* Live Hover Info Pill */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-zinc-500 mb-1 px-1 min-h-[24px]">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.color }} />
                {theme.label} ({salesTrends.length} days plotted)
              </span>

              {activeItem && (
                <span className="text-xs sm:text-sm font-black animate-in fade-in duration-150" style={{ color: theme.color }}>
                  {new Date(activeItem.data._id).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: 
                  {' '}₹{activeItem.data.revenue.toLocaleString('en-IN')} • {activeItem.data.bookings} bookings • {activeItem.data.seats || activeItem.data.bookings} seats
                </span>
              )}
            </div>

            {/* SVG Chart Area */}
            <div className="relative w-full h-[170px] sm:h-[185px]">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Horizontal Guide Lines */}
                <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="currentColor" className="text-zinc-200/50 dark:text-zinc-800/50" strokeDasharray="3 3" />
                <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="currentColor" className="text-zinc-200/50 dark:text-zinc-800/50" strokeDasharray="3 3" />
                <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="currentColor" className="text-zinc-300/70 dark:text-zinc-700/70" />

                {/* Vertical Cursor Tracking Line on Hover */}
                {activeItem && (
                  <line
                    x1={activeItem.x}
                    y1={paddingY}
                    x2={activeItem.x}
                    y2={height - paddingY}
                    stroke={theme.color}
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    className="opacity-80"
                  />
                )}

                {/* Gradient Fill */}
                <defs>
                  <linearGradient id={theme.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={theme.color} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area Background */}
                {areaD && <path d={areaD} fill={`url(#${theme.gradientId})`} />}

                {/* Line Path */}
                <motion.path
                  key={viewMode + points.length}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  d={pathD}
                  fill="none"
                  stroke={theme.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points / Nodes */}
                {points.map((p, idx) => (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => setHoveredIdx(idx)}
                    onTouchStart={() => setHoveredIdx(idx)}
                  >
                    {/* Expanded invisible touch hit target */}
                    <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hoveredIdx === idx ? '6' : '4'}
                      fill="#ffffff"
                      stroke={theme.color}
                      strokeWidth="2.5"
                      className="transition-all duration-150 shadow-md"
                    />
                  </g>
                ))}
              </svg>

              {/* X-Axis Date Labels Overlay */}
              <div className="flex justify-between px-2 text-[10px] sm:text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-2 select-none overflow-hidden">
                {salesTrends.map((d, i) => {
                  // Thin out labels if many days are plotted
                  const step = Math.ceil(salesTrends.length / (salesTrends.length > 20 ? 6 : 8));
                  if (salesTrends.length > 8 && i % step !== 0 && i !== salesTrends.length - 1) {
                    return null;
                  }
                  const formatted = new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <span
                      key={i}
                      onClick={() => setHoveredIdx(i)}
                      className={`truncate text-center cursor-pointer transition-colors ${
                        hoveredIdx === i ? 'font-black' : 'hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                      style={{ color: hoveredIdx === i ? theme.color : undefined }}
                    >
                      {formatted}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
