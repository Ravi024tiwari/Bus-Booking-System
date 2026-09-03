'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Info, 
  Clock, 
  TrendingUp, 
  Layers, 
  Phone, 
  CheckCircle2, 
  Sparkles,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Navigation,
  Calendar,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Stop {
  stopName: string;
  arrivalTime: string;   // e.g., "08:45 AM"
  departureTime: string; // e.g., "08:50 AM"
  fareFromPreviousStop: number;
  distanceFromPreviousStop: number;
}

interface RouteTemplate {
  id: string;
  source: string;
  destination: string;
  stops: Array<{
    stopName: string;
    arrivalOffsetMinutes: number;
    departureOffsetMinutes: number;
    sequence: number;
    fareFromPreviousStop: number;
    distanceFromPreviousStop: number;
  }>;
  totalDistance: number;
  description: string;
  createdAt: string;
}

interface RoutesClientProps {
  initialRoutes: RouteTemplate[];
}

export default function RoutesClient({ initialRoutes }: RoutesClientProps) {
  const [routes, setRoutes] = useState<RouteTemplate[]>(initialRoutes);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable cards & Details Modal state
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
  const [selectedRouteForModal, setSelectedRouteForModal] = useState<RouteTemplate | null>(null);

  // Form states
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  
  // Stops list
  // Default with source and destination stops
  const [stops, setStops] = useState<Stop[]>([
    { stopName: '', arrivalTime: '-', departureTime: '08:00 AM', fareFromPreviousStop: 0, distanceFromPreviousStop: 0 },
    { stopName: '', arrivalTime: '06:30 PM', departureTime: '-', fareFromPreviousStop: 500, distanceFromPreviousStop: 0 }
  ]);

  // Synchronize first/last stop names with Source/Destination input
  useEffect(() => {
    setStops(prev => {
      const updated = [...prev];
      if (updated[0]) updated[0].stopName = source;
      if (updated[updated.length - 1]) updated[updated.length - 1].stopName = destination;
      return updated;
    });
  }, [source, destination]);

  // Helper: Convert time string "HH:MM AM/PM" or 24h "HH:MM" to minutes from start of day
  function timeStringToMinutes(timeStr: string): number {
    if (!timeStr || timeStr === '-' || timeStr.trim() === '') return -1;
    
    const cleanStr = timeStr.trim().toUpperCase();
    
    // 12-hour format with AM/PM (e.g. 08:30 PM, 8:30AM)
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

    // 24-hour format (e.g. 18:30, 08:45, 8:00)
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

  // Helper: Format minutes offset into human readable "10h 30m"
  function formatMinutesDuration(totalMinutes: number): string {
    if (totalMinutes <= 0) return '-';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
  }

  // Calculate cumulative offset minutes for all stops
  const getCalculatedStops = () => {
    if (stops.length < 2) return [];
    
    const firstDepMin = timeStringToMinutes(stops[0].departureTime);
    const baseMinutes = firstDepMin !== -1 ? firstDepMin : 480; // default to 8:00 AM (480 mins)
    let dayOffset = 0;
    let lastTimeMinutes = baseMinutes;

    return stops.map((stop, idx) => {
      // Starting stop
      if (idx === 0) {
        return {
          stopName: stop.stopName || 'Source',
          arrivalOffsetMinutes: 0,
          departureOffsetMinutes: 0,
          sequence: 1,
          fareFromPreviousStop: 0,
          arrivalTime: '-',
          departureTime: stop.departureTime
        };
      }

      // Middle / destination stops
      const isLast = idx === stops.length - 1;
      
      let arrMinutes = timeStringToMinutes(stop.arrivalTime);
      if (arrMinutes === -1) {
        // Fallback: estimate time to prevent jumping logic when user is typing
        arrMinutes = lastTimeMinutes + 30;
      }
      
      // If arrival time is earlier in the day than last recorded time, we assume a midnight crossover
      if (arrMinutes < lastTimeMinutes) {
        dayOffset += 1440; // Add one full day (24 hours) in minutes
      }
      const arrivalOffset = (arrMinutes + dayOffset) - baseMinutes;
      lastTimeMinutes = arrMinutes;

      let departureOffset = arrivalOffset;
      if (!isLast && stop.departureTime !== '-') {
        let depMinutes = timeStringToMinutes(stop.departureTime);
        if (depMinutes === -1) {
          depMinutes = lastTimeMinutes + 5; // default 5 min layover
        }
        if (depMinutes < lastTimeMinutes) {
          dayOffset += 1440;
        }
        departureOffset = (depMinutes + dayOffset) - baseMinutes;
        lastTimeMinutes = depMinutes;
      }

      return {
        stopName: stop.stopName || (isLast ? 'Destination' : `Stop ${idx + 1}`),
        arrivalOffsetMinutes: arrivalOffset,
        departureOffsetMinutes: isLast ? arrivalOffset : departureOffset,
        sequence: idx + 1,
        fareFromPreviousStop: Number(stop.fareFromPreviousStop) || 0,
        distanceFromPreviousStop: idx === 0 ? 0 : (Number(stop.distanceFromPreviousStop) || 0),
        arrivalTime: stop.arrivalTime,
        departureTime: isLast ? '-' : stop.departureTime
      };
    });
  };

  const calculatedStops = getCalculatedStops();
  
  // Calculate total duration from calculated stops
  const totalDurationMinutes = calculatedStops.length > 0 
    ? calculatedStops[calculatedStops.length - 1].arrivalOffsetMinutes 
    : 0;

  const totalDurationFormatted = formatMinutesDuration(totalDurationMinutes);

  // Total stops fare sum
  const totalFare = stops.reduce((sum, s) => sum + (Number(s.fareFromPreviousStop) || 0), 0);

  // Auto-calculated cumulative total distance from all sub-stops
  const totalDistanceCalculated = stops.reduce(
    (sum, s, idx) => (idx === 0 ? sum : sum + (Number(s.distanceFromPreviousStop) || 0)),
    0
  );

  // Form control: Add middle stop
  const handleAddStop = () => {
    setStops(prev => {
      const updated = [...prev];
      const insertIndex = updated.length - 1;
      
      // Default intermediate stop time estimation
      const lastStopValue = updated[insertIndex - 1];
      const lastDepTime = lastStopValue ? lastStopValue.departureTime : '08:00 AM';
      
      // Add a simple default time slot (e.g. 1 hour later)
      let defaultArr = '10:00 AM';
      let defaultDep = '10:05 AM';
      
      const newStop: Stop = {
        stopName: '',
        arrivalTime: defaultArr,
        departureTime: defaultDep,
        fareFromPreviousStop: 100,
        distanceFromPreviousStop: 0
      };
      
      updated.splice(insertIndex, 0, newStop);
      return updated;
    });
  };

  // Form control: Delete middle stop
  const handleDeleteStop = (index: number) => {
    if (index === 0 || index === stops.length - 1) {
      toast.error('Cannot remove source or destination stop.');
      return;
    }
    setStops(prev => prev.filter((_, i) => i !== index));
  };

  // Form control: Edit stop properties
  const handleUpdateStop = (index: number, key: keyof Stop, value: any) => {
    setStops(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [key]: value
      };
      return updated;
    });
  };

  // Move stops up/down in sequence
  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    if (index === 0 || index === stops.length - 1) return; // cannot move boundaries
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex <= 0 || targetIndex >= stops.length - 1) return; // boundaries check

    setStops(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  // Reset form
  const handleResetForm = () => {
    setSource('');
    setDestination('');
    setDescription('');
    setStops([
      { stopName: '', arrivalTime: '-', departureTime: '08:00 AM', fareFromPreviousStop: 0, distanceFromPreviousStop: 0 },
      { stopName: '', arrivalTime: '06:30 PM', departureTime: '-', fareFromPreviousStop: 500, distanceFromPreviousStop: 0 }
    ]);
  };

  // Form Submit: POST Route Template
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!source.trim() || !destination.trim()) {
      toast.error('Please enter both source and destination cities.');
      return;
    }

    if (stops.some((s, idx) => !s.stopName.trim())) {
      toast.error('All stops must have a stop name.');
      return;
    }

    setLoading(true);
    try {
      const finalStops = calculatedStops.map(s => ({
        stopName: s.stopName,
        arrivalOffsetMinutes: s.arrivalOffsetMinutes,
        departureOffsetMinutes: s.departureOffsetMinutes,
        sequence: s.sequence,
        fareFromPreviousStop: s.fareFromPreviousStop,
        distanceFromPreviousStop: s.distanceFromPreviousStop
      }));

      const payload = {
        source: source.trim(),
        destination: destination.trim(),
        stops: finalStops,
        totalDistance: totalDistanceCalculated,
        description: description.trim()
      };

      const response = await axios.post('/api/routes', payload);

      if (response.data?.success && response.data?.data) {
        toast.success(response.data.message || 'Route template created successfully!');
        
        // Add new route to the front of list
        const newRoute = response.data.data;
        setRoutes(prev => [newRoute, ...prev]);

        // Close form
        setIsAdding(false);
        handleResetForm();
      }
    } catch (err: any) {
      console.error('[Add Route Submit] Error:', err);
      toast.error(err.response?.data?.message || 'Failed to create route template.');
    } finally {
      setLoading(false);
    }
  };

  // Route Delete handler
  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this route template?')) return;
    
    try {
      // Local state filter fallback
      setRoutes(prev => prev.filter(r => r.id !== routeId));
      toast.success('Route template removed successfully.');
    } catch (err) {
      toast.error('Error removing route.');
    }
  };

  // Filter routes by search query
  const filteredRoutes = routes.filter(r => 
    r.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.stops.some(s => s.stopName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 min-h-screen text-zinc-800 dark:text-zinc-200">
      <AnimatePresence mode="wait">
        {!isAdding ? (
          /* ==============================================================
             ROUTE TEMPLATE DASHBOARD (LIST VIEW)
             ============================================================== */
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-6"
          >
            {/* Title Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-none">
                  Route Templates
                </h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-2.5">
                  Decide and manage global routes available for bus schedulers.
                </p>
              </div>

              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5 cursor-pointer outline-none shrink-0"
              >
                <Plus className="h-4 w-4" />
                Add New Route
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm p-1 flex items-center">
              <Search className="h-4.5 w-4.5 text-zinc-400 ml-3" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search routes by city, stops..."
                className="w-full bg-transparent border-0 px-3 py-2 text-xs font-bold focus:outline-none placeholder-zinc-400"
              />
            </div>

            {/* List Grid */}
            {filteredRoutes.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-16 flex flex-col items-center justify-center text-center border border-zinc-100/50 dark:border-zinc-800/50 shadow-sm">
                <MapPin className="h-12 w-12 text-zinc-300 dark:text-zinc-700 animate-bounce" />
                <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 mt-4">No Routes Found</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-1.5 max-w-[280px]">
                  No route templates match your search query. Try creating a new one.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRoutes.map((route) => {
                  const isExpanded = !!expandedCardIds[route.id];
                  const totalRouteFare = route.stops.reduce((sum, s) => sum + (s.fareFromPreviousStop || 0), 0);
                  const lastStop = route.stops[route.stops.length - 1];
                  const totalDuration = lastStop ? formatMinutesDuration(lastStop.arrivalOffsetMinutes) : '-';

                  return (
                    <motion.div
                      layout
                      key={route.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-850 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                    >
                      {/* Top Accent Gradient Bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                      <div className="flex flex-col gap-4">
                        {/* Header: Source -> Destination & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-base text-zinc-900 dark:text-white">
                                {route.source}
                              </span>
                              <div className="h-5 px-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <ArrowRight className="h-3 w-3" />
                              </div>
                              <span className="font-extrabold text-base text-zinc-900 dark:text-white">
                                {route.destination}
                              </span>
                            </div>

                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 w-fit">
                              {route.stops.length} Total Stops
                            </span>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedRouteForModal(route)}
                              title="Inspect Complete Route"
                              className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteRoute(route.id)}
                              title="Delete Route Template"
                              className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Route Description */}
                        {route.description ? (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium line-clamp-2">
                            {route.description}
                          </p>
                        ) : null}

                        {/* Metric Stats Strip */}
                        <div className="grid grid-cols-3 gap-2 bg-zinc-50/80 dark:bg-zinc-950/50 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800/80">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-zinc-400 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-emerald-500" /> Distance
                            </span>
                            <span className="text-xs font-black text-zinc-900 dark:text-white mt-0.5">
                              {route.totalDistance > 0 ? `${route.totalDistance} KM` : '0 KM'}
                            </span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-zinc-400 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-500" /> Duration
                            </span>
                            <span className="text-xs font-black text-zinc-900 dark:text-white mt-0.5">
                              {totalDuration}
                            </span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-zinc-400 flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-indigo-500" /> Base Fare
                            </span>
                            <span className="text-xs font-black text-zinc-900 dark:text-white mt-0.5">
                              ₹{totalRouteFare}
                            </span>
                          </div>
                        </div>

                        {/* Stops Timeline Section */}
                        <div className="flex flex-col gap-2.5 mt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
                              Journey Timeline
                            </span>
                            {route.stops.length > 3 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedCardIds(prev => ({ ...prev, [route.id]: !prev[route.id] }));
                                }}
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>Show less <ChevronUp className="h-3 w-3" /></>
                                ) : (
                                  <>+{route.stops.length - 2} intermediate <ChevronDown className="h-3 w-3" /></>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Visual Timeline Nodes */}
                          <div className="relative pl-5 flex flex-col gap-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100 dark:before:bg-indigo-950/60">
                            {/* If not expanded and >3 stops, show First, Sample summary, and Last */}
                            {(!isExpanded && route.stops.length > 3 ? [
                              route.stops[0],
                              route.stops[route.stops.length - 1]
                            ] : route.stops).map((stop, sIdx, arr) => {
                              const isSource = stop.sequence === 1;
                              const isDest = stop.sequence === route.stops.length;

                              return (
                                <div key={sIdx} className="flex items-center justify-between text-xs font-bold">
                                  <div className="flex items-center gap-2">
                                    <div className={`absolute left-[2px] w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm ${
                                      isSource ? 'bg-indigo-500' : isDest ? 'bg-emerald-500' : 'bg-purple-500'
                                    }`} />
                                    <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]">
                                      {stop.stopName}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold">
                                    {!isSource && (
                                      <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-indigo-600 dark:text-indigo-400">
                                        +{stop.distanceFromPreviousStop || 0} km
                                      </span>
                                    )}
                                    <span className="text-zinc-500">
                                      {isSource ? 'Start' : `+${stop.arrivalOffsetMinutes}m`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] font-bold text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-indigo-500" />
                          Auto-Calculated
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedRouteForModal(route)}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          View Full Details <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Complete Route Details Interactive Modal */}
            <AnimatePresence>
              {selectedRouteForModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-6 sm:p-8 max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                  >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                            {selectedRouteForModal.source}
                          </h3>
                          <ArrowRight className="h-4 w-4 text-indigo-500" />
                          <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                            {selectedRouteForModal.destination}
                          </h3>
                        </div>
                        <p className="text-xs text-zinc-400 font-semibold">
                          Complete Route & Sub-Stops Breakdown
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedRouteForModal(null)}
                        className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Summary Metrics Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-zinc-400">Total Distance</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {selectedRouteForModal.totalDistance} KM
                        </span>
                      </div>

                      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-zinc-400">Total Duration</span>
                        <span className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">
                          {formatMinutesDuration(selectedRouteForModal.stops[selectedRouteForModal.stops.length - 1]?.arrivalOffsetMinutes)}
                        </span>
                      </div>

                      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-zinc-400">Total Stops</span>
                        <span className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">
                          {selectedRouteForModal.stops.length}
                        </span>
                      </div>

                      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-zinc-400">Base Fare Sum</span>
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                          ₹{selectedRouteForModal.stops.reduce((sum, s) => sum + (s.fareFromPreviousStop || 0), 0)}
                        </span>
                      </div>
                    </div>

                    {/* Full Table Breakdown */}
                    <div className="overflow-y-auto flex-1 pr-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400">
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Stop Name</th>
                            <th className="py-2.5 px-3">Arrival Offset</th>
                            <th className="py-2.5 px-3">Departure Offset</th>
                            <th className="py-2.5 px-3">Distance</th>
                            <th className="py-2.5 px-3">Fare</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-semibold">
                          {selectedRouteForModal.stops.map((stop, idx) => {
                            const isSource = idx === 0;
                            const isDest = idx === selectedRouteForModal.stops.length - 1;

                            return (
                              <tr key={idx} className="border-b border-zinc-50 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                <td className="py-3 px-3">
                                  <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500">
                                    {stop.sequence}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-zinc-900 dark:text-white">
                                      {stop.stopName}
                                    </span>
                                    {isSource && (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                        Source
                                      </span>
                                    )}
                                    {isDest && (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        Destination
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-zinc-500">
                                  {isSource ? '—' : `+${stop.arrivalOffsetMinutes} mins`}
                                </td>
                                <td className="py-3 px-3 text-zinc-500">
                                  {isDest ? '—' : `+${stop.departureOffsetMinutes} mins`}
                                </td>
                                <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                  {isSource ? '0 KM' : `+${stop.distanceFromPreviousStop || 0} KM`}
                                </td>
                                <td className="py-3 px-3 font-bold text-zinc-900 dark:text-white">
                                  {isSource ? '—' : `₹${stop.fareFromPreviousStop || 0}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Modal Footer */}
                    <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-semibold">
                        {selectedRouteForModal.description || 'No additional description provided.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedRouteForModal(null)}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ==============================================================
             ADD NEW ROUTE FORM VIEW
             ============================================================== */
          <motion.div
            key="add-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/80 pb-5 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-none">
                  Add New Route
                </h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-2.5">
                  Create a new bus route template with source, destination, and intermediate stops.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsAdding(false);
                  handleResetForm();
                }}
                className="px-3.5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800/60 rounded-2xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer outline-none"
              >
                <ArrowLeft className="h-4 w-4 text-zinc-500" />
                Back to Routes
              </button>
            </div>

            {/* Grid Layout (Left Form, Right Summary/Preview) */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
              
              {/* Left Column - Form (3/5 Width) */}
              <form onSubmit={handleSubmit} className="xl:col-span-3 flex flex-col gap-8">
                
                {/* 1. Basic Route Information */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-850 rounded-3xl p-6 shadow-[0_5px_20px_rgba(0,0,0,0.02)] flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-black rounded-full flex items-center justify-center text-xs">
                      1
                    </span>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
                      Basic Route Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                        Source City <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-1 flex items-center">
                        <MapPin className="h-4 w-4 text-indigo-500 ml-3" />
                        <input 
                          type="text"
                          required
                          value={source}
                          onChange={(e) => setSource(e.target.value)}
                          placeholder="Enter source city"
                          className="w-full bg-transparent border-0 px-3 py-2 text-xs font-bold focus:outline-none placeholder-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                        Destination City <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-1 flex items-center">
                        <MapPin className="h-4 w-4 text-emerald-500 ml-3" />
                        <input 
                          type="text"
                          required
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          placeholder="Enter destination city"
                          className="w-full bg-transparent border-0 px-3 py-2 text-xs font-bold focus:outline-none placeholder-zinc-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Informational tip */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950/30 rounded-2xl p-4 flex gap-3 text-xs leading-normal font-semibold text-indigo-700 dark:text-indigo-400">
                    <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>
                      Tip: Add major cities as source and destination. You can add intermediate stops in the next section.
                    </span>
                  </div>
                </div>

                {/* 2. Route Stops Table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-850 rounded-3xl p-6 shadow-[0_5px_20px_rgba(0,0,0,0.02)] flex flex-col gap-5">
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-black rounded-full flex items-center justify-center text-xs">
                        2
                      </span>
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
                        Route Stops
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddStop}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1 cursor-pointer outline-none"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Stop
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold -mt-2 leading-none">
                    Add all stops between source and destination in order.
                  </p>

                  {/* Table Layout */}
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 text-left">
                          <th className="py-3 px-2">Stop & Sequence</th>
                          <th className="py-3 px-2">Arrival Time</th>
                          <th className="py-3 px-2">Departure Time</th>
                          <th className="py-3 px-2">Distance from Prev</th>
                          <th className="py-3 px-2">Fare from Prev</th>
                          <th className="py-3 px-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stops.map((stop, idx) => {
                          const isFirst = idx === 0;
                          const isLast = idx === stops.length - 1;
                          
                          return (
                            <tr 
                              key={idx} 
                              className="border-b border-zinc-100/50 dark:border-zinc-800/40 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                            >
                              {/* Sequence / Stop Name */}
                              <td className="py-4 px-2 min-w-[200px]">
                                <div className="flex items-center gap-3">
                                  {/* Drag / reorder handles */}
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      disabled={isFirst || idx === 1}
                                      onClick={() => handleMoveStop(idx, 'up')}
                                      className="text-zinc-350 hover:text-zinc-600 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                                    >
                                      <ArrowUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isLast || idx === stops.length - 2}
                                      onClick={() => handleMoveStop(idx, 'down')}
                                      className="text-zinc-350 hover:text-zinc-600 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                                    >
                                      <ArrowDown className="h-3 w-3" />
                                    </button>
                                  </div>

                                  {/* Index Circle Badge */}
                                  <span className="w-5.5 h-5.5 bg-zinc-50 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-850 rounded-lg flex items-center justify-center font-black text-[10px] text-zinc-500 shrink-0">
                                    {idx + 1}
                                  </span>

                                  {/* Stop Name Input / Display */}
                                  <div className="flex flex-col gap-1 w-full">
                                    {isFirst || isLast ? (
                                      <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-zinc-900 dark:text-white">
                                          {stop.stopName || (isFirst ? 'Enter Source' : 'Enter Destination')}
                                        </span>
                                        <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full select-none ${
                                          isFirst ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                        }`}>
                                          {isFirst ? 'Source' : 'Destination'}
                                        </span>
                                      </div>
                                    ) : (
                                      <input 
                                        type="text"
                                        value={stop.stopName}
                                        onChange={(e) => handleUpdateStop(idx, 'stopName', e.target.value)}
                                        placeholder={`Stop ${idx + 1} Name`}
                                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2 py-1.5 rounded-xl text-xs font-bold placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
                                      />
                                    )}
                                    <span className="text-[9px] text-zinc-400 font-semibold block leading-none">
                                      Sequence is auto-assigned
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Arrival Time */}
                              <td className="py-4 px-2 min-w-[110px]">
                                {isFirst ? (
                                  <span className="text-zinc-400 pl-3 select-none">—</span>
                                ) : (
                                  <div className="relative w-full max-w-[110px] bg-zinc-50 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-850 rounded-xl px-2 py-1.5 flex items-center gap-1.5">
                                    <input 
                                      type="text"
                                      value={stop.arrivalTime}
                                      onChange={(e) => handleUpdateStop(idx, 'arrivalTime', e.target.value)}
                                      placeholder="08:00 AM"
                                      className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none"
                                    />
                                    <Clock className="h-3 w-3 text-zinc-400" />
                                  </div>
                                )}
                              </td>

                              {/* Departure Time */}
                              <td className="py-4 px-2 min-w-[110px]">
                                {isLast ? (
                                  <span className="text-zinc-400 pl-3 select-none">—</span>
                                ) : (
                                  <div className="relative w-full max-w-[110px] bg-zinc-50 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-850 rounded-xl px-2 py-1.5 flex items-center gap-1.5">
                                    <input 
                                      type="text"
                                      value={stop.departureTime}
                                      onChange={(e) => handleUpdateStop(idx, 'departureTime', e.target.value)}
                                      placeholder="08:00 AM"
                                      className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none"
                                    />
                                    <Clock className="h-3 w-3 text-zinc-400" />
                                  </div>
                                )}
                              </td>

                              {/* Distance from previous stop (KM) */}
                              <td className="py-4 px-2 min-w-[120px]">
                                {isFirst ? (
                                  <span className="text-zinc-400 pl-3 select-none">—</span>
                                ) : (
                                  <div className="relative w-full max-w-[110px] bg-zinc-50 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-850 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                                    <input 
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={stop.distanceFromPreviousStop === 0 ? '' : stop.distanceFromPreviousStop}
                                      onChange={(e) => handleUpdateStop(idx, 'distanceFromPreviousStop', e.target.value === '' ? 0 : Number(e.target.value))}
                                      placeholder="0"
                                      className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none placeholder-zinc-400"
                                    />
                                    <span className="text-[10px] font-black text-indigo-500 select-none ml-1">KM</span>
                                  </div>
                                )}
                              </td>

                              {/* Fare from previous stop */}
                              <td className="py-4 px-2 min-w-[120px]">
                                {isFirst ? (
                                  <span className="text-zinc-400 pl-3 select-none">—</span>
                                ) : (
                                  <div className="relative w-full max-w-[110px] bg-zinc-50 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-850 rounded-xl px-3 py-1.5 flex items-center">
                                    <span className="text-zinc-400 font-bold mr-1 text-xs">₹</span>
                                    <input 
                                      type="number"
                                      min="0"
                                      value={stop.fareFromPreviousStop === 0 ? '' : stop.fareFromPreviousStop}
                                      onChange={(e) => handleUpdateStop(idx, 'fareFromPreviousStop', e.target.value === '' ? 0 : Number(e.target.value))}
                                      placeholder="0"
                                      className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none placeholder-zinc-400"
                                    />
                                  </div>
                                )}
                              </td>

                              {/* Actions (Delete icon) */}
                              <td className="py-4 px-2 text-center">
                                {!isFirst && !isLast ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStop(idx)}
                                    className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl cursor-pointer transition-all"
                                  >
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </button>
                                ) : (
                                  <span className="text-zinc-300 dark:text-zinc-700 select-none">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Drag drop info text */}
                  <div className="bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-950/20 rounded-2xl p-4 flex gap-3 text-xs leading-normal font-semibold text-indigo-700 dark:text-indigo-400">
                    <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>
                      Enter the distance in KM and fare from the immediately preceding stop. Total route distance is computed automatically in real-time.
                    </span>
                  </div>

                </div>

                {/* 3. Additional Information */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-850 rounded-3xl p-6 shadow-[0_5px_20px_rgba(0,0,0,0.02)] flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-black rounded-full flex items-center justify-center text-xs">
                      3
                    </span>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
                      Additional Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                    {/* Total duration (Calculated) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                        Estimated Total Duration
                      </label>
                      <div className="relative bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 flex items-center text-xs font-bold text-zinc-500">
                        {totalDurationFormatted}
                      </div>
                      <span className="text-[9px] font-semibold text-indigo-500 flex items-center gap-1">
                        <Info className="h-3 w-3 shrink-0" /> Calculated from first departure to last arrival
                      </span>
                    </div>

                    {/* Total distance (Auto-Calculated) */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                          Total Distance (KM)
                        </label>
                        <span className="text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> Auto-Calculated
                        </span>
                      </div>
                      <div className="relative bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs font-black text-zinc-900 dark:text-white">
                        <span>{totalDistanceCalculated} KM</span>
                        <span className="text-[10px] text-zinc-400 font-bold">Sum of sub-stops</span>
                      </div>
                      <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 shrink-0" /> Automatically computed from all stop distances
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                      Route Description (Optional)
                    </label>
                    <div className="relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4 flex flex-col gap-2">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                        placeholder="Enter route description, key highlights or notes..."
                        rows={4}
                        className="w-full bg-transparent border-0 p-0 text-xs font-semibold focus:outline-none resize-none"
                      />
                      <span className="text-[9px] font-black text-zinc-400 text-right">
                        {description.length}/500
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Review & Confirm */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-850 rounded-3xl p-6 shadow-[0_5px_20px_rgba(0,0,0,0.02)] flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-black rounded-full flex items-center justify-center text-xs">
                      4
                    </span>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
                      Review & Confirm
                    </h3>
                  </div>

                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold leading-normal mt-1">
                    Please review the route details and ensure the sequence of intermediate stops is accurate before creating.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-md shadow-indigo-600/10 cursor-pointer transition-all flex items-center justify-center gap-2 outline-none disabled:opacity-50"
                  >
                    {loading ? 'Creating Template...' : 'Create Route Template'}
                  </button>
                </div>

              </form>

              {/* Right Column - Summary & Mobile Preview (2/5 Width) */}
              <div className="xl:col-span-2 flex flex-col gap-8">
                
                {/* Route Summary */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-850 rounded-3xl p-6 shadow-sm flex flex-col gap-5 select-none">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xs uppercase text-zinc-400 tracking-wider leading-none">
                      Route Summary
                    </h3>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      Live Preview
                    </span>
                  </div>

                  {/* Route progress line matching mockup screenshot */}
                  <div className="relative bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-6 border border-zinc-150 dark:border-zinc-850 flex flex-col items-center gap-4 text-center mt-2 min-h-[140px] justify-center overflow-hidden">
                    <div className="absolute top-[-30%] left-[-30%] w-[120px] h-[120px] bg-indigo-500/5 rounded-full blur-[35px] pointer-events-none" />
                    
                    {/* Visual diagram */}
                    <div className="flex items-center justify-between w-full max-w-[240px] relative mt-2">
                      <div className="absolute left-6 right-6 top-[13px] h-0.5 border-t border-dashed border-zinc-300 dark:border-zinc-700 z-0" />
                      <div className="flex flex-col items-center gap-1.5 z-10">
                        <div className="h-7 w-7 rounded-full bg-indigo-50 border-2 border-indigo-500 dark:bg-indigo-950 flex items-center justify-center shadow-sm shrink-0">
                          <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                        </div>
                        <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 max-w-[75px] truncate">
                          {source || 'Source'}
                        </span>
                      </div>

                      {/* Stops dots */}
                      {stops.length > 2 && (
                        <div className="h-6 px-3 bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-full flex items-center justify-center font-bold text-[9px] text-zinc-500 z-10 shadow-sm animate-pulse">
                          {stops.length - 2} stop{stops.length > 3 ? 's' : ''}
                        </div>
                      )}

                      <div className="flex flex-col items-center gap-1.5 z-10">
                        <div className="h-7 w-7 rounded-full bg-emerald-50 border-2 border-emerald-500 dark:bg-emerald-950 flex items-center justify-center shadow-sm shrink-0">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 max-w-[75px] truncate">
                          {destination || 'Destination'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-black text-zinc-400">Route</span>
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1 truncate">
                        {source && destination ? `${source} ➔ ${destination}` : '—'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-black text-zinc-400">Total Stops</span>
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1">
                        {stops.length} Stops
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-black text-zinc-400">Total Distance</span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {totalDistanceCalculated > 0 ? `${totalDistanceCalculated} KM` : '0 KM'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-black text-zinc-400">Estimated Duration</span>
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1">
                        {totalDurationFormatted}
                      </span>
                    </div>
                    <div className="flex flex-col col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-[9px] uppercase font-black text-zinc-400">Total Base Fare Sum</span>
                      <span className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">
                        ₹{totalFare}
                      </span>
                    </div>
                  </div>

                  {/* Stops Milestone Breakdown */}
                  <div className="flex flex-col gap-2.5 mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
                      Stop-by-Stop Breakdown
                    </span>
                    <div className="relative pl-5 flex flex-col gap-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-150 dark:before:bg-indigo-950/60 max-h-[220px] overflow-y-auto pr-1">
                      {stops.map((s, sIdx) => {
                        const isFirst = sIdx === 0;
                        const isLast = sIdx === stops.length - 1;
                        return (
                          <div key={sIdx} className="flex items-center justify-between text-xs font-bold">
                            <div className="flex items-center gap-2">
                              <div className={`absolute left-[2px] w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm ${
                                isFirst ? 'bg-indigo-500' : isLast ? 'bg-emerald-500' : 'bg-zinc-400'
                              }`} />
                              <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[110px]">
                                {s.stopName || (isFirst ? 'Source' : isLast ? 'Destination' : `Stop ${sIdx + 1}`)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold">
                              {!isFirst && (
                                <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md font-mono text-indigo-600 dark:text-indigo-400">
                                  +{s.distanceFromPreviousStop || 0} km
                                </span>
                              )}
                              {!isFirst && (
                                <span className="text-zinc-500 font-semibold">
                                  ₹{s.fareFromPreviousStop || 0}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
