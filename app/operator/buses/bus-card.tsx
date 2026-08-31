'use client';

import React from 'react';
import { 
  Bus,
  Wifi, 
  Wind, 
  Zap, 
  MapPin, 
  Calendar, 
  Droplet, 
  Layers,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export interface BusData {
  id: string;
  busNumber: string;
  type: 'AC Sleeper' | 'Non-AC Sleeper' | 'AC Seater' | 'Luxury Seater' | 'Non-AC Seater' | string;
  capacity: number;
  rows: number;
  cols: number;
  sleeperSeats: string[];
  amenities: string[];
  images: string[];
  createdAt: string;
  activeTrip?: {
    id: string;
    source: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
    routeName: string;
  } | null;
}

interface BusCardProps {
  bus: BusData;
  idx?: number;
  onClick?: () => void;
  selected?: boolean;
}

export default function BusCard({ bus, idx = 0, onClick, selected = false }: BusCardProps) {
  const isTravelling = !!bus.activeTrip;

  // Resolve amenities icons
  const renderAmenityIcon = (amenity: string) => {
    const clean = amenity.toLowerCase();
    if (clean.includes('wifi')) return <span key={amenity} title="WiFi Available"><Wifi className="h-3 w-3 text-sky-400" /></span>;
    if (clean.includes('ac') || clean.includes('condition')) return <span key={amenity} title="Air Conditioned"><Wind className="h-3 w-3 text-teal-400" /></span>;
    if (clean.includes('charg') || clean.includes('usb') || clean.includes('plug')) return <span key={amenity} title="USB Charger"><Zap className="h-3 w-3 text-amber-400" /></span>;
    if (clean.includes('water')) return <span key={amenity} title="Water Provided"><Droplet className="h-3 w-3 text-blue-400" /></span>;
    return null;
  };

  const busCoverImage = bus.images && bus.images.length > 0 && bus.images[0] 
    ? bus.images[0] 
    : (idx % 2 === 0 ? '/images/bus1.jpg' : '/images/bus2.jpg');

  return (
    <Card 
      onClick={onClick}
      className={`border border-zinc-200/80 dark:border-zinc-800 rounded-[1.75rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between p-3 sm:p-3.5 gap-3 group relative overflow-visible bg-white dark:bg-zinc-900 cursor-pointer select-none ${
        selected ? 'ring-2 ring-[#ff2d88] border-[#ff2d88]' : ''
      }`}
    >
      {/* 1. TOP BUS PHOTO WITH ROUNDED CORNERS & OVERLAYS */}
      <div className="relative h-38 sm:h-42 w-full rounded-2xl overflow-hidden select-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-800/80 shadow-xs">
        <img 
          src={busCoverImage} 
          alt={`Bus ${bus.busNumber}`} 
          className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-500 rounded-2xl"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35 rounded-2xl" />

        {/* Status Badge Overlay (top-left) */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase backdrop-blur-md border border-white/20 shadow-xs ${
            isTravelling 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
              : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isTravelling ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isTravelling ? 'On Road' : 'Idle / Ready'}
          </span>
        </div>

        {/* Bus Type Badge Overlay (top-right) */}
        <div className="absolute top-2.5 right-2.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-bold text-[9px] uppercase tracking-wider shadow-xs">
            {bus.type}
          </span>
        </div>

        {/* Capacity & Grid Spec Overlay (bottom-left) */}
        <div className="absolute bottom-2.5 left-2.5 flex flex-col text-white">
          <span className="text-xs sm:text-sm font-black tracking-tight drop-shadow-sm flex items-center gap-1">
            <Bus className="h-3 w-3 text-[#ff2d88]" />
            {bus.capacity} Seats
          </span>
          <span className="text-[10px] text-zinc-200 font-semibold drop-shadow-sm flex items-center gap-1">
            <Layers className="h-2.5 w-2.5" />
            {bus.rows}x{bus.cols} Grid Layout
          </span>
        </div>

        {/* Amenities Preview (bottom-right) */}
        {bus.amenities && bus.amenities.length > 0 && (
          <div className="absolute bottom-2.5 right-2.5">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/15 rounded-lg shadow-xs">
              {bus.amenities.slice(0, 3).map((amenity) => renderAmenityIcon(amenity))}
              {bus.amenities.length > 3 && (
                <span className="text-[8px] text-white font-bold">+{bus.amenities.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. CARD CONTENT BODY */}
      <div className="flex flex-col gap-2.5 px-0.5">
        
        {/* Vehicle Header & Current Status/Route */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-1.5">
            <span className="font-black text-sm sm:text-base text-zinc-900 dark:text-white uppercase tracking-tight truncate">
              {bus.busNumber}
            </span>
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
              Fleet #{bus.id ? bus.id.slice(-5).toUpperCase() : '001'}
            </span>
          </div>

          {isTravelling && bus.activeTrip ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{bus.activeTrip.source}</span>
              <ArrowRight className="h-2.5 w-2.5 shrink-0 text-zinc-400" />
              <span className="truncate">{bus.activeTrip.destination}</span>
            </div>
          ) : (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium truncate flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
              Registered Fleet Vehicle · Ready for Dispatch
            </span>
          )}
        </div>

        {/* 2-Column Meta Grid */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-2 text-xs select-none">
          {/* Box 1: Seater vs Sleeper breakdown */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-6 w-6 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-500">
              <Layers className="h-3 w-3" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate leading-none">
                {bus.sleeperSeats && bus.sleeperSeats.length > 0 ? `${bus.sleeperSeats.length} Sleepers` : 'All Seater'}
              </span>
              <span className="text-[8px] text-zinc-400 truncate mt-0.5 leading-none">
                {bus.capacity - (bus.sleeperSeats?.length || 0)} Standard Seats
              </span>
            </div>
          </div>

          {/* Box 2: Current Status / Schedule */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-6 w-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-500">
              <Clock className="h-3 w-3" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate leading-none">
                {isTravelling ? 'In Transit' : 'Available'}
              </span>
              <span className="text-[8px] text-zinc-400 truncate mt-0.5 leading-none">
                {isTravelling && bus.activeTrip?.departureTime 
                  ? `Dep: ${new Date(bus.activeTrip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Ready to Assign'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. CARD BOTTOM ROW: ACTION BUTTON */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider leading-none">Status</span>
            <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 leading-none">
              {isTravelling ? 'Active on Road' : 'Ready for Trip'}
            </span>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-[11px] rounded-xl shadow-xs transition-all cursor-pointer group-hover:bg-[#ff2d88] group-hover:text-white dark:group-hover:bg-[#ff2d88] dark:group-hover:text-white active:scale-95"
          >
            <span>Manage Bus</span>
            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </Card>
  );
}
