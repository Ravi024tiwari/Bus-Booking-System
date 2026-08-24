'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  MapPin, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Users, 
  Info, 
  Wifi, 
  BatteryCharging, 
  Star, 
  User, 
  ArrowRight, 
  Phone,
  Mail,
  ShieldAlert,
  Percent,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Stop {
  stopName: string;
  sequence: number;
  arrivalTime: string;
  offsetMinutes: number;
  fareFromPrev: number;
}

interface TripDetails {
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
  busCapacity: number;
  operatorName: string;
  operatorPhone: string;
  operatorEmail: string;
  stops: Stop[];
  amenities: string[];
  cancellationPolicy: Array<{ timeFrame: string; refundPercentage: string }>;
}

interface TripDetailsClientProps {
  tripDetails: TripDetails;
}

export default function TripDetailsClient({ tripDetails }: TripDetailsClientProps) {
  const router = useRouter();
  
  // Image gallery state
  const busImages = [
    '/images/bus-hero.jpg',
    '/images/bus1.jpg',
    '/images/bus2.jpg',
  ];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Time conversion helpers
  const formatTimeString = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  };

  const formatShortDate = (dateStr: string) => {
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

  // Helper to get duration
  const getTravelDuration = (depTime: string, arrTime: string) => {
    try {
      const start = new Date(depTime);
      const end = new Date(arrTime);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    } catch {
      return 'N/A';
    }
  };

  const getAmenityIcon = (name: string) => {
    const cleanName = name.toLowerCase();
    if (cleanName.includes('wifi') || cleanName.includes('internet')) {
      return <Wifi className="h-5 w-5 text-[#ff2d88]" />;
    }
    if (cleanName.includes('charge') || cleanName.includes('charging') || cleanName.includes('port')) {
      return <BatteryCharging className="h-5 w-5 text-[#ff2d88]" />;
    }
    if (cleanName.includes('support') || cleanName.includes('emergency') || cleanName.includes('safety')) {
      return <ShieldCheck className="h-5 w-5 text-[#ff2d88]" />;
    }
    return <AlertCircle className="h-5 w-5 text-[#ff2d88]" />;
  };

  const handleProceedToBook = () => {
    toast.info(`Proceeding to checkout seat selection for trip ID: ${tripDetails.id}`);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-1 sm:p-4 bg-zinc-50 dark:bg-zinc-950 min-h-screen text-zinc-800 dark:text-zinc-200">
      
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center gap-3 mb-6 select-none">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-xl cursor-pointer transition-colors shadow-sm"
        >
          <ChevronLeft className="h-5 w-5 text-zinc-500 hover:text-zinc-800 dark:hover:text-white" />
        </button>
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
          <Link href="/customer/dashboard" className="hover:text-zinc-600">Dashboard</Link>
          <span>/</span>
          <Link href="/customer/dashboard/book" className="hover:text-zinc-600">Booking Trips</Link>
          <span>/</span>
          <span className="text-zinc-600 dark:text-zinc-300">Trip Details</span>
        </div>
      </div>

      {/* Main Grid split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Details (spans 8 columns on desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* A. TITLE & ROUTE SUMMARY BANNER */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col sm:flex-row justify-between sm:items-center gap-5">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                  {tripDetails.source}
                </h1>
                <ArrowRight className="h-5 w-5 text-[#ff2d88] shrink-0" />
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                  {tripDetails.destination}
                </h1>
              </div>
              
              <div className="flex items-center gap-4 mt-3 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatShortDate(tripDetails.date)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {getTravelDuration(tripDetails.departureTime, tripDetails.arrivalTime)} Travel
                </span>
              </div>
            </div>

            <div className="flex flex-col select-none sm:text-right shrink-0">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest leading-none">Starting From</span>
              <div className="flex items-baseline sm:justify-end gap-0.5 mt-2 leading-none">
                <span className="text-sm font-black text-zinc-450">₹</span>
                <span className="text-2xl font-black text-zinc-800 dark:text-zinc-100">
                  {tripDetails.fare}
                </span>
              </div>
            </div>
          </div>

          {/* B. DYNAMIC IMAGE GALLERY */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[32px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col gap-4">
            {/* Active Display */}
            <div className="relative h-60 sm:h-80 md:h-[400px] w-full rounded-2xl overflow-hidden border border-zinc-150 dark:border-zinc-850 shadow-sm select-none">
              <img 
                src={busImages[activeImageIndex]} 
                alt="Bus showcase"
                className="h-full w-full object-cover transition-all duration-300"
              />
              
              {/* Bus Details Badge Overlay */}
              <div className="absolute bottom-4 left-4 p-3 bg-zinc-950/70 border border-white/10 backdrop-blur-md text-white rounded-2xl flex flex-col">
                <span className="text-xs font-black tracking-wide">{tripDetails.operatorName}</span>
                <span className="text-[10px] text-zinc-350 font-bold mt-1 uppercase tracking-widest leading-none">{tripDetails.busType}</span>
              </div>
            </div>

            {/* Thumbnails Navigation */}
            <div className="flex items-center gap-3">
              {busImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-16 w-24 sm:h-20 sm:w-32 rounded-xl overflow-hidden cursor-pointer border-2 transition-all shadow-sm shrink-0 select-none ${
                    activeImageIndex === idx 
                      ? 'border-[#ff2d88] scale-[1.03] shadow-md shadow-[#ff2d88]/10' 
                      : 'border-transparent hover:border-zinc-300'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* C. JOURNEY SCHEDULE TIMELINE */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col gap-6">
            <div>
              <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">Route Stops & Timings</h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold mt-1">
                Detailed timeline of departure, intermediate stops, and arrival
              </p>
            </div>

            {/* Stops Timeline vertical tree */}
            <div className="relative pl-6 flex flex-col gap-6 ml-3 select-none">
              
              {/* Vertical line connection stop nodes */}
              <div className="absolute left-[7.5px] top-2 bottom-2 w-[3px] bg-gradient-to-b from-[#ff7c52] to-[#ff2d88] dark:opacity-80 rounded-full" />

              {tripDetails.stops.map((stop: Stop, idx: number) => {
                const isFirst = idx === 0;
                const isLast = idx === tripDetails.stops.length - 1;

                return (
                  <div key={idx} className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Node Sequence Indicator */}
                    <div className={`absolute left-[-24px] top-1.5 h-4 w-4 rounded-full border-2 bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm z-10 ${
                      isFirst 
                        ? 'border-emerald-500 bg-emerald-500' 
                        : (isLast ? 'border-[#ff2d88] bg-[#ff2d88]' : 'border-zinc-350 bg-white')
                    }`}>
                      {(isFirst || isLast) && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>

                    {/* Left stop details */}
                    <div className="flex flex-col">
                      <span className="font-extrabold text-sm sm:text-base text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                        {stop.stopName}
                        {isFirst && <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-black tracking-widest uppercase">Start</span>}
                        {isLast && <span className="text-[9px] px-2 py-0.5 rounded-full bg-pink-500/10 text-[#ff2d88] font-black tracking-widest uppercase">End</span>}
                      </span>
                      {!isFirst && (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-1">
                          +{stop.offsetMinutes} mins offset from origin
                        </span>
                      )}
                    </div>

                    {/* Right time & fare offset details */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 shrink-0 sm:text-right">
                      <span className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-zinc-450" />
                        {formatTimeString(stop.arrivalTime)}
                      </span>
                      {!isFirst && stop.fareFromPrev > 0 && (
                        <span className="text-[10px] font-bold text-zinc-450">
                          +₹{stop.fareFromPrev} segment fare
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}

            </div>
          </div>

          {/* D. AMENITIES GRID */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col gap-5">
            <div>
              <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">Bus Amenities</h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold mt-1">
                Facilities available onboard during this journey
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {tripDetails.amenities.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-3.5 border border-zinc-150/40 dark:border-zinc-800/80 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40"
                >
                  <div className="h-9 w-9 rounded-xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100/50 dark:border-pink-950/10 flex items-center justify-center shrink-0">
                    {getAmenityIcon(item)}
                  </div>
                  <span className="text-xs font-black text-zinc-850 dark:text-zinc-200">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* E. CANCELLATION POLICY CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col gap-5">
            <div>
              <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">Cancellation Policy</h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold mt-1">
                Refund timelines relative to scheduled departure time
              </p>
            </div>

            <div className="flex flex-col border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-2 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                <span>Time Frame</span>
                <span className="text-right">Refund %</span>
              </div>
              {/* Policy list */}
              {tripDetails.cancellationPolicy.map((policy, idx) => (
                <div 
                  key={idx}
                  className="grid grid-cols-2 px-4 py-3 border-b last:border-0 border-zinc-150 dark:border-zinc-850 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  <span>{policy.timeFrame}</span>
                  <span className="text-right font-black text-emerald-500">{policy.refundPercentage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* F. RATINGS & REVIEWS */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">Passenger Reviews</h2>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold mt-1">
                  Overall customer ratings and passenger feedback
                </p>
              </div>
              {/* Average Rating summary block */}
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 font-black text-sm select-none">
                <Star className="h-4.5 w-4.5 fill-amber-500 shrink-0" />
                <span>4.6</span>
              </div>
            </div>

            {/* Review Cards stack */}
            <div className="flex flex-col gap-4.5">
              {[
                { name: 'John Doe', date: '21 May 2026', rating: 5, comment: 'Exceptional trip experience. The bus operator kept it clean, punctuality was spot on, and seat padding was very comfortable. Highly recommend!' },
                { name: 'Jane Smith', date: '19 May 2026', rating: 4, comment: 'AC was cooling very well. The intermediate stop was at a very hygienic highway plaza. Good journey overall.' }
              ].map((rev, idx) => (
                <div 
                  key={idx}
                  className="flex flex-col gap-3 p-4 border border-zinc-150/40 dark:border-zinc-800/80 rounded-2xl bg-zinc-50/30 dark:bg-zinc-900/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8.5 w-8.5 rounded-full bg-zinc-200 dark:bg-zinc-850 flex items-center justify-center shrink-0">
                        <User className="h-4.5 w-4.5 text-zinc-450" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-zinc-850 dark:text-zinc-200 leading-none">{rev.name}</span>
                        <span className="text-[9px] text-zinc-400 font-bold mt-1 leading-none">{rev.date}</span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-650 dark:text-zinc-400 font-medium leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Sticky Booking Card (spans 4 columns on desktop) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 flex flex-col gap-6">
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-250/60 dark:border-zinc-800/80 rounded-[32px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.3)] flex flex-col gap-6">
            
            {/* Header: Starting Pricing */}
            <div>
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-extrabold">Price Summary</span>
              <div className="flex items-baseline gap-0.5 mt-2">
                <span className="text-xs font-black text-zinc-450">₹</span>
                <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                  {tripDetails.fare}
                </span>
                <span className="text-[11px] text-zinc-400 font-bold ml-1">/ passenger</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-150/50 dark:bg-zinc-800/50 w-full" />

            {/* Travel Summary Highlights */}
            <div className="flex flex-col gap-3.5">
              
              {/* Route segment */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-450 dark:text-zinc-500">Journey Segment</span>
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                  {tripDetails.source} → {tripDetails.destination}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-450 dark:text-zinc-500">Departure Date</span>
                <span className="font-extrabold text-zinc-850 dark:text-zinc-150">
                  {formatShortDate(tripDetails.date)}
                </span>
              </div>

              {/* Time */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-450 dark:text-zinc-500">Departure Time</span>
                <span className="font-black text-[#ff2d88]">
                  {formatTimeString(tripDetails.departureTime)}
                </span>
              </div>

              {/* Operator */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-450 dark:text-zinc-500">Bus Operator</span>
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                  {tripDetails.operatorName}
                </span>
              </div>

              {/* Type */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-450 dark:text-zinc-500">Bus Type</span>
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                  {tripDetails.busType}
                </span>
              </div>

            </div>

            {/* Proceed to Seat Action button */}
            <button
              onClick={handleProceedToBook}
              className="w-full py-3.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:opacity-95 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-[#ff2d88]/20 transform active:scale-[0.98] transition-all cursor-pointer outline-none text-center"
            >
              Proceed to Select Seat
            </button>

            {/* Quick Guarantees / Badges */}
            <div className="flex flex-col gap-2.5 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150/40 dark:border-zinc-850/80">
              <div className="flex items-center gap-2 text-[10px] font-extrabold text-zinc-500">
                <CheckCircle className="h-4 w-4 text-[#ff2d88] shrink-0" />
                <span>Verified Bus Schedule & Operator</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-extrabold text-zinc-500">
                <CheckCircle className="h-4 w-4 text-[#ff2d88] shrink-0" />
                <span>Secure Payments Encrypted</span>
              </div>
            </div>

          </div>

          {/* Contact operator card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-250/60 dark:border-zinc-800/80 rounded-[32px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Operator Support</h3>
            <div className="flex flex-col gap-3">
              <a 
                href={`tel:${tripDetails.operatorPhone}`}
                className="flex items-center gap-3 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-[#ff2d88] transition-colors"
              >
                <Phone className="h-4 w-4 text-zinc-450" />
                <span>{tripDetails.operatorPhone}</span>
              </a>
              <a 
                href={`mailto:${tripDetails.operatorEmail}`}
                className="flex items-center gap-3 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-[#ff2d88] transition-colors"
              >
                <Mail className="h-4 w-4 text-zinc-450" />
                <span className="truncate">{tripDetails.operatorEmail}</span>
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
