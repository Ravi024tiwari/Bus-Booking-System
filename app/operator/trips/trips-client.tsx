'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Bus, 
  Plus, 
  Trash2, 
  MapPin, 
  Clock, 
  Search, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Layers, 
  Filter, 
  RotateCcw,
  CheckCircle,
  MoreVertical,
  HelpCircle,
  User,
  ArrowRight,
  ChevronRight,
  Info,
  DollarSign,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BusHeroBanner from '../buses/bus-hero-banner';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Types
interface BusItem {
  id: string;
  busNumber: string;
  type: string;
  capacity: number;
}

interface RouteItem {
  id: string;
  source: string;
  destination: string;
  totalDistance: number;
  stops: Array<{
    stopName: string;
    arrivalOffsetMinutes: number;
    departureOffsetMinutes: number;
    sequence: number;
    fareFromPreviousStop: number;
  }>;
}

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
  offerPercentage?: number;
  offerLimit?: number;
  offerBookedCount?: number;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'IN_TRANSIT' | 'ARRIVED' | 'CANCELLED';
  busCapacity: number;
  bookedSeatsCount: number;
  averageRating?: number;
  totalReviews?: number;
  viaStops: string[];
  createdAt: string;
}

interface TripsClientProps {
  initialTrips: TripItem[];
  buses: BusItem[];
  routes: RouteItem[];
}

export default function TripsClient({ initialTrips, buses, routes }: TripsClientProps) {
  const [trips, setTrips] = useState<TripItem[]>(initialTrips);
  const [filteredTrips, setFilteredTrips] = useState<TripItem[]>(initialTrips);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // Active Tab: today, future, history
  const [activeTab, setActiveTab] = useState<'today' | 'future' | 'history'>('today');

  // Filter States
  const [filterDate, setFilterDate] = useState('');
  const [filterBusNumber, setFilterBusNumber] = useState('All');
  const [filterRouteId, setFilterRouteId] = useState('All');
  const [filterFromCity, setFilterFromCity] = useState('All');
  const [filterToCity, setFilterToCity] = useState('All');

  // Sort State
  const [sortBy, setSortBy] = useState('departure');

  // Add Trip Form States
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedBusId, setSelectedBusId] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [departureTime, setDepartureTime] = useState('08:00 AM');
  const [customFare, setCustomFare] = useState<number | ''>('');
  const [offerPercentage, setOfferPercentage] = useState<number | ''>('');
  const [offerLimit, setOfferLimit] = useState<number | ''>('');

  // Dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Extract distinct Cities for filter dropdowns
  const fromCities = Array.from(new Set(routes.map(r => r.source))).sort();
  const toCities = Array.from(new Set(routes.map(r => r.destination))).sort();

  // Local helper: get local date string YYYY-MM-DD
  const getLocalTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalTodayString();

  // Run filters
  const applyFilters = () => {
    let result = [...trips];

    // Filter by Date
    if (filterDate) {
      result = result.filter(t => t.date === filterDate);
    }

    // Filter by Bus Number
    if (filterBusNumber !== 'All') {
      result = result.filter(t => t.busNumber === filterBusNumber);
    }

    // Filter by Route
    if (filterRouteId !== 'All') {
      result = result.filter(t => t.routeId === filterRouteId);
    }

    // Filter by From City
    if (filterFromCity !== 'All') {
      result = result.filter(t => t.source.toLowerCase() === filterFromCity.toLowerCase());
    }

    // Filter by To City
    if (filterToCity !== 'All') {
      result = result.filter(t => t.destination.toLowerCase() === filterToCity.toLowerCase());
    }

    // Tab-level splits
    const now = new Date();
    if (activeTab === 'today') {
      result = result.filter(t => t.date === todayStr);
    } else if (activeTab === 'future') {
      result = result.filter(t => t.date > todayStr);
    } else if (activeTab === 'history') {
      result = result.filter(t => t.date < todayStr);
    }

    // Sorting
    if (sortBy === 'departure') {
      result.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
    } else if (sortBy === 'fareAsc') {
      result.sort((a, b) => a.fare - b.fare);
    } else if (sortBy === 'fareDesc') {
      result.sort((a, b) => b.fare - a.fare);
    } else if (sortBy === 'occupancy') {
      result.sort((a, b) => (b.bookedSeatsCount / b.busCapacity) - (a.bookedSeatsCount / a.busCapacity));
    }

    setFilteredTrips(result);
  };

  useEffect(() => {
    applyFilters();
  }, [trips, activeTab, sortBy]);

  const handleResetFilters = () => {
    setFilterDate('');
    setFilterBusNumber('All');
    setFilterRouteId('All');
    setFilterFromCity('All');
    setFilterToCity('All');
    // reset list to unfiltered tab state
    let result = [...trips];
    if (activeTab === 'today') {
      result = result.filter(t => t.date === todayStr);
    } else if (activeTab === 'future') {
      result = result.filter(t => t.date > todayStr);
    } else if (activeTab === 'history') {
      result = result.filter(t => t.date < todayStr);
    }
    setFilteredTrips(result);
    toast.success('Filters reset successfully');
  };

  // Time conversion helpers
  function timeStringToMinutes(timeStr: string): number {
    if (!timeStr || timeStr === '-' || timeStr.trim() === '') return -1;
    const cleanStr = timeStr.trim().toUpperCase();
    const match12 = cleanStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = parseInt(match12[2], 10);
      const ampm = match12[3];
      if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return -1;
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
    const match24 = cleanStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const hours = parseInt(match24[1], 10);
      const minutes = parseInt(match24[2], 10);
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        return hours * 60 + minutes;
      }
    }
    return -1;
  }

  // Live dynamic calculations inside form
  const activeRoute = routes.find(r => r.id === selectedRouteId);
  const routeStopsCount = activeRoute?.stops.length || 0;
  
  // Calculate total route base price sum
  const defaultRouteFare = activeRoute?.stops.reduce((sum, s) => sum + s.fareFromPreviousStop, 0) || 0;

  // Set default fare when route is changed
  useEffect(() => {
    if (defaultRouteFare > 0) {
      setCustomFare(defaultRouteFare);
    }
  }, [selectedRouteId, defaultRouteFare]);

  // Compute live arrival time
  const getCalculatedArrivalString = () => {
    if (!activeRoute || !departureTime || !tripDate) return '--:--';
    const depMins = timeStringToMinutes(departureTime);
    if (depMins === -1) return '--:--';

    const lastStop = activeRoute.stops[activeRoute.stops.length - 1];
    if (!lastStop) return '--:--';

    const totalArrMins = depMins + lastStop.arrivalOffsetMinutes;
    
    // Parse to local time representation
    const hours = Math.floor(totalArrMins / 60) % 24;
    const minutes = totalArrMins % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const dispHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${String(dispHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  // Add Trip submit
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRouteId || !selectedBusId || !tripDate || !departureTime || customFare === '') {
      toast.error('Please enter all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        busId: selectedBusId,
        routeId: selectedRouteId,
        date: tripDate,
        departureTime,
        fare: Number(customFare),
        offerPercentage: offerPercentage === '' ? 0 : Number(offerPercentage),
        offerLimit: offerLimit === '' ? 0 : Number(offerLimit)
      };

      const response = await axios.post('/api/trips', payload);

      if (response.data?.success && response.data?.data) {
        toast.success(response.data.message || 'Trip scheduled successfully!');
        
        // Add new trip to local list
        const saved = response.data.data;
        const bus = buses.find(b => b.id === selectedBusId);
        const routeObj = routes.find(r => r.id === selectedRouteId);

        const newTripItem: TripItem = {
          id: saved._id,
          busId: saved.busId,
          routeId: saved.routeId,
          busNumber: saved.busNumber,
          busType: saved.busType,
          source: saved.source,
          destination: saved.destination,
          date: saved.date,
          departureTime: new Date(saved.departureTime).toISOString(),
          arrivalTime: new Date(saved.arrivalTime).toISOString(),
          fare: saved.fare,
          offerPercentage: saved.offerPercentage || 0,
          offerLimit: saved.offerLimit || 0,
          offerBookedCount: saved.offerBookedCount || 0,
          status: saved.status || 'SCHEDULED',
          createdAt: new Date(saved.createdAt).toISOString(),
          busCapacity: bus ? bus.capacity : 40,
          bookedSeatsCount: 0,
          viaStops: routeObj?.stops ? routeObj.stops.slice(1, routeObj.stops.length - 1).map(s => s.stopName) : []
        };

        setTrips(prev => [newTripItem, ...prev]);
        setIsAdding(false);
        
        // Reset state
        setSelectedRouteId('');
        setSelectedBusId('');
        setTripDate('');
        setDepartureTime('08:00 AM');
        setOfferPercentage('');
        setOfferLimit('');
      }
    } catch (err: any) {
      console.error('[Add Trip Form Error]:', err);
      toast.error(err.response?.data?.message || 'Failed to schedule trip. Check for timing overlap.');
    } finally {
      setLoading(false);
    }
  };

  // Status Change handler
  const handleUpdateStatus = async (tripId: string, newStatus: string) => {
    try {
      const response = await axios.patch(`/api/trips/${tripId}`, { status: newStatus });
      if (response.data?.success) {
        toast.success(`Trip status updated to ${newStatus}`);
        setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: newStatus as any } : t));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update trip status.');
    } finally {
      setActiveMenuId(null);
    }
  };

  // Helper formatting values
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTimeString = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get status badge color styling matching mockup
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ARRIVED':
      case 'On Time':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400';
      case 'BOARDING':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400';
      case 'DEPARTED':
      case 'IN_TRANSIT':
      case 'En Route':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400';
      case 'SCHEDULED':
        return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400';
      case 'CANCELLED':
      case 'Delayed':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400';
      default:
        return 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'SCHEDULED') return 'Scheduled';
    if (status === 'BOARDING') return 'Boarding';
    if (status === 'DEPARTED' || status === 'IN_TRANSIT') return 'En Route';
    if (status === 'ARRIVED') return 'On Time';
    if (status === 'CANCELLED') return 'Delayed';
    return status;
  };

  return (
    <div className="flex flex-col gap-6 select-none">
      
      {/* 1. SCENIC HEADER BANNER */}
      <BusHeroBanner 
        title="Manage Your Trips"
        description="Schedule routes, manage intermediate boarding points, set dynamic pricing discounts, and monitor real-time passenger capacity."
        subBadgeText="Trip Management Console"
        backgroundImage="/images/trip_bg.jpeg"
        bgPosition="center 30%"
        icon={<CalendarIcon className="h-3 w-3 text-[#ff5666] animate-pulse" />}
        actions={
          <button
            onClick={() => setIsAdding(true)}
            className="px-5 py-3 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:from-[#ff8e6b] hover:to-[#ff459b] hover:shadow-lg hover:shadow-[#ff2d88]/20 transition-all duration-200 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-sm shrink-0 uppercase tracking-wider"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Add New Trip
          </button>
        }
      />

      {/* 2. FILTERING CARD CONTROL BAR */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] mb-8 flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Date selection filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Date</span>
            <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-zinc-400 shrink-0" />
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none dark:color-scheme-dark"
              />
            </div>
          </div>

          {/* Bus number dropdown */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Bus Number</span>
            <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
              <Bus className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={filterBusNumber}
                onChange={(e) => setFilterBusNumber(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="All">All Buses</option>
                {buses.map(b => (
                  <option key={b.id} value={b.busNumber}>{b.busNumber}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Route dropdown */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Route</span>
            <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
              <Layers className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={filterRouteId}
                onChange={(e) => setFilterRouteId(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="All">All Routes</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.source} ➔ {r.destination}</option>
                ))}
              </select>
            </div>
          </div>

          {/* From City dropdown */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">From City</span>
            <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={filterFromCity}
                onChange={(e) => setFilterFromCity(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="All">All Cities</option>
                {fromCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* To City dropdown */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">To City</span>
            <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={filterToCity}
                onChange={(e) => setFilterToCity(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="All">All Cities</option>
                {toCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Filter actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer outline-none transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <button
            onClick={applyFilters}
            className="px-5 py-2 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:opacity-95 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer outline-none transition-all shadow-md shadow-[#ff2d88]/25"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>
      </div>

      {/* 3. TABS SELECTORS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 select-none">
        
        {/* Today / Future / History Tab options */}
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'today' 
                ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white shadow-md shadow-[#ff2d88]/15' 
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Today Trips
          </button>
          <button
            onClick={() => setActiveTab('future')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'future' 
                ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white shadow-md shadow-[#ff2d88]/15' 
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Future Trips
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white shadow-md shadow-[#ff2d88]/15' 
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            History
          </button>
        </div>

        {/* Sorting options */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-extrabold">
            Showing {filteredTrips.length} trips
          </span>
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-0 p-0 text-xs font-extrabold focus:outline-none cursor-pointer text-zinc-500 dark:text-zinc-400"
            >
              <option value="departure">Sort by: Departure Time</option>
              <option value="fareAsc">Sort by: Fare (Low to High)</option>
              <option value="fareDesc">Sort by: Fare (High to Low)</option>
              <option value="occupancy">Sort by: Booking Occupancy</option>
            </select>
          </div>
        </div>

      </div>

      {/* 4. TRIP CARDS GRID (Inspired by Travel Package Cards) */}
      <div>
        <AnimatePresence mode="popLayout">
          {filteredTrips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-16 flex flex-col items-center justify-center text-center border border-zinc-200/60 dark:border-zinc-800 shadow-xs"
            >
              <CalendarIcon className="h-12 w-12 text-zinc-300 dark:text-zinc-700 animate-pulse" />
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mt-4">No Scheduled Trips</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-1 max-w-[280px]">
                No trips match your search parameters on this tab. Try scheduling a new trip or clearing filters.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredTrips.map((trip, idx) => (
                <motion.div
                  layout
                  key={trip.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <Card className="border border-zinc-200/80 dark:border-zinc-800 rounded-[1.75rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between p-3 sm:p-3.5 gap-3 group relative overflow-visible bg-white dark:bg-zinc-900">
                    
                    {/* 1. TOP COVER PHOTO WITH ROUNDED CORNERS & OVERLAYS */}
                    <div className="relative h-38 sm:h-42 w-full rounded-2xl overflow-hidden select-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-800/80 shadow-xs">
                      <img 
                        src={idx % 2 === 0 ? '/images/bus1.jpg' : '/images/bus2.jpg'} 
                        alt="Bus route preview" 
                        className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                      />
                      {/* Gradient overlay for text contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35 rounded-2xl" />

                      {/* Status Badge overlay (top-left) */}
                      <div className="absolute top-2.5 left-2.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase backdrop-blur-md border border-white/20 shadow-xs ${getStatusBadgeStyle(trip.status)}`}>
                          {getStatusLabel(trip.status)}
                        </span>
                      </div>

                      {/* Verified Rating Badge overlay (top-right) */}
                      <div className="absolute top-2.5 right-2.5">
                        {trip.averageRating && trip.averageRating > 0 ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-amber-400/40 text-amber-400 font-black text-[10px] shadow-xs">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400 drop-shadow-xs" />
                            <span>{trip.averageRating.toFixed(1)}</span>
                            <span className="text-[9px] text-zinc-300 font-medium">({trip.totalReviews || 1})</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-zinc-300 font-medium text-[9px]">
                            <Star className="h-2.5 w-2.5 text-zinc-400" />
                            <span>New</span>
                          </div>
                        )}
                      </div>

                      {/* Departure Timing & Date (bottom-left) */}
                      <div className="absolute bottom-2.5 left-2.5 flex flex-col text-white">
                        <span className="text-xs sm:text-sm font-black tracking-tight drop-shadow-sm flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#ff2d88]" />
                          {formatTimeString(trip.departureTime)}
                        </span>
                        <span className="text-[10px] text-zinc-200 font-semibold drop-shadow-sm">
                          {formatDateString(trip.date)}
                        </span>
                      </div>

                      {/* Discount offer tag if applicable (bottom-right) */}
                      {trip.offerPercentage && trip.offerPercentage > 0 ? (
                        <div className="absolute bottom-2.5 right-2.5">
                          <span className="px-2 py-0.5 bg-rose-500 text-white rounded-lg text-[9px] font-black tracking-wider uppercase shadow-xs">
                            {trip.offerPercentage}% Off
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* 2. CARD CONTENT BODY */}
                    <div className="flex flex-col gap-2.5 px-0.5">
                      
                      {/* Route Header */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white">
                          <span className="font-extrabold text-xs sm:text-sm truncate max-w-[120px]" title={trip.source}>
                            {trip.source}
                          </span>
                          <ArrowRight className="h-3 w-3 text-zinc-400 shrink-0" />
                          <span className="font-extrabold text-xs sm:text-sm truncate max-w-[120px]" title={trip.destination}>
                            {trip.destination}
                          </span>
                        </div>
                        {trip.viaStops && trip.viaStops.length > 0 && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium truncate">
                            Via: {trip.viaStops.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Bus info & Seats meta pills */}
                      <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-2 text-xs select-none">
                        {/* Vehicle details */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="h-6 w-6 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-500">
                            <Bus className="h-3 w-3" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate leading-none">{trip.busNumber}</span>
                            <span className="text-[8px] text-zinc-400 truncate mt-0.5 leading-none">{trip.busType}</span>
                          </div>
                        </div>

                        {/* Occupancy */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="h-6 w-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-500">
                            <Layers className="h-3 w-3" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate leading-none">{trip.bookedSeatsCount}/{trip.busCapacity}</span>
                            <span className="text-[8px] text-zinc-400 truncate mt-0.5 leading-none">Seats Booked</span>
                          </div>
                        </div>
                      </div>

                      {/* 3. CARD BOTTOM ROW: FARE & ACTION BUTTON */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/60 relative">
                        {/* Price Display */}
                        <div className="flex flex-col">
                          <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider leading-none">Fare</span>
                          <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-white mt-0.5 leading-none">
                            ₹{trip.fare}
                          </span>
                        </div>

                        {/* Action Dropdown Trigger Button */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === trip.id ? null : trip.id);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-[11px] rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                          >
                            <span>Manage</span>
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {/* Dropdown status update popup */}
                          {activeMenuId === trip.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 bottom-full mb-2 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl rounded-2xl p-2 w-[165px] flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <span className="text-[9px] uppercase font-black text-zinc-400 px-2 py-1">Update Status</span>
                                
                                {['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED'].map((st) => (
                                  <button
                                    key={st}
                                    onClick={() => handleUpdateStatus(trip.id, st)}
                                    className="w-full text-left px-2 py-1.5 text-[11px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer text-zinc-700 dark:text-zinc-300"
                                  >
                                    {st === 'CANCELLED' ? 'Delayed / Cancel' : getStatusLabel(st)}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                    </div>

                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. ADD TRIP MODAL DRAWER SLIDEOVER */}
      <AnimatePresence>
        {isAdding && (
          <>
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            {/* Modal drawer container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="fixed inset-4 sm:inset-auto sm:right-6 sm:top-6 sm:bottom-6 w-full max-w-[500px] bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-y-auto z-50"
            >
              <div>
                {/* Title */}
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-4 mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white leading-none">
                      Schedule Trip
                    </h2>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-1.5">
                      Choose route and date to schedule a new bus run.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                  >
                    <Plus className="h-5 w-5 rotate-45 text-zinc-400" />
                  </button>
                </div>

                {/* Form fields */}
                <form onSubmit={handleCreateTrip} className="flex flex-col gap-5">
                  
                  {/* Select Route */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                      Select Route <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
                      <MapPin className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                      <select
                        required
                        value={selectedRouteId}
                        onChange={(e) => setSelectedRouteId(e.target.value)}
                        className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="">Select a Route template</option>
                        {routes.map(r => (
                          <option key={r.id} value={r.id}>{r.source} ➔ {r.destination} ({r.totalDistance} km)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Select Bus */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                      Select Bus <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
                      <Bus className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                      <select
                        required
                        value={selectedBusId}
                        onChange={(e) => setSelectedBusId(e.target.value)}
                        className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="">Select registered bus</option>
                        {buses.map(b => (
                          <option key={b.id} value={b.id}>{b.busNumber} — {b.type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Run Date picker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                      Run Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
                      <CalendarIcon className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                      <input 
                        type="date"
                        required
                        min={todayStr}
                        value={tripDate}
                        onChange={(e) => setTripDate(e.target.value)}
                        className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none dark:color-scheme-dark"
                      />
                    </div>
                  </div>

                  {/* Departure time input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                      Departure Time <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                      <input 
                        type="text"
                        required
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        placeholder="08:00 AM"
                        className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Custom base fare */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                      Base Fare (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
                      <span className="text-zinc-400 font-extrabold text-xs">₹</span>
                      <input 
                        type="number"
                        required
                        value={customFare}
                        onChange={(e) => setCustomFare(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Price for full route"
                        className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Offer Fields Group (Two columns) */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Offer Percentage */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                        Offer Discount (%)
                      </label>
                      <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
                        <span className="text-zinc-400 font-extrabold text-xs">%</span>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={offerPercentage}
                          onChange={(e) => setOfferPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 15"
                          className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Offer Limit (First X passengers) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                        For First X Persons
                      </label>
                      <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl px-3 py-2 flex items-center gap-2">
                        <span className="text-zinc-400 font-extrabold text-xs">Pax</span>
                        <input 
                          type="number"
                          min="0"
                          value={offerLimit}
                          onChange={(e) => setOfferLimit(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 5"
                          className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live calculated arrival block */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850/60 rounded-2xl p-4 flex items-center justify-between select-none">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-black text-zinc-450 text-zinc-400">Estimated Arrival</span>
                      <span className="text-sm font-black text-[#ff2d88] mt-0.5">{getCalculatedArrivalString()}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] uppercase font-black text-zinc-450 text-zinc-400">Total Stops</span>
                      <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 mt-0.5">{routeStopsCount} stops</span>
                    </div>
                  </div>

                  {/* Quick timeline display */}
                  {activeRoute && activeRoute.stops.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Visual Route Preview</span>
                      <div className="border border-zinc-200/50 dark:border-zinc-850 rounded-2xl p-4 flex flex-col gap-2 bg-zinc-50/30">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-zinc-900 dark:text-white">{activeRoute.source}</span>
                          <span className="text-zinc-400 font-black">Start</span>
                        </div>
                        {activeRoute.stops.slice(1, activeRoute.stops.length - 1).map((s, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between text-xs font-semibold pl-2 border-l border-indigo-200 dark:border-indigo-900">
                            <span className="text-zinc-500 dark:text-zinc-400">{s.stopName}</span>
                            <span className="text-[10px] text-indigo-500 font-bold">+{s.arrivalOffsetMinutes}m</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-zinc-100 dark:border-zinc-850">
                          <span className="text-zinc-900 dark:text-white">{activeRoute.destination}</span>
                          <span className="text-[#ff2d88] font-black">{getCalculatedArrivalString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </form>
              </div>

              {/* Submit Buttons */}
              <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-3">
                <button
                  onClick={() => setIsAdding(false)}
                  className="w-1/2 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-250 font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTrip}
                  disabled={loading}
                  className="w-1/2 py-3 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:opacity-95 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-[#ff2d88]/20 transition-all cursor-pointer outline-none disabled:opacity-50"
                >
                  {loading ? 'Scheduling...' : 'Schedule Run'}
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
