'use client';

import React from 'react';
import { 
  ArrowRight, 
  MoreVertical
} from 'lucide-react';

interface TripItem {
  id: string;
  busId: string;
  routeId: string;
  busNumber: string;
  busType: string;
  source: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'IN_TRANSIT' | 'ARRIVED' | 'CANCELLED';
  busCapacity: number;
  bookedSeatsCount: number;
  viaStops: string[];
  operatorName?: string;
  offerPercentage?: number;
  offerLimit?: number;
  offerBookedCount?: number;
}

interface TripCardProps {
  trip: TripItem;
  imageIndex: number;
  layout?: 'list' | 'grid';
  onBook?: (tripId: string) => void;
  onViewDetails?: (tripId: string) => void;
}

export default function TripCard({ 
  trip, 
  imageIndex, 
  layout = 'list', 
  onBook, 
  onViewDetails 
}: TripCardProps) {
  // Format Date String timezone-safely
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Convert Departure ISO string or timestamp to time representation
  const formatTimeString = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    if (status === 'SCHEDULED') return 'bg-blue-500/10 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
    if (status === 'BOARDING') return 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
    if (status === 'DEPARTED' || status === 'IN_TRANSIT') return 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400';
    if (status === 'ARRIVED') return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
    if (status === 'CANCELLED') return 'bg-rose-500/10 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
    return 'bg-zinc-500/10 text-zinc-600 dark:bg-zinc-950/20 dark:text-zinc-400';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'SCHEDULED') return 'Scheduled';
    if (status === 'BOARDING') return 'Boarding Soon';
    if (status === 'DEPARTED' || status === 'IN_TRANSIT') return 'On Time';
    if (status === 'ARRIVED') return 'Arrived';
    if (status === 'CANCELLED') return 'Cancelled';
    return status;
  };

  // 1. GRID LAYOUT RENDER
  if (layout === 'grid') {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-[28px] p-4.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.45)] transition-all duration-300 flex flex-col h-full justify-between gap-4 group">
        
        {/* Top: Image & Status Badge overlay */}
        <div className="relative h-40 w-full rounded-2xl overflow-hidden shrink-0 border border-zinc-150 dark:border-zinc-800 shadow-sm select-none">
          <img 
            src={imageIndex % 2 === 0 ? '/images/bus1.jpg' : '/images/bus2.jpg'} 
            alt="Bus preview" 
            className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          />
          {/* Offer Badge overlay */}
          {trip.offerPercentage && trip.offerPercentage > 0 && (trip.offerLimit || 0) > (trip.offerBookedCount || 0) && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm bg-gradient-to-r from-rose-500 to-rose-600 text-white z-10">
              {trip.offerPercentage}% OFF
            </span>
          )}
          {/* Status Badge overlay */}
          <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm z-10 ${getStatusBadgeStyle(trip.status)}`}>
            {getStatusLabel(trip.status)}
          </span>
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 gap-3 px-1">
          
          {/* Timing & Date */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-[#ff2d88] tracking-tight">
              {formatTimeString(trip.departureTime)}
            </span>
            <span className="text-[11px] text-zinc-450 dark:text-zinc-500 font-bold">
              {formatDateString(trip.date)}
            </span>
          </div>

          {/* Route Source -> Destination */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-sm text-zinc-900 dark:text-white">
                {trip.source}
              </span>
              <ArrowRight className="h-3 w-3 text-zinc-450" />
              <span className="font-extrabold text-sm text-zinc-900 dark:text-white">
                {trip.destination}
              </span>
            </div>
            {trip.viaStops && trip.viaStops.length > 0 ? (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold truncate">
                Via: {trip.viaStops.join(', ')}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
                Direct Route
              </span>
            )}
          </div>
        </div>

        {/* Bottom Section: Price & Action Buttons */}
        <div className="flex flex-col gap-3 border-t border-zinc-150/40 dark:border-zinc-800/60 pt-3 mt-auto px-1">
          {/* Starting From Price */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-450 uppercase tracking-wider font-extrabold">Starting From</span>
            <div className="flex items-baseline gap-0.5 leading-none">
              <span className="text-xs font-black text-zinc-400">₹</span>
              <span className="text-base font-black text-zinc-850 dark:text-zinc-100">
                {trip.fare}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full mt-1">
            {onViewDetails && (
              <button 
                onClick={() => onViewDetails(trip.id)}
                className="flex-1 py-2.5 border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer outline-none text-center"
              >
                Details
              </button>
            )}

            <button
              onClick={() => onBook && onBook(trip.id)}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:opacity-95 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-md shadow-[#ff2d88]/15 transform active:scale-[0.98] transition-all cursor-pointer outline-none text-center"
            >
              Book
            </button>
            
            <button className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer text-zinc-450">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    );
  }

  // 2. LIST LAYOUT RENDER (DEFAULT)
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-[28px] p-4.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.45)] transition-all duration-300 flex flex-col gap-5 group">
      
      {/* Top: Full-width Bus Image Header */}
      <div className="relative h-40 sm:h-48 md:h-56 w-full rounded-2xl overflow-hidden shrink-0 border border-zinc-155 dark:border-zinc-800 shadow-sm select-none">
        <img 
          src={imageIndex % 2 === 0 ? '/images/bus1.jpg' : '/images/bus2.jpg'} 
          alt="Bus preview" 
          className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-300"
        />
        {/* Offer Badge overlay */}
        {trip.offerPercentage && trip.offerPercentage > 0 && (trip.offerLimit || 0) > (trip.offerBookedCount || 0) && (
          <span className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-sm bg-gradient-to-r from-rose-500 to-rose-600 text-white z-10">
            {trip.offerPercentage}% OFF
          </span>
        )}
        {/* Status Badge overlay */}
        <span className={`absolute top-3.5 right-3.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-sm z-10 ${getStatusBadgeStyle(trip.status)}`}>
          {getStatusLabel(trip.status)}
        </span>
      </div>

      {/* Bottom Section: Details & Action Buttons (Horizontal layout) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-1 pb-1">
        
        {/* Left Side: Timings, Date & Route Info */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 flex-1 min-w-0">
          
          {/* Timings & Departure Date */}
          <div className="flex flex-col select-none shrink-0 min-w-[95px]">
            <span className="text-base sm:text-xl font-black text-[#ff2d88] tracking-tight leading-none">
              {formatTimeString(trip.departureTime)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-450 dark:text-zinc-500 font-bold mt-1.5 leading-none">
              {formatDateString(trip.date)}
            </span>
          </div>

          {/* Route details */}
          <div className="flex flex-col gap-0.5 truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                {trip.source}
              </span>
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-450" />
              <span className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                {trip.destination}
              </span>
            </div>
            {trip.viaStops && trip.viaStops.length > 0 ? (
              <span className="text-[10px] sm:text-[11px] text-zinc-405 dark:text-zinc-500 font-bold truncate">
                Via: {trip.viaStops.join(', ')}
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] text-zinc-405 dark:text-zinc-500 font-bold">
                Direct Route
              </span>
            )}
          </div>

        </div>

        {/* Right Side: Pricing & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-zinc-150/40 dark:border-zinc-800/60 pt-3.5 md:pt-0 shrink-0">
          
          {/* Pricing tag */}
          <div className="flex flex-col justify-center min-w-[95px] md:text-right">
            <span className="text-[9px] text-zinc-450 uppercase tracking-widest font-extrabold leading-none">Starting From</span>
            <div className="flex items-baseline md:justify-end gap-0.5 mt-1.5 leading-none">
              <span className="text-xs font-black text-zinc-400">₹</span>
              <span className="text-base sm:text-lg font-black text-zinc-850 dark:text-zinc-100">
                {trip.fare}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {onViewDetails && (
              <button 
                onClick={() => onViewDetails(trip.id)}
                className="px-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40 rounded-xl text-xs font-extrabold transition-all cursor-pointer outline-none"
              >
                View Details
              </button>
            )}

            <button
              onClick={() => onBook && onBook(trip.id)}
              className="px-5 py-2.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#ff2d88]/15 transform active:scale-[0.98] transition-all cursor-pointer outline-none"
            >
              Book
            </button>
            
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer text-zinc-450">
              <MoreVertical className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

      </div>
      
    </div>
  );
}
