'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Bus, 
  Plus, 
  RefreshCw, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  X,
  Compass,
  Layout,
  Armchair,
  CheckCircle,
  Wifi,
  Wind,
  Zap,
  Droplet
} from 'lucide-react';
import BusCard, { BusData } from './bus-card';
import BusHeroBanner from './bus-hero-banner';

interface BusesClientProps {
  operatorName: string;
}

export default function OperatorBusesClient({ operatorName }: BusesClientProps) {
  const router = useRouter();
  const [buses, setBuses] = useState<BusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Selected bus state for layout map preview modal
  const [previewBus, setPreviewBus] = useState<BusData | null>(null);



  // Fetch operator buses
  const fetchBuses = async (isRefetch = false) => {
    if (isRefetch) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await axios.get('/api/buses');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setBuses(res.data.data);
      } else {
        toast.error('Failed to load buses.');
      }
    } catch (err: any) {
      console.error('[Operator Buses Client] Fetch error:', err);
      toast.error(err?.response?.data?.message || 'Error fetching fleet buses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleRedirectToAddBus = () => {
    toast.info('Navigating to Add New Bus configuration page...');
    router.push('/operator/buses/add');
  };

  // Helper to render visual seats grid representation inside modal
  const renderSeatMap = (bus: BusData) => {
    const seatRows = [];
    const colLetters = Array.from({ length: bus.cols }, (_, i) => String.fromCharCode(65 + i));
    
    // Determine aisle index: usually middle
    const aisleIndex = Math.floor(bus.cols / 2);

    for (let r = 1; r <= bus.rows; r++) {
      const rowSeats = [];
      for (let c = 0; c < bus.cols; c++) {
        // Insert aisle gap if columns count warrants it
        if (c === aisleIndex && bus.cols > 2) {
          rowSeats.push(
            <div key={`aisle-${r}-${c}`} className="w-10 h-10 flex items-center justify-center text-[10px] text-zinc-400 font-bold uppercase select-none">
              Aisle
            </div>
          );
        }

        const seatName = `${r}${colLetters[c]}`;
        const isSleeper = bus.sleeperSeats?.includes(seatName) || bus.type.toLowerCase().includes('sleeper');

        rowSeats.push(
          <div 
            key={seatName}
            className={`relative rounded-xl border flex flex-col items-center justify-center font-bold text-xs shadow-sm transition-all duration-200 ${
              isSleeper 
                ? 'w-10 h-16 bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400' 
                : 'w-10 h-10 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
            title={`${seatName} (${isSleeper ? 'Sleeper berth' : 'Standard seating'})`}
          >
            {isSleeper ? (
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            ) : (
              <Armchair className="h-3.5 w-3.5 opacity-60 mb-0.5" />
            )}
            <span>{seatName}</span>
          </div>
        );
      }
      
      seatRows.push(
        <div key={`row-${r}`} className="flex items-center gap-3.5 justify-center">
          {/* Row numbering label on left */}
          <div className="w-6 text-right text-[10px] font-extrabold text-zinc-400 uppercase mr-1">
            Row {r}
          </div>
          {rowSeats}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3.5 p-6 bg-zinc-50 dark:bg-zinc-950/40 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 w-full overflow-x-auto">
        {/* Cab front separator */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-2 px-2">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">FRONT / CABIN</span>
          <div className="h-6 w-6 rounded-full border-2 border-dashed border-zinc-400 flex items-center justify-center text-[10px] text-zinc-400 font-black">
            ⚙️
          </div>
        </div>
        {seatRows}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      
      <BusHeroBanner 
        title="Manage Your Fleet"
        description="Configure vehicle passenger seat maps, monitor registered classes (Seaters & Sleepers), view dynamic on-road statuses, and register new buses to optimize your transport schedule."
        subBadgeText="Fleet Management"
      />

      {/* FLEET HEADING & REDIRECT CONTROL ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          {/* Top Left Redirect Button */}
          <button 
            onClick={handleRedirectToAddBus}
            className="px-5 py-3 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:from-[#ff8e6b] hover:to-[#ff459b] hover:shadow-lg hover:shadow-[#ff2d88]/20 transition-all duration-200 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Add New Bus
          </button>

          <button 
            onClick={() => fetchBuses(true)}
            disabled={refreshing}
            className="p-3 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors duration-150 flex items-center justify-center shrink-0"
          >
            <RefreshCw className={`h-4 w-4 shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="text-right sm:text-left">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold block">
            Total Fleet Size: {buses.length} registered vehicles
          </span>
        </div>
      </div>

      {/* FLEET CARDS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse mt-2">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 h-48 flex flex-col gap-4 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
              <div className="h-10 bg-zinc-100 dark:bg-zinc-850 rounded-2xl" />
              <div className="h-8 bg-zinc-100 dark:bg-zinc-850 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : buses.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] mt-2 select-none shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
          <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mb-4 text-[#ff2d88]">
            <Bus className="h-8 w-8" />
          </div>
          <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white leading-none">No active fleet registered</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-2 max-w-sm">
            Get started by registering your first transport vehicle. Once added, you can start building routes and scheduling passenger trips!
          </p>
          <button 
            onClick={handleRedirectToAddBus}
            className="mt-5 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold rounded-xl transition-colors duration-150 shadow-sm"
          >
            Register Your First Bus
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          {buses.map((bus) => (
            <BusCard 
              key={bus.id} 
              bus={bus} 
              onClick={() => setPreviewBus(bus)}
            />
          ))}
        </div>
      )}

      {/* POPUP DETAIL PREVIEW MODAL (Seat Map Visualizer) */}
      {previewBus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 select-none">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl w-full max-w-[580px] max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setPreviewBus(null)}
              className="absolute top-5 right-5 p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors duration-150 z-20 shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Faded Background Bus visual header */}
            <div 
              className="relative h-32 flex items-end p-6 bg-zinc-950 bg-cover bg-center shrink-0"
              style={{ backgroundImage: "url('/images/bus_bg.png')" }}
            >
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent z-10" />

              <div className="relative z-15 text-left">
                <span className="text-[10px] text-[#ff7c52] font-black uppercase tracking-wider bg-[#ff7c52]/10 px-2 py-0.5 rounded">
                  {previewBus.type}
                </span>
                <h2 className="text-xl font-black text-white mt-1 leading-none">
                  {previewBus.busNumber}
                </h2>
              </div>
            </div>

            {/* Modal Body Scroll Container */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5 flex-1">
              
              {/* Grid dimensions & stats */}
              <div className="grid grid-cols-3 gap-3 text-center border border-zinc-100 dark:border-zinc-850 p-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-850/20">
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Total Seats</span>
                  <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none">
                    {previewBus.capacity}
                  </span>
                </div>
                <div className="flex flex-col border-x border-zinc-100 dark:border-zinc-800/40 px-2">
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Configuration</span>
                  <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none">
                    {previewBus.rows} x {previewBus.cols}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Traveling Status</span>
                  <span className={`text-[10px] font-black uppercase mt-0.5 leading-none ${
                    previewBus.activeTrip ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {previewBus.activeTrip ? 'On Road' : 'Idle'}
                  </span>
                </div>
              </div>

              {/* Dynamic Seat Grid visualization */}
              <div>
                <h3 className="font-extrabold text-xs text-zinc-900 dark:text-white uppercase tracking-wider mb-2.5 pl-1 flex items-center gap-1.5">
                  <Layout className="h-4 w-4 text-[#ff2d88]" />
                  Active Seating Configuration Layout
                </h3>
                {renderSeatMap(previewBus)}
              </div>

              {/* Amenities checkboxes */}
              <div>
                <h3 className="font-extrabold text-xs text-zinc-900 dark:text-white uppercase tracking-wider mb-2 pl-1">
                  Amenities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {previewBus.amenities && previewBus.amenities.length > 0 ? (
                    previewBus.amenities.map((amenity) => (
                      <span 
                        key={amenity} 
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/30 dark:border-zinc-700/30 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {amenity}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400 font-medium pl-1">No custom amenities registered.</span>
                  )}
                </div>
              </div>

              {/* Active Trip Info detail */}
              {previewBus.activeTrip && (
                <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 rounded-2xl flex flex-col gap-2">
                  <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    Trip details for live vehicle
                  </span>
                  <div className="flex items-center justify-between mt-1 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    <span>{previewBus.activeTrip.routeName}</span>
                    <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-md capitalize">
                      {previewBus.activeTrip.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium flex gap-4 mt-0.5">
                    <span>Departure: {new Date(previewBus.activeTrip.departureTime).toLocaleString()}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800/50 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setPreviewBus(null)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-extrabold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
