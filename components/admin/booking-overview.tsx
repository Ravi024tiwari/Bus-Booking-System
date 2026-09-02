'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, RefreshCw, TrendingUp, IndianRupee, Layers, CheckCircle2, XCircle, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { BookingOverviewResult } from '@/lib/admin-dashboard';

interface AdminBookingOverviewProps {
  initialData?: BookingOverviewResult;
}

const TIMEFRAME_OPTIONS = ['This Week', 'This Month', 'Last 30 Days'];
type ChartMetricMode = 'bookings' | 'revenue';

export default function AdminBookingOverview({ initialData }: AdminBookingOverviewProps) {
  const [timeframe, setTimeframe] = useState<string>(initialData?.timeframe || 'This Week');
  const [metricMode, setMetricMode] = useState<ChartMetricMode>('bookings');
  const [data, setData] = useState<BookingOverviewResult | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    label: string;
    fullDate?: string;
    bookings: number;
    revenue: number;
    x: number;
    y: number;
  } | null>(null);

  // Fetch real data when timeframe changes
  const fetchData = async (selectedTimeframe: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/dashboard/booking-overview?timeframe=${encodeURIComponent(selectedTimeframe)}`);
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('[Booking Overview] Failed to fetch live data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData || initialData.timeframe !== timeframe) {
      fetchData(timeframe);
    }
  }, [timeframe]);

  const chartData = data?.chartData || [];
  const metrics = data?.metrics || {
    totalBookings: 0,
    completed: 0,
    cancelled: 0,
    pending: 0
  };

  // SVG dimensions
  const width = 500;
  const height = 180;
  const paddingX = 28;
  const paddingY = 24;

  const activeValues = chartData.map(d => (metricMode === 'bookings' ? d.bookings : d.revenue));
  const maxDisplayValue = Math.max(...activeValues, metricMode === 'bookings' ? 5 : 1000);

  // Calculate points based on active metric mode
  const points = chartData.map((d, index) => {
    const value = metricMode === 'bookings' ? d.bookings : d.revenue;
    const x = chartData.length > 1
      ? paddingX + (index * (width - paddingX * 2)) / (chartData.length - 1)
      : width / 2;
    const y = height - paddingY - (value * (height - paddingY * 2)) / maxDisplayValue;
    return { x, y, ...d };
  });

  // SVG Line path string
  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '')
    : `M ${paddingX} ${height - paddingY} L ${width - paddingX} ${height - paddingY}`;

  // SVG Area path string
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  const totalPeriodBookings = chartData.reduce((sum, item) => sum + item.bookings, 0);
  const totalPeriodRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

  const isRevenue = metricMode === 'revenue';
  const themeColor = isRevenue ? '#10b981' : '#6366f1';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[410px] relative select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base lg:text-lg text-zinc-900 dark:text-white">Booking Overview</h3>
            {loading && <RefreshCw className="h-3.5 w-3.5 text-indigo-500 animate-spin" />}
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
            Real-time confirmed reservations and platform revenue trends
          </p>
        </div>

        {/* Action Controls (Metric Switcher, Timeframe filter & Refresh button) */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          
          {/* Mode Switcher: Bookings vs Revenue */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/70 rounded-2xl border border-zinc-200/40 dark:border-zinc-700/40 text-xs sm:text-sm font-extrabold">
            <button
              onClick={() => {
                setMetricMode('bookings');
                setHoveredPoint(null);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                metricMode === 'bookings'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Bookings
            </button>
            <button
              onClick={() => {
                setMetricMode('revenue');
                setHoveredPoint(null);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                metricMode === 'revenue'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <IndianRupee className="h-3.5 w-3.5" />
              Revenue
            </button>
          </div>

          <button
            onClick={() => fetchData(timeframe)}
            title="Refresh Live Data"
            disabled={loading}
            className="p-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 border border-zinc-200/40 dark:border-zinc-700/40 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 border border-zinc-200/40 dark:border-zinc-700/40 rounded-xl text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer shrink-0"
            >
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span>{timeframe}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800 p-1 shadow-xl z-30"
                >
                  {TIMEFRAME_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setTimeframe(opt);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                        timeframe === opt
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* SVG Line Chart Plot */}
      <div className="flex-1 flex flex-col justify-end mt-4 relative">
        
        {/* Dynamic header stats bar */}
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-zinc-500 mb-1 px-1">
          <span className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
            {isRevenue ? (
              <>
                <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
                ₹{totalPeriodRevenue.toLocaleString('en-IN')}
                <span className="text-xs text-zinc-400 font-medium ml-1">
                  ({totalPeriodBookings} {totalPeriodBookings === 1 ? 'Booking' : 'Bookings'})
                </span>
              </>
            ) : (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                {totalPeriodBookings} {totalPeriodBookings === 1 ? 'Booking' : 'Bookings'}
                <span className="text-xs text-zinc-400 font-medium ml-1">
                  (₹{totalPeriodRevenue.toLocaleString('en-IN')})
                </span>
              </>
            )}
          </span>
          {hoveredPoint && (
            <span className={`text-xs font-black animate-in fade-in duration-150 ${isRevenue ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
              {hoveredPoint.fullDate || hoveredPoint.label}: {hoveredPoint.bookings} bookings • ₹{hoveredPoint.revenue.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className="relative w-full h-[170px] sm:h-[185px]">
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full overflow-visible" 
            preserveAspectRatio="none"
          >
            {/* Horizontal Grid Guidelines */}
            <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="currentColor" className="text-zinc-200/60 dark:text-zinc-800/60" strokeDasharray="3 3" />
            <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="currentColor" className="text-zinc-200/60 dark:text-zinc-800/60" strokeDasharray="3 3" />
            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="currentColor" className="text-zinc-300/80 dark:text-zinc-700/80" />

            {/* Vertical Tracking Line on Hover */}
            {hoveredPoint && (
              <line
                x1={hoveredPoint.x}
                y1={paddingY}
                x2={hoveredPoint.x}
                y2={height - paddingY}
                stroke={themeColor}
                strokeWidth="1.5"
                strokeDasharray="2 2"
                className="opacity-70"
              />
            )}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="chartGradientActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={themeColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            {areaD && <path d={areaD} fill="url(#chartGradientActive)" />}

            {/* Line Path */}
            <motion.path 
              key={timeframe + metricMode + points.length}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              d={pathD} 
              fill="none" 
              stroke={themeColor} 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />

            {/* Interactive Data Nodes */}
            {points.map((p, idx) => (
              <g 
                key={idx} 
                className="group/node cursor-pointer"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => setHoveredPoint(p)}
                onTouchStart={() => setHoveredPoint(p)}
              >
                {/* Hitbox for comfortable touch area */}
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={hoveredPoint?.label === p.label ? "6" : "4.5"} 
                  fill="#ffffff" 
                  stroke={themeColor} 
                  strokeWidth="2.5" 
                  className="transition-all duration-150 group-hover/node:r-6" 
                />
              </g>
            ))}
          </svg>

          {/* X-axis labels overlay */}
          <div className="flex justify-between px-2 text-[10px] sm:text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-2 select-none overflow-hidden">
            {chartData.map((d, i) => {
              if (chartData.length > 12 && i % Math.ceil(chartData.length / 7) !== 0 && i !== chartData.length - 1) {
                return null;
              }
              return (
                <span 
                  key={i} 
                  onClick={() => setHoveredPoint(points[i])}
                  className={`truncate text-center cursor-pointer transition-colors ${
                    hoveredPoint?.label === d.label
                      ? isRevenue ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-indigo-600 dark:text-indigo-400 font-black'
                      : 'hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {d.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Legend showing real metrics from MongoDB */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 border-t border-zinc-150 dark:border-zinc-800/80 pt-4 mt-3">
        
        {/* Total Bookings */}
        <div className="flex flex-col items-center bg-zinc-50/50 dark:bg-zinc-950/20 p-2.5 rounded-2xl border border-zinc-150/40 dark:border-zinc-850/40 transition-transform duration-150 hover:scale-[1.02] cursor-default">
          <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">Total Bookings</span>
          <span className="text-base sm:text-lg font-black text-zinc-900 dark:text-white mt-0.5">
            {metrics.totalBookings.toLocaleString('en-IN')}
          </span>
          <div className="h-1 w-6 bg-indigo-500 rounded-full mt-1" />
        </div>

        {/* Completed */}
        <div className="flex flex-col items-center bg-zinc-50/50 dark:bg-zinc-950/20 p-2.5 rounded-2xl border border-zinc-150/40 dark:border-zinc-850/40 transition-transform duration-150 hover:scale-[1.02] cursor-default">
          <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">Completed</span>
          <span className="text-base sm:text-lg font-black text-emerald-500 mt-0.5">
            {metrics.completed.toLocaleString('en-IN')}
          </span>
          <div className="h-1 w-6 bg-emerald-500 rounded-full mt-1" />
        </div>

        {/* Cancelled */}
        <div className="flex flex-col items-center bg-zinc-50/50 dark:bg-zinc-950/20 p-2.5 rounded-2xl border border-zinc-150/40 dark:border-zinc-850/40 transition-transform duration-150 hover:scale-[1.02] cursor-default">
          <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">Cancelled</span>
          <span className="text-base sm:text-lg font-black text-rose-500 mt-0.5">
            {metrics.cancelled.toLocaleString('en-IN')}
          </span>
          <div className="h-1 w-6 bg-rose-500 rounded-full mt-1" />
        </div>

        {/* Pending */}
        <div className="flex flex-col items-center bg-zinc-50/50 dark:bg-zinc-950/20 p-2.5 rounded-2xl border border-zinc-150/40 dark:border-zinc-850/40 transition-transform duration-150 hover:scale-[1.02] cursor-default">
          <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">Pending</span>
          <span className="text-base sm:text-lg font-black text-amber-500 mt-0.5">
            {metrics.pending.toLocaleString('en-IN')}
          </span>
          <div className="h-1 w-6 bg-amber-500 rounded-full mt-1" />
        </div>

      </div>

    </div>
  );
}
