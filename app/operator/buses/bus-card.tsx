'use client';

import React from 'react';
import { 
  Wifi, 
  Wind, 
  Zap, 
  MapPin, 
  Calendar, 
  Droplet, 
  Layers,
  Sparkles,
  ArrowRight,
  Info
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
  onClick?: () => void;
  selected?: boolean;
}

export default function BusCard({ bus, onClick, selected = false }: BusCardProps) {
  const isTravelling = !!bus.activeTrip;

  // Resolve amenities icons
  const renderAmenityIcon = (amenity: string) => {
    const clean = amenity.toLowerCase();
    if (clean.includes('wifi')) return <span key={amenity} title="WiFi Available"><Wifi className="h-4 w-4 text-sky-500" /></span>;
    if (clean.includes('ac') || clean.includes('condition')) return <span key={amenity} title="Air Conditioned"><Wind className="h-4 w-4 text-teal-500" /></span>;
    if (clean.includes('charg') || clean.includes('usb') || clean.includes('plug')) return <span key={amenity} title="USB Charger"><Zap className="h-4 w-4 text-amber-500" /></span>;
    if (clean.includes('water')) return <span key={amenity} title="Water Provided"><Droplet className="h-4 w-4 text-blue-500" /></span>;
    return null;
  };

  return (
    <Card 
      onClick={onClick}
      className={`relative cursor-pointer overflow-hidden rounded-[2rem] border transition-all duration-300 select-none group bg-white dark:bg-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.01)] ${
        selected 
          ? 'border-[#ff2d88] dark:border-[#ff5666] ring-2 ring-[#ff2d88]/10 dark:ring-[#ff5666]/10 shadow-[0_20px_40px_rgba(255,45,136,0.08)] -translate-y-1.5' 
          : 'border-zinc-200/50 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1.5'
      }`}
    >
      {/* Visual Accent Bar */}
      <div className={`absolute top-0 inset-x-0 h-1.5 transition-all duration-300 ${
        selected 
          ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88]' 
          : 'bg-zinc-200 dark:bg-zinc-800 group-hover:bg-gradient-to-r group-hover:from-zinc-300 group-hover:to-zinc-400 dark:group-hover:from-zinc-700 dark:group-hover:to-zinc-650'
      }`} />

      {/* Decorative Blur Background Accent */}
      {selected && (
        <div className="absolute top-[-10%] right-[-10%] w-[120px] h-[120px] bg-gradient-to-tr from-[#ff7c52] to-[#ff2d88] rounded-full blur-[35px] opacity-10 pointer-events-none" />
      )}

      <CardContent className="p-6 pt-7 flex flex-col gap-4.5">
        
        {/* LICENSE PLATE & STATUS ROW */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tight text-zinc-900 dark:text-white uppercase leading-none">
              {bus.busNumber}
            </span>
            <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold py-0.5 px-2.5 rounded-full border-none shadow-none uppercase select-none">
              {bus.type}
            </Badge>
          </div>
          
          <div className="flex items-center shrink-0">
            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
              isTravelling 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' 
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/10'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isTravelling ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isTravelling ? 'On Road' : 'Idle'}
            </span>
          </div>
        </div>

        {/* DETAILS/SPECIFICATIONS ROW */}
        <div className="grid grid-cols-3 gap-3 border-y border-dashed border-zinc-100 dark:border-zinc-800/60 py-3.5 select-none">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Capacity</span>
            <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none">
              {bus.capacity} <span className="text-[10px] text-zinc-400 font-medium">seats</span>
            </span>
          </div>

          <div className="flex flex-col border-x border-zinc-100 dark:border-zinc-800/40 px-3">
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Grid Layout</span>
            <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
              {bus.rows}x{bus.cols}
            </span>
          </div>

          <div className="flex flex-col pl-3">
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Amenities</span>
            <div className="flex items-center gap-1.5 mt-1 leading-none">
              {bus.amenities && bus.amenities.length > 0 ? (
                bus.amenities.slice(0, 3).map((amenity) => renderAmenityIcon(amenity))
              ) : (
                <span className="text-[10px] text-zinc-400">None</span>
              )}
              {bus.amenities && bus.amenities.length > 3 && (
                <span className="text-[9px] text-zinc-400 font-bold">+{bus.amenities.length - 3}</span>
              )}
            </div>
          </div>
        </div>

        {/* ACTIVE TRIP DETAILS OR FALLBACK */}
        {isTravelling && bus.activeTrip ? (
          <div className="p-3 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 rounded-2xl flex flex-col gap-2 relative">
            <div className="flex items-center justify-between text-[9px] text-indigo-500 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 animate-bounce-slow" />
                Active Traveling Route
              </span>
              <span className="bg-indigo-500/10 px-1.5 py-0.5 rounded">
                {bus.activeTrip.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <span>{bus.activeTrip.source}</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>{bus.activeTrip.destination}</span>
            </div>

            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>Dep: {new Date(bus.activeTrip.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/30 rounded-2xl flex items-center justify-between text-xs text-zinc-500 select-none">
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Fleet is currently idle
            </span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Ready for trip</span>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
