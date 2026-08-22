'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminBookingOverview() {
  const [timeframe, setTimeframe] = useState('This Week');
  const [showDropdown, setShowDropdown] = useState(false);

  // Simulated datasets
  const weekData = [
    { label: 'Mon', value: 800 },
    { label: 'Tue', value: 1200 },
    { label: 'Wed', value: 1500 },
    { label: 'Thu', value: 1400 },
    { label: 'Fri', value: 1650 },
    { label: 'Sat', value: 1800 },
    { label: 'Sun', value: 1600 }
  ];

  const monthData = [
    { label: 'Week 1', value: 5000 },
    { label: 'Week 2', value: 7200 },
    { label: 'Week 3', value: 8500 },
    { label: 'Week 4', value: 8842 }
  ];

  const currentData = timeframe === 'This Week' ? weekData : monthData;
  const maxValue = Math.max(...currentData.map(d => d.value), 2000);

  // SVG dimensions
  const width = 500;
  const height = 180;
  const padding = 20;

  // Calculate points
  const points = currentData.map((d, index) => {
    const x = padding + (index * (width - padding * 2)) / (currentData.length - 1);
    const y = height - padding - (d.value * (height - padding * 2)) / maxValue;
    return { x, y, ...d };
  });

  // SVG Line path string
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    return `${acc} L ${p.x} ${p.y}`;
  }, '');

  // SVG Area path string
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[360px] relative select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Booking Overview</h3>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
            Platform traffic showing confirmed reservations count
          </p>
        </div>

        {/* Dropdown filter */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 border border-zinc-200/20 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5" />
            {timeframe}
            <ChevronDown className="h-3 w-3" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 p-1 shadow-lg z-20">
              {['This Week', 'This Month'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setTimeframe(opt);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 rounded-lg transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SVG Line Chart Plot */}
      <div className="flex-1 flex flex-col justify-end mt-4">
        <div className="relative w-full h-[180px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(228, 228, 231, 0.15)" strokeDasharray="3 3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(228, 228, 231, 0.15)" strokeDasharray="3 3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(228, 228, 231, 0.3)" />

            {/* Gradient Fill under the line */}
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#purpleGradient)" />

            {/* Glowing Line Path */}
            <motion.path 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              d={pathD} 
              fill="none" 
              stroke="#6366f1" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
            />

            {/* Interactive Data Nodes */}
            {points.map((p, idx) => (
              <g key={idx} className="group/node cursor-pointer">
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  fill="#ffffff" 
                  stroke="#6366f1" 
                  strokeWidth="2.5" 
                  className="transition-all duration-150 group-hover/node:r-6" 
                />
                
                {/* Micro tooltip displaying on hover */}
                <foreignObject 
                  x={p.x - 35} 
                  y={p.y - 32} 
                  width="70" 
                  height="26" 
                  className="overflow-visible pointer-events-none opacity-0 group-hover/node:opacity-100 transition-opacity duration-150"
                >
                  <div className="bg-zinc-950 text-white text-[10px] font-black rounded-md px-1.5 py-0.5 text-center shadow-md">
                    {p.value}
                  </div>
                </foreignObject>
              </g>
            ))}
          </svg>

          {/* X-axis labels overlay */}
          <div className="flex justify-between px-5 text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 mt-1 select-none">
            {currentData.map((d, i) => (
              <span key={i}>{d.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Legend showing metrics from the mockup screenshot */}
      <div className="grid grid-cols-4 gap-2 border-t border-zinc-150 dark:border-zinc-800/80 pt-4 mt-2">
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Bookings</span>
          <span className="text-sm font-black text-zinc-800 dark:text-white mt-1">8,842</span>
          <div className="h-1 w-6 bg-indigo-500 rounded-full mt-1.5" />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Completed</span>
          <span className="text-sm font-black text-emerald-500 mt-1">6,210</span>
          <div className="h-1 w-6 bg-emerald-500 rounded-full mt-1.5" />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Cancelled</span>
          <span className="text-sm font-black text-rose-500 mt-1">642</span>
          <div className="h-1 w-6 bg-rose-500 rounded-full mt-1.5" />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Pending</span>
          <span className="text-sm font-black text-amber-500 mt-1">1,990</span>
          <div className="h-1 w-6 bg-amber-500 rounded-full mt-1.5" />
        </div>
      </div>

    </div>
  );
}
