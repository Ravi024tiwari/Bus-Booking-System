'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, RefreshCw, Bus, Layers, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FleetStatusResult, FleetSegment } from '@/lib/admin-dashboard';

interface AdminFleetStatusProps {
  initialData?: FleetStatusResult;
}

type FleetViewMode = 'operational' | 'category';

export default function AdminFleetStatus({ initialData }: AdminFleetStatusProps) {
  const [data, setData] = useState<FleetStatusResult | null>(initialData || null);
  const [viewMode, setViewMode] = useState<FleetViewMode>('operational');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLiveFleet = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/dashboard/fleet-status');
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('[Fleet Status] Failed to fetch live data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchLiveFleet();
    }
  }, []);

  const totalBuses = data?.total || 0;
  const currentSegments: FleetSegment[] = viewMode === 'operational'
    ? (data?.operationalSegments || [])
    : (data?.categorySegments || []);

  // Donut geometry helper properties
  const radius = 55;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const center = 75;

  let cumulativePercent = 0;

  const activeHoverItem = hoveredIdx !== null && currentSegments[hoveredIdx] ? currentSegments[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[380px] group select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Bus className="h-4 w-4" />
          </div>
          <h3 className="font-extrabold text-base text-zinc-900 dark:text-white leading-none">Fleet Overview</h3>
          {loading && <RefreshCw className="h-3.5 w-3.5 text-indigo-500 animate-spin" />}
        </div>

        {/* Mode switcher & Refresh */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800/70 rounded-xl border border-zinc-200/40 dark:border-zinc-700/40 text-[10px] font-bold">
            <button
              onClick={() => {
                setViewMode('operational');
                setHoveredIdx(null);
              }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'operational'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Status
            </button>
            <button
              onClick={() => {
                setViewMode('category');
                setHoveredIdx(null);
              }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'category'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Category
            </button>
          </div>

          <button
            onClick={fetchLiveFleet}
            title="Refresh Fleet Data"
            disabled={loading}
            className="p-1 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 border border-zinc-200/40 dark:border-zinc-700/40 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Donut and Legend row */}
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6 py-4">
        
        {/* SVG Donut Circle */}
        <div className="relative w-[140px] h-[140px] sm:w-[150px] sm:h-[150px] shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background base circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800/80"
              strokeWidth={strokeWidth}
            />

            {/* Status segments */}
            {currentSegments.map((segment, idx) => {
              if (segment.percent <= 0 && currentSegments.every(s => s.count === 0)) return null;
              
              const safePercent = totalBuses > 0 ? (segment.count / totalBuses) * 100 : 0;
              const strokeDashoffset = circumference - (safePercent / 100) * circumference;
              const rotation = (cumulativePercent / 100) * 360;
              cumulativePercent += safePercent;

              const isHovered = hoveredIdx === idx;
              
              return (
                <circle
                  key={segment.label + idx + viewMode}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    transformOrigin: '75px 75px',
                    transform: `rotate(${rotation}deg)`
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
                  onTouchStart={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
                />
              );
            })}
          </svg>

          {/* Centered statistics label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
            <AnimatePresence mode="wait">
              {activeHoverItem ? (
                <motion.div
                  key={activeHoverItem.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center justify-center"
                >
                  <span className="text-xl font-black text-zinc-900 dark:text-white leading-none">
                    {activeHoverItem.count}
                  </span>
                  <span className="text-[8px] font-extrabold uppercase mt-1 leading-none truncate max-w-[85px]" style={{ color: activeHoverItem.color }}>
                    {activeHoverItem.label}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="total"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center justify-center"
                >
                  <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white leading-none">
                    {totalBuses}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-1 leading-none">
                    Total Fleet
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legend listing */}
        <div className="flex flex-col gap-1.5 flex-1 justify-center w-full sm:w-auto">
          {currentSegments.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            const percent = totalBuses > 0 ? Math.round((item.count / totalBuses) * 100) : 0;
            return (
              <div 
                key={item.label} 
                className={`flex items-center justify-between p-1.5 sm:p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  isHovered 
                    ? 'bg-zinc-100 dark:bg-zinc-800/80 translate-x-1 shadow-xs' 
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div 
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200 truncate">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span className="text-[11px] font-black text-zinc-900 dark:text-white">
                    {item.count}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                    ({percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-[10px] text-zinc-400 font-bold">
          {data?.operational?.active || 0} active in route rotation
        </span>
        <Link 
          href="/admin/buses" 
          className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-extrabold flex items-center gap-1 group-hover:gap-1.5 transition-all duration-200"
        >
          Manage fleet <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

    </div>
  );
}
