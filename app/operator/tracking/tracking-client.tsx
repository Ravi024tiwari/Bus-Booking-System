'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  User, 
  Play, 
  Flag, 
  XOctagon, 
  ChevronRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

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
  createdAt: string;
  viaStops: string[];
}

interface OperatorTrackingClientProps {
  initialActiveTrips: TripItem[];
}

export default function OperatorTrackingClient({ initialActiveTrips }: OperatorTrackingClientProps) {
  const [activeTrips, setActiveTrips] = useState<TripItem[]>(initialActiveTrips);
  const [loadingTripId, setLoadingTripId] = useState<string | null>(null);

  // Real-time synchronization for operator live page
  useEffect(() => {
    const socket = io();
    
    // Join rooms for all initial active trips
    activeTrips.forEach(trip => {
      socket.emit('join-trip', trip.id);
    });

    socket.on('trip:status-updated', ({ tripId, status }: { tripId: string; status: any }) => {
      console.log(`[Socket] Trip ${tripId} status updated to ${status}`);
      
      if (['ARRIVED', 'CANCELLED', 'SCHEDULED'].includes(status)) {
        // Remove from active list if status is no longer active
        setActiveTrips(prev => prev.filter(t => t.id !== tripId));
      } else {
        // Update status locally
        setActiveTrips(prev => prev.map(t => t.id === tripId ? { ...t, status } : t));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeTrips.length]);

  const handleUpdateTripStatus = async (tripId: string, newStatus: string) => {
    setLoadingTripId(tripId);
    try {
      const response = await axios.patch(`/api/trips/${tripId}`, { status: newStatus });
      
      if (response.data?.success) {
        toast.success(`Trip status manually updated to ${newStatus.replace('_', ' ')}`);
        
        // If arrived or cancelled, remove it from active list
        if (['ARRIVED', 'CANCELLED'].includes(newStatus)) {
          setActiveTrips(prev => prev.filter(t => t.id !== tripId));
        } else {
          setActiveTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: newStatus as any } : t));
        }
      }
    } catch (err: any) {
      console.error('[Operator Tracking Status Update Error]:', err);
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setLoadingTripId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'BOARDING':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/30';
      case 'DEPARTED':
      case 'IN_TRANSIT':
        return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-900/30';
      default:
        return 'bg-zinc-50 text-zinc-500 border border-zinc-200/40';
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 min-h-screen text-zinc-850 dark:text-zinc-200">
      
      {/* SCENIC OPERATIONAL HEADER BANNER */}
      <div className="w-full h-[18vh] min-h-[140px] md:h-[22vh] md:min-h-[180px] rounded-[32px] relative overflow-hidden flex items-center px-6 sm:px-12 shadow-md border border-zinc-200/20 mb-8 group select-none">
        <div 
          className="absolute inset-0 bg-cover bg-[position:center_40%] transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          style={{ backgroundImage: "url('/images/trip_bg.jpeg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff7c52]/10 via-transparent to-zinc-950/40 z-10" />
        
        <div className="relative z-20 flex items-center justify-between w-full">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none flex items-center gap-3">
              Live Operations tracking
              <Activity className="h-6 w-6 text-[#ff2d88] animate-pulse" />
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 font-semibold mt-3 max-w-sm sm:max-w-md leading-normal opacity-90">
              Monitor active bus journeys and manually dispatch stops updates.
            </p>
          </div>
        </div>
      </div>

      {/* TRIP CARDS CONTAINER */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between select-none">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400">
            Active Runs ({activeTrips.length})
          </h2>
          <span className="text-xs text-zinc-400 font-bold">
            Real-time status changes sync automatically
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {activeTrips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-zinc-900 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center border border-zinc-200/50 dark:border-zinc-850 shadow-sm"
            >
              <Bus className="h-12 w-12 text-zinc-300 dark:text-zinc-700 animate-bounce" />
              <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 mt-4">No active trips on road</h3>
              <p className="text-xs text-zinc-450 text-zinc-500 font-semibold mt-1.5 max-w-[340px] leading-relaxed">
                Currently, none of your buses are in Boarding or In Transit states. Update trip statuses in your scheduler.
              </p>
              <Link
                href="/operator/trips"
                className="mt-6 px-5 py-2.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Go to Trip Scheduler
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTrips.map((trip) => (
                <motion.div
                  layout
                  key={trip.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all flex flex-col justify-between gap-5 relative group"
                >
                  {/* Card Header: Route & Status */}
                  <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-850 pb-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-sm sm:text-base font-black text-zinc-900 dark:text-white">
                        <span>{trip.source}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span>{trip.destination}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-1">
                        Date: {formatDate(trip.date)} • Bus: {trip.busNumber}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${getStatusStyle(trip.status)}`}>
                      {trip.status === 'BOARDING' ? 'Boarding Open' : 'In Transit'}
                    </span>
                  </div>

                  {/* Operational Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-zinc-450 uppercase font-black text-zinc-450 tracking-wider">Departure Time</span>
                      <span className="text-zinc-800 dark:text-zinc-250 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        {formatTime(trip.departureTime)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-zinc-450 uppercase font-black text-zinc-450 tracking-wider">Estimated Arrival</span>
                      <span className="text-[#ff2d88] flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#ff2d88]/80 shrink-0" />
                        {formatTime(trip.arrivalTime)}
                      </span>
                    </div>
                  </div>

                  {/* Via stops preview */}
                  {trip.viaStops.length > 0 && (
                    <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850/60 rounded-xl p-3 text-[11px] font-semibold text-zinc-500 flex flex-wrap gap-x-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 self-center">Via:</span>
                      {trip.viaStops.map((stop, index) => (
                        <span key={index} className="flex items-center gap-1">
                          {stop}
                          {index < trip.viaStops.length - 1 && <span className="text-[9px] text-zinc-300">•</span>}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interactive Status Update Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850">
                    
                    {trip.status === 'BOARDING' && (
                      <button
                        disabled={loadingTripId === trip.id}
                        onClick={() => handleUpdateTripStatus(trip.id, 'DEPARTED')}
                        className="flex-1 min-w-[120px] px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow shadow-indigo-500/20 hover:shadow-indigo-500/35 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Depart Bus
                      </button>
                    )}

                    {(trip.status === 'DEPARTED' || trip.status === 'IN_TRANSIT') && (
                      <button
                        disabled={loadingTripId === trip.id}
                        onClick={() => handleUpdateTripStatus(trip.id, 'ARRIVED')}
                        className="flex-1 min-w-[120px] px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow shadow-emerald-500/20 hover:shadow-emerald-500/35 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Flag className="h-3.5 w-3.5" />
                        Arrived (Complete)
                      </button>
                    )}

                    <button
                      disabled={loadingTripId === trip.id}
                      onClick={() => handleUpdateTripStatus(trip.id, 'CANCELLED')}
                      className="px-4 py-2.5 border border-rose-200 dark:border-rose-950 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XOctagon className="h-3.5 w-3.5 shrink-0" />
                      Delay/Cancel
                    </button>

                  </div>

                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
