'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Bus, 
  Phone, 
  Mail, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Stop {
  stopName: string;
  arrivalOffsetMinutes: number;
  departureOffsetMinutes: number;
  sequence: number;
}

interface TripData {
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
  status: string;
  operatorName: string;
  viaStops: Stop[];
}

interface TrackingClientProps {
  tripData: TripData;
}

export default function TrackingClient({ tripData }: TrackingClientProps) {
  const [tripStatus, setTripStatus] = useState<string>(tripData.status);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [timeLeftString, setTimeLeftString] = useState<string>('');
  const socketRef = useRef<any>(null);

  // 1. WebSocket listener for live trip updates
  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.emit('join-trip', tripData.id);
    console.log(`[Socket] Joined trip room: ${tripData.id}`);

    socket.on('trip:status-updated', ({ status }: { status: string }) => {
      console.log(`[Socket] Received status update: ${status}`);
      setTripStatus(status);
      toast.info(`Trip status updated: ${status.replace('_', ' ')}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [tripData.id]);

  // 2. Journey progress calculation loop
  useEffect(() => {
    const updateProgress = () => {
      const depTime = new Date(tripData.departureTime).getTime();
      const arrTime = new Date(tripData.arrivalTime).getTime();
      const now = Date.now();

      const totalDuration = arrTime - depTime;
      const elapsed = now - depTime;
      const progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);

      setProgressPercent(Math.round(progress * 100));

      if (['BOARDING', 'SCHEDULED'].includes(tripStatus)) {
        setTimeLeftString('Not started');
        setProgressPercent(0);
      } else if (tripStatus === 'ARRIVED') {
        setTimeLeftString('Arrived at destination');
        setProgressPercent(100);
      } else {
        const msLeft = arrTime - now;
        if (msLeft <= 0) {
          setTimeLeftString('Arriving soon');
        } else {
          const hours = Math.floor(msLeft / (1000 * 60 * 60));
          const mins = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeftString(hours > 0 ? `${hours}h ${mins}m remaining` : `${mins} mins remaining`);
        }
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 15000); // update progress text every 15s
    return () => clearInterval(interval);
  }, [tripStatus, tripData]);

  // UI styling helpers
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ARRIVED':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'BOARDING':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse';
      case 'DEPARTED':
      case 'IN_TRANSIT':
        return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20';
      case 'SCHEDULED':
        return 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      default:
        return 'bg-zinc-150 text-zinc-650';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'SCHEDULED') return 'Scheduled';
    if (status === 'BOARDING') return 'Boarding Open';
    if (status === 'DEPARTED' || status === 'IN_TRANSIT') return 'In Transit';
    if (status === 'ARRIVED') return 'Arrived / Completed';
    if (status === 'CANCELLED') return 'Trip Cancelled';
    return status;
  };

  const getActiveStep = (status: string) => {
    if (status === 'SCHEDULED') return 0;
    if (status === 'BOARDING') return 1;
    if (status === 'DEPARTED' || status === 'IN_TRANSIT') return 2;
    if (status === 'ARRIVED') return 3;
    return -1;
  };

  const currentStep = getActiveStep(tripStatus);

  const formattedDate = new Date(tripData.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedDepTime = new Date(tripData.departureTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const formattedArrTime = new Date(tripData.arrivalTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100">
      
      {/* HEADER ROW */}
      <div className="flex items-center gap-3 mb-6 select-none">
        <Link 
          href="/customer/trips" 
          className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl hover:bg-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Manual Trip Tracking</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            Trip reference ID: {tripData.id.slice(-8).toUpperCase()} • {tripData.busNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PRIMARY JOURNEY DASHBOARD & STATUS (7 columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* CORE TRIP STATUS SUMMARY CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col gap-6">
            
            {/* Status Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-950/15 flex items-center justify-center shrink-0">
                  <Bus className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-zinc-800 dark:text-zinc-100">{tripData.operatorName}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">{tripData.busType}</span>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusBadgeStyle(tripStatus)}`}>
                {getStatusLabel(tripStatus)}
              </span>
            </div>

            {/* Source to Destination graphic display */}
            <div className="grid grid-cols-3 items-center justify-between gap-4 py-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Departure Stop</span>
                <span className="text-lg font-black mt-0.5 text-zinc-800 dark:text-zinc-100">{formattedDepTime}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-bold truncate">{tripData.source}</span>
              </div>

              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-[#ff7c52] font-black tracking-wide bg-[#ff7c52]/10 px-2 py-0.5 rounded-full select-none">
                  {timeLeftString}
                </span>
                <div className="flex items-center gap-1 mt-3 w-full">
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-zinc-200 to-[#ff7c52] dark:from-zinc-800" />
                  <ArrowRight className="h-4 w-4 text-[#ff2d88] shrink-0" />
                  <div className="h-0.5 flex-1 bg-gradient-to-l from-zinc-200 to-[#ff2d88] dark:from-zinc-800" />
                </div>
              </div>

              <div className="flex flex-col text-right">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Arrival Stop</span>
                <span className="text-lg font-black mt-0.5 text-zinc-800 dark:text-zinc-100">{formattedArrTime}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-bold truncate">{tripData.destination}</span>
              </div>
            </div>

            {/* State progress bar */}
            {['BOARDING', 'DEPARTED', 'IN_TRANSIT'].includes(tripStatus) && (
              <div className="flex flex-col gap-2 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-850">
                <div className="flex justify-between text-[11px] font-black text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    Journey Progress
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${progressPercent}%` }} 
                    className="h-full bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] rounded-full transition-all duration-1000"
                  />
                </div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold text-center mt-1">
                  Estimated based on normal journey duration
                </span>
              </div>
            )}
            
            {tripStatus === 'ARRIVED' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex flex-col items-center text-center gap-2">
                <span className="text-3xl">🎉</span>
                <h4 className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">Journey Finished Successfully</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold max-w-sm mt-0.5">
                  The bus operator has updated the trip status as arrived. Thank you for travelling with {tripData.operatorName}!
                </p>
              </div>
            )}
          </div>

          {/* VIA STOPS / ROUTE PROGRESS PANEL */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800 pb-3">Route Checkpoints &amp; Stops</h3>
            
            <div className="flex flex-col gap-3.5 py-1">
              {/* Departure */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{tripData.source}</span>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md font-bold uppercase">Source</span>
              </div>

              {/* Via Stops */}
              {tripData.viaStops.map((stop, index) => (
                <div key={index} className="flex items-center justify-between border-t border-dashed border-zinc-100 dark:border-zinc-800/60 pt-3">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{stop.stopName}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                    +{stop.arrivalOffsetMinutes} min
                  </span>
                </div>
              ))}

              {/* Destination */}
              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-3.5">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{tripData.destination}</span>
                </div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-md font-bold uppercase">Destination</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: VERTICAL PROGRESS TIMELINE TRACKER (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* STEPPER TRANSITION TIMELINE CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800 pb-3">Status Stepper</h3>
            
            <div className="flex flex-col relative mt-2 pl-3 select-none">
              {/* Stepper vertical line indicator */}
              <div className="absolute left-6.5 top-2.5 bottom-12 w-0.5 bg-zinc-100 dark:bg-zinc-800 z-0" />

              {/* Step 1: Scheduled */}
              <div className="flex items-start gap-4 mb-8 relative z-10">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center border font-black text-xs shrink-0 select-none ${
                  currentStep >= 0 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-400'
                }`}>
                  {currentStep > 0 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className={`text-xs font-black ${currentStep >= 0 ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}`}>Scheduled</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">Trip scheduled and validated</span>
                </div>
              </div>

              {/* Step 2: Boarding */}
              <div className="flex items-start gap-4 mb-8 relative z-10">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center border font-black text-xs shrink-0 select-none ${
                  currentStep >= 1 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-400'
                }`}>
                  {currentStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className={`text-xs font-black ${currentStep >= 1 ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}`}>Boarding Started</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">Bus is at source station; passengers are boarding</span>
                </div>
              </div>

              {/* Step 3: En Route */}
              <div className="flex items-start gap-4 mb-8 relative z-10">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center border font-black text-xs shrink-0 select-none ${
                  currentStep >= 2 
                    ? 'bg-[#ff2d88] border-[#ff2d88] text-white animate-pulse shadow-md shadow-[#ff2d88]/20' 
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-400'
                }`}>
                  {currentStep > 2 ? <CheckCircle2 className="h-4 w-4" /> : '3'}
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className={`text-xs font-black ${currentStep >= 2 ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}`}>In Transit</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">Bus departed source; en route to destination</span>
                </div>
              </div>

              {/* Step 4: Arrived */}
              <div className="flex items-start gap-4 relative z-10">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center border font-black text-xs shrink-0 select-none ${
                  currentStep >= 3 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-400'
                }`}>
                  '4'
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className={`text-xs font-black ${currentStep >= 3 ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}`}>Arrived</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">Bus arrived safely at destination</span>
                </div>
              </div>

            </div>
          </div>

          {/* DUMMY HELPLINE / SAFETY EMERGENCY CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
              Safety &amp; Help Desk
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal font-semibold">
              Need assistance or want to contact operator services? Please call operator helpline or submit query details.
            </p>
            <div className="flex flex-col gap-2.5 mt-1 select-all">
              <div className="flex items-center gap-2.5 text-xs">
                <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                <span className="font-extrabold">+91 98765 43210</span>
                <span className="text-[9px] text-zinc-400">(Operator)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                <span className="font-extrabold">support@royaltravels.com</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
