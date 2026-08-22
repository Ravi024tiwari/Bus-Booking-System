'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function AdminFleetStatus() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Simulated metrics matching screenshot values
  const dataset = [
    { label: 'Active', count: 350, percent: 72, color: '#6366f1' }, // Indigo/Purple
    { label: 'Maintenance', count: 58, percent: 12, color: '#ff7c52' }, // Orange/Amber
    { label: 'Inactive', count: 39, percent: 8, color: '#10b981' }, // Green/Teal
    { label: 'Pending', count: 39, percent: 8, color: '#ff2d88' }  // Pink/Rose
  ];

  const totalBuses = 486;

  // Donut geometry helper properties
  const radius = 55;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const center = 75;

  let cumulativePercent = 0;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[360px] group select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Fleet Overview</h3>
      </div>

      {/* Donut and Legend row */}
      <div className="flex-1 flex items-center justify-center gap-6 py-4">
        
        {/* SVG Donut Circle */}
        <div className="relative w-[150px] h-[150px] shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background base circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="rgba(228, 228, 231, 0.15)"
              strokeWidth={strokeWidth}
            />

            {/* Status segments */}
            {dataset.map((segment, idx) => {
              const strokeDashoffset = circumference - (segment.percent / 100) * circumference;
              const rotation = (cumulativePercent / 100) * 360;
              cumulativePercent += segment.percent;

              const isHovered = hoveredIdx === idx;
              
              return (
                <circle
                  key={idx}
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
                />
              );
            })}
          </svg>

          {/* Centered statistics label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-black text-zinc-900 dark:text-white leading-none">
              {totalBuses}
            </span>
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-1 leading-none">
              Total Buses
            </span>
          </div>
        </div>

        {/* Legend listing */}
        <div className="flex flex-col gap-2 flex-1 justify-center">
          {dataset.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div 
                key={idx} 
                className={`flex items-center justify-between p-1.5 rounded-xl transition-all duration-200 ${
                  isHovered ? 'bg-zinc-50 dark:bg-zinc-800/40 translate-x-1' : ''
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300">
                    {item.label}
                  </span>
                </div>
                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400">
                  {item.count} ({item.percent}%)
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800">
        <Link 
          href="/admin/buses" 
          className="text-xs text-indigo-600 hover:text-indigo-700 font-extrabold flex items-center justify-center gap-1 group-hover:gap-1.5 transition-all duration-200"
        >
          View all buses <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

    </div>
  );
}
