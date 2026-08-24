'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bus as BusIcon, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon, 
  Filter, 
  RotateCcw,
  LayoutGrid,
  List,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Percent,
  CheckCircle,
  HelpCircle,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import TripCard from '@/components/customer/TripCard';

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
}

interface BookTripsClientProps {
  initialTrips: TripItem[];
  sources: string[];
  destinations: string[];
  operators: string[];
}

export default function BookTripsClient({ 
  initialTrips, 
  sources, 
  destinations, 
  operators 
}: BookTripsClientProps) {
  const router = useRouter();
  const [trips] = useState<TripItem[]>(initialTrips);
  const [filteredTrips, setFilteredTrips] = useState<TripItem[]>(initialTrips);

  // Layout View Mode (List vs Grid)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Filter States
  const [filterSource, setFilterSource] = useState('All');
  const [filterDestination, setFilterDestination] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [filterOperator, setFilterOperator] = useState('All');
  const [filterTime, setFilterTime] = useState('All');

  // Sort State
  const [sortBy, setSortBy] = useState('departure');

  // Tab State: All, Today, Upcoming
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming'>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Helper: get today's YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayString();

  // Apply filters
  const applyFilters = () => {
    let result = [...trips];

    // Source Filter
    if (filterSource !== 'All') {
      result = result.filter(t => t.source.toLowerCase() === filterSource.toLowerCase());
    }

    // Destination Filter
    if (filterDestination !== 'All') {
      result = result.filter(t => t.destination.toLowerCase() === filterDestination.toLowerCase());
    }

    // Date Filter
    if (filterDate) {
      result = result.filter(t => t.date === filterDate);
    }

    // Operator Filter
    if (filterOperator !== 'All') {
      result = result.filter(t => t.operatorName === filterOperator);
    }

    // Time of Day Filter
    if (filterTime !== 'All') {
      result = result.filter(t => {
        const depTime = new Date(t.departureTime);
        const hours = depTime.getHours();
        if (filterTime === 'morning') return hours >= 6 && hours < 12;
        if (filterTime === 'afternoon') return hours >= 12 && hours < 18;
        if (filterTime === 'evening') return hours >= 18 && hours < 23;
        if (filterTime === 'night') return hours >= 23 || hours < 6;
        return true;
      });
    }

    // Tab Filters
    if (activeTab === 'today') {
      result = result.filter(t => t.date === todayStr);
    } else if (activeTab === 'upcoming') {
      result = result.filter(t => t.date > todayStr);
    }

    // Sort Logic
    if (sortBy === 'departure') {
      result.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
    } else if (sortBy === 'fareAsc') {
      result.sort((a, b) => a.fare - b.fare);
    } else if (sortBy === 'fareDesc') {
      result.sort((a, b) => b.fare - a.fare);
    } else if (sortBy === 'availability') {
      result.sort((a, b) => (b.busCapacity - b.bookedSeatsCount) - (a.busCapacity - a.bookedSeatsCount));
    }

    setFilteredTrips(result);
    setCurrentPage(1); // Reset to first page
  };

  useEffect(() => {
    applyFilters();
  }, [filterSource, filterDestination, filterDate, filterOperator, filterTime, activeTab, sortBy]);

  const handleResetFilters = () => {
    setFilterSource('All');
    setFilterDestination('All');
    setFilterDate('');
    setFilterOperator('All');
    setFilterTime('All');
    setSortBy('departure');
    setActiveTab('all');
  };

  // Pagination Math
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTrips = filteredTrips.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-1 sm:p-4 bg-zinc-50 dark:bg-zinc-950 min-h-screen text-zinc-800 dark:text-zinc-200">
      
      {/* 1. SCENIC HEADER BANNER */}
      <div className="w-full h-[22vh] min-h-[180px] md:h-[28vh] md:min-h-[240px] rounded-[32px] relative overflow-hidden flex items-center px-6 sm:px-12 shadow-md border border-zinc-200/20 mb-8 group select-none">
        
        {/* Parallax background banner image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          style={{ backgroundImage: "url('/images/customer_bus_banner.jpg')" }}
        />
        
        {/* Pinkish-red & dark gradient overlay for professional high-contrast branding */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff2d88]/15 via-transparent to-zinc-950/50 z-10" />
        
        <div className="relative z-20 flex items-center justify-between w-full">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-none">
              Booking Trips
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 font-semibold mt-3.5 max-w-sm sm:max-w-md md:max-w-lg leading-relaxed opacity-90">
              Browse and search real-time available bus schedules and reserve tickets instantly with top-rated operators.
            </p>
          </div>
          

        </div>
      </div>

      {/* 2. FILTERING CARD CONTROL BAR */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] mb-8 flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* Source Dropdown */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Source City</span>
            <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-250/20 dark:border-zinc-800/80 rounded-2xl px-3 py-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none cursor-pointer text-zinc-700 dark:text-zinc-200"
              >
                <option value="All">All Sources</option>
                {sources.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Destination Dropdown */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Destination City</span>
            <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-250/20 dark:border-zinc-800/80 rounded-2xl px-3 py-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={filterDestination}
                onChange={(e) => setFilterDestination(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none cursor-pointer text-zinc-700 dark:text-zinc-200"
              >
                <option value="All">All Destinations</option>
                {destinations.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Date</span>
            <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-250/20 dark:border-zinc-800/80 rounded-2xl px-3 py-2 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-zinc-400 shrink-0" />
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none dark:color-scheme-dark text-zinc-700 dark:text-zinc-200"
              />
            </div>
          </div>

          {/* Operator Dropdown */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Bus Operator</span>
            <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-250/20 dark:border-zinc-800/80 rounded-2xl px-3 py-2 flex items-center gap-2">
              <BusIcon className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none cursor-pointer text-zinc-700 dark:text-zinc-200"
              >
                <option value="All">All Operators</option>
                {operators.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Time of Day Dropdown */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Departure Time</span>
            <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-250/20 dark:border-zinc-800/80 rounded-2xl px-3 py-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
              <select
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none cursor-pointer text-zinc-700 dark:text-zinc-200"
              >
                <option value="All">All Times</option>
                <option value="morning">Morning (6 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                <option value="evening">Evening (6 PM - 11 PM)</option>
                <option value="night">Night (11 PM - 6 AM)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer outline-none transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </button>

          <button
            onClick={applyFilters}
            className="px-5 py-2 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:opacity-95 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer outline-none transition-all shadow-md shadow-[#ff2d88]/15"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>
      </div>

      {/* 3. TABS SELECTORS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 select-none">
        
        {/* Today / Future / History Tab options */}
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white shadow-md shadow-[#ff2d88]/15' 
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            All Available
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'today' 
                ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white shadow-md shadow-[#ff2d88]/15' 
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Today's Trips
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'upcoming' 
                ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white shadow-md shadow-[#ff2d88]/15' 
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Upcoming Trips
          </button>
        </div>

        {/* Sorting options & Layout Toggle */}
        <div className="flex flex-wrap items-center gap-3.5 ml-auto md:ml-0">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-extrabold">
            Showing {filteredTrips.length} trips
          </span>

          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-2xl px-3 py-2 flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-0 p-0 text-xs font-extrabold focus:outline-none cursor-pointer text-zinc-500 dark:text-zinc-400"
            >
              <option value="departure">Sort by: Departure Time</option>
              <option value="fareAsc">Sort by: Fare (Low to High)</option>
              <option value="fareDesc">Sort by: Fare (High to Low)</option>
              <option value="availability">Sort by: Seat Availability</option>
            </select>
          </div>

          {/* Grid vs List Toggles */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                viewMode === 'list' 
                  ? 'bg-pink-50 text-[#ff2d88] dark:bg-pink-950/20' 
                  : 'text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              <List className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-pink-50 text-[#ff2d88] dark:bg-pink-950/20' 
                  : 'text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              <LayoutGrid className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 4. TRIP CARDS LIST */}
      <AnimatePresence mode="popLayout">
        {filteredTrips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-zinc-900 rounded-[32px] p-16 flex flex-col items-center justify-center text-center border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm"
          >
            <CalendarIcon className="h-12 w-12 text-zinc-300 dark:text-zinc-700 animate-pulse" />
            <h3 className="font-extrabold text-sm text-zinc-850 dark:text-zinc-200 mt-4">No Available Trips</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-1.5 max-w-[280px]">
              No active schedules match your chosen source, destination, or date. Try resetting filters.
            </p>
          </motion.div>
        ) : (
          <div className={viewMode === 'list' 
            ? "flex flex-col gap-4" 
            : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          }>
            {currentTrips.map((trip, idx) => (
              <motion.div
                layout
                key={trip.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <TripCard 
                  trip={trip} 
                  imageIndex={idx}
                  layout={viewMode}
                  onBook={(tripId) => router.push(`/customer/dashboard/book/${tripId}`)}
                  onViewDetails={(tripId) => router.push(`/customer/dashboard/book/${tripId}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* 5. PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 select-none pb-8">
          
          {/* Dropdown for items per page */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            <span>Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1 focus:outline-none cursor-pointer text-zinc-700 dark:text-zinc-300"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>

          {/* Navigation Page Numbers */}
          <div className="flex items-center gap-1.5">
            
            {/* Prev Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-zinc-500"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers().map(num => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-9 h-9 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  currentPage === num 
                    ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white shadow-md shadow-[#ff2d88]/20' 
                    : 'border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 text-zinc-500'
                }`}
              >
                {num}
              </button>
            ))}

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-zinc-500"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
