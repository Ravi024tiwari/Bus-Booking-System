'use client';

import React, { useState } from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AdminBusDetails } from '@/lib/admin-buses';

interface BusCardProps {
  bus: AdminBusDetails;
  onClick?: () => void;
}

export default function BusCard({ bus, onClick }: BusCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500 text-white';
      case 'MAINTENANCE':
        return 'bg-amber-500 text-white';
      case 'INACTIVE':
        return 'bg-rose-500 text-white';
      default:
        return 'bg-zinc-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'ACTIVE') return 'Active';
    if (status === 'MAINTENANCE') return 'In Maintenance';
    if (status === 'INACTIVE') return 'Inactive';
    return status;
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.2rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_20px_40px_rgba(99,102,241,0.06)] hover:-translate-y-1.5 transition-all duration-300 select-none cursor-pointer flex flex-col group"
    >
      
      {/* Bus Image container with overlay status and heart */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img 
          src={bus.imageUrl} 
          alt={bus.busNumber}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* Status Pill overlay */}
        <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeStyle(bus.status)}`}>
          {getStatusLabel(bus.status)}
        </span>

        {/* Favorite Heart Button overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute bottom-4 right-4 h-9 w-9 bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-900 rounded-full flex items-center justify-center shadow-md backdrop-blur-xs outline-none transition-colors"
        >
          <Heart 
            className={`h-4.5 w-4.5 transition-colors ${
              isFavorite ? 'fill-[#ff2d88] text-[#ff2d88]' : 'text-zinc-400 group-hover:text-zinc-650'
            }`} 
          />
        </button>
      </div>

      {/* Card Content body */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        
        {/* Plate details & model badge */}
        <div className="flex items-center justify-between">
          <h4 className="text-base font-black text-zinc-900 dark:text-white uppercase leading-none">
            {bus.busNumber}
          </h4>
          <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-[10px] font-extrabold px-2.5 py-1 rounded-md leading-none select-none uppercase">
            {bus.model}
          </span>
        </div>

        {/* Route Raipur ➔ Mumbai */}
        <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-none">
          {bus.route ? (
            <span className="flex items-center gap-1.5">
              {bus.route.source} ➔ {bus.route.destination}
            </span>
          ) : (
            <span>No route allocated</span>
          )}
        </div>

        {/* Separator */}
        <div className="h-px bg-zinc-100 dark:bg-zinc-800/60" />

        {/* Operator details & capacity specs */}
        <div className="flex items-center justify-between gap-3 text-xs font-bold mt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-7 w-7 border border-indigo-200/30 shrink-0">
              <AvatarImage src={bus.operator?.profileImage || ''} alt={bus.operator?.name || 'Operator'} />
              <AvatarFallback className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] flex items-center justify-center">
                {(bus.operator?.name || 'OP').split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-zinc-700 dark:text-zinc-350 truncate">
              {bus.operator?.name || 'Unknown Operator'}
            </span>
          </div>

          <span className="text-zinc-450 dark:text-zinc-500 shrink-0 text-[11px] font-extrabold">
            {bus.type} • {bus.capacity} Seats
          </span>
        </div>

        {/* View Details Link */}
        <div className="mt-2.5 flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 leading-none select-none group-hover:gap-1.5 transition-all">
          <span>View Details</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>

      </div>

    </div>
  );
}
