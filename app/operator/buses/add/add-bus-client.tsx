'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Bus, 
  Upload, 
  Trash2, 
  Info, 
  CheckCircle2, 
  Armchair, 
  Layers,
  Sparkles,
  HelpCircle,
  Activity,
  Plus
} from 'lucide-react';
import BusHeroBanner from '../bus-hero-banner';

interface AddBusClientProps {
  operatorName: string;
}

const BUS_TYPES = [
  'AC Sleeper',
  'Non-AC Sleeper',
  'AC Seater',
  'Non-AC Seater'
];

const AMENITY_OPTIONS = [
  'AC',
  'Wi-Fi',
  'Charging Point',
  'Blanket',
  'Pillow',
  'Water Bottle',
  'Reading Light',
  'GPS Tracking'
];

export default function AddBusClient({ operatorName }: AddBusClientProps) {
  const router = useRouter();
  
  // Form State
  const [busNumber, setBusNumber] = useState('');
  const [type, setType] = useState('AC Seater');
  const [routeId, setRouteId] = useState('');
  const [capacity, setCapacity] = useState<number>(30);
  const [rows, setRows] = useState<number>(8);
  const [cols, setCols] = useState<number>(4);
  const [sleeperSeats, setSleeperSeats] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  
  // Routes lookup
  const [routes, setRoutes] = useState<any[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);

  // Images state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Submit state
  const [submitting, setSubmitting] = useState(false);

  // Fetch operator routes on mount
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await axios.get('/api/routes?bypassCache=true&all=true');
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setRoutes(res.data.data);
          if (res.data.data.length > 0) {
            setRouteId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load routes:', err);
        toast.error('Could not fetch routes list.');
      } finally {
        setRoutesLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  // Sync columns based on type selection to make it easier for the user
  useEffect(() => {
    if (type.toLowerCase().includes('sleeper')) {
      setCols(3); // Sleeper buses standard columns (e.g. 2 x Aisle x 1)
      // Automatically toggle sleeper layout state
    } else {
      setCols(4); // Seater buses standard columns (e.g. 2 x Aisle x 2)
      setSleeperSeats([]); // Clear sleeper berths for pure seater
    }
  }, [type]);

  // Clean up Object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  // Image Upload Handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Check maximum 5 files constraint
    if (imageFiles.length + files.length > 5) {
      toast.warning('You can upload a maximum of 5 bus pictures.');
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file.`);
        continue;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 5MB size limit.`);
        continue;
      }
      
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setImageFiles(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle Amenity pill selection
  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    );
  };

  // Toggle seat status in the interactive grid selector
  const toggleSeatSleeper = (seatName: string) => {
    setSleeperSeats(prev => 
      prev.includes(seatName) 
        ? prev.filter(s => s !== seatName) 
        : [...prev, seatName]
    );
  };

  // Reset all fields
  const handleResetForm = () => {
    setBusNumber('');
    setType('AC Seater');
    if (routes.length > 0) setRouteId(routes[0].id);
    else setRouteId('');
    setCapacity(30);
    setRows(8);
    setCols(4);
    setSleeperSeats([]);
    setAmenities([]);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    toast.info('Form registration has been reset.');
  };

  // Submit Registration handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!busNumber.trim()) {
      toast.error('Registration plate number is required.');
      return;
    }
    if (!routeId) {
      toast.error('Please assign this bus to an active route.');
      return;
    }
    if (capacity <= 0 || rows <= 0 || cols <= 0) {
      toast.error('Dimensions and capacity values must be greater than 0.');
      return;
    }

    // Grid dimension check
    if (rows * cols < capacity) {
      toast.error(`A grid size of ${rows}x${cols} (${rows * cols} spaces) cannot fit ${capacity} seats. Please increase rows/cols or decrease capacity.`);
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Registering bus fleet and uploading pictures...');

    try {
      const fd = new FormData();
      fd.append('routeId', routeId);
      fd.append('busNumber', busNumber.trim());
      fd.append('type', type);
      fd.append('capacity', capacity.toString());
      fd.append('rows', rows.toString());
      fd.append('cols', cols.toString());
      fd.append('sleeperSeats', JSON.stringify(sleeperSeats));
      fd.append('amenities', JSON.stringify(amenities));
      
      imageFiles.forEach((file) => {
        fd.append('images', file);
      });

      const res = await axios.post('/api/buses', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        toast.success('Bus fleet registered successfully!', { id: toastId });
        router.push('/operator/buses');
      } else {
        toast.error(res.data?.message || 'Failed to register bus.', { id: toastId });
      }
    } catch (err: any) {
      console.error('[Add Bus Client] Submit error:', err);
      toast.error(err?.response?.data?.message || 'Error occurred while registering fleet.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Render Seating grid layout in the configurator area
  const renderInteractiveGrid = () => {
    const gridRows = [];
    const colLetters = Array.from({ length: cols }, (_, i) => String.fromCharCode(65 + i));
    const aisleIndex = Math.floor(cols / 2);

    for (let r = 1; r <= rows; r++) {
      const rowElements = [];
      for (let c = 0; c < cols; c++) {
        // Insert Aisle spacer
        if (c === aisleIndex && cols > 2) {
          rowElements.push(
            <div key={`aisle-${r}-${c}`} className="w-10 h-10 flex items-center justify-center text-[9px] text-zinc-400 font-extrabold uppercase select-none">
              Aisle
            </div>
          );
        }

        const seatName = `${r}${colLetters[c]}`;
        const isSelectedSleeper = sleeperSeats.includes(seatName);

        rowElements.push(
          <button
            key={seatName}
            type="button"
            onClick={() => toggleSeatSleeper(seatName)}
            className={`relative rounded-xl border flex flex-col items-center justify-center font-bold text-[10px] sm:text-xs shadow-sm transition-all duration-200 cursor-pointer ${
              isSelectedSleeper
                ? 'w-10 h-16 bg-indigo-500 border-indigo-600 text-white shadow-indigo-500/20'
                : 'w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 hover:border-emerald-300'
            }`}
          >
            {isSelectedSleeper ? (
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            ) : (
              <Armchair className="h-3 w-3 opacity-60 mb-0.5" />
            )}
            <span>{seatName}</span>
          </button>
        );
      }

      gridRows.push(
        <div key={`row-${r}`} className="flex items-center gap-3.5 justify-center">
          <span className="w-8 text-right text-[10px] text-zinc-400 font-black uppercase">Row {r}</span>
          {rowElements}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3.5 p-6 bg-zinc-50 dark:bg-zinc-950/40 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 max-h-[380px] overflow-y-auto w-full select-none">
        <div className="flex items-center justify-between border-b border-zinc-250 dark:border-zinc-800 pb-3 mb-2 px-2">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">CABIN FRONT</span>
          <span className="text-[10px] text-[#ff7c52] font-black uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Click seat to toggle sleeper berth
          </span>
        </div>
        <div className="flex flex-col gap-3.5">
          {gridRows}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER BANNER SECTION */}
      <div className="relative">
        <BusHeroBanner 
          title="Add New Bus"
          description="Register a new passenger coach to your active operations fleet. Assign route paths, set seat layouts, add amenities, and upload preview photos."
          subBadgeText="Fleet Registration"
        />
        
        {/* Back Link Button top right */}
        <button 
          onClick={() => router.push('/operator/buses')}
          className="absolute top-6 right-6 z-20 px-4.5 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 text-white font-extrabold text-xs rounded-2xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Fleet
        </button>
      </div>

      {/* FORM WRAPPER */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 select-none">
        
        {/* SECTION 1: BASIC INFORMATION */}
        <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center font-black text-sm shrink-0">
              1
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-950 dark:text-white leading-none">Basic Bus Information</h3>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block mt-1">Vehicle plate specifications and active line assignment</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
            
            {/* Bus Number (License Plate) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-1">
                Registration Plate Number *
              </label>
              <input 
                type="text" 
                placeholder="E.g., MH-12-PQ-4567" 
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-zinc-200 text-xs font-bold focus:outline-none focus:border-[#ff2d88] transition-colors"
                required
              />
            </div>

            {/* Bus Type */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-1">
                Bus Type Category *
              </label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-zinc-200 text-xs font-bold focus:outline-none focus:border-[#ff2d88] transition-colors cursor-pointer"
              >
                {BUS_TYPES.map((bt) => (
                  <option key={bt} value={bt} className="bg-white dark:bg-zinc-900 font-semibold">{bt}</option>
                ))}
              </select>
            </div>

            {/* Route Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-1">
                Assigned Operations Route *
              </label>
              {routesLoading ? (
                <div className="h-10 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl animate-pulse" />
              ) : routes.length === 0 ? (
                <div className="px-4 py-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-amber-500 text-xs font-bold leading-normal">
                  No routes found. Create a route template first!
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <select 
                    value={routeId}
                    onChange={(e) => setRouteId(e.target.value)}
                    className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-zinc-200 text-xs font-bold focus:outline-none focus:border-[#ff2d88] transition-colors cursor-pointer w-full"
                    required
                  >
                    {routes.map((r) => (
                      <option key={r.id} value={r.id} className="bg-white dark:bg-zinc-900 font-semibold">
                        {r.source} ➔ {r.destination} ({r.stops?.length || 0} stops)
                      </option>
                    ))}
                  </select>

                  {/* Dynamic Route Stops Preview */}
                  {(() => {
                    const selectedRoute = routes.find(r => r.id === routeId);
                    if (!selectedRoute || !selectedRoute.stops || selectedRoute.stops.length === 0) return null;
                    return (
                      <div className="text-[10px] text-zinc-500 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-150 dark:border-zinc-850 p-2.5 rounded-xl font-semibold leading-normal select-none animate-in fade-in duration-200">
                        <span className="text-[9px] text-[#ff7c52] font-black uppercase tracking-wider block mb-1">Route Path Preview:</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {selectedRoute.stops.map((stop: any, idx: number) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <span className="text-zinc-400">➔</span>}
                              <span className="bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200/40 text-zinc-700 dark:text-zinc-300">{stop.stopName}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* SECTION 2: SEATING & CAPACITY */}
        <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center font-black text-sm shrink-0">
              2
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-950 dark:text-white leading-none">Seating Layout & Capacity</h3>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block mt-1">Configure columns, grid boundaries, and select onboard amenities</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
            
            {/* Grid dimension inputs + Amenities */}
            <div className="flex flex-col gap-6">
              
              <div className="grid grid-cols-3 gap-4">
                {/* Capacity */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-1">
                    Total Seats *
                  </label>
                  <input 
                    type="number" 
                    min={1}
                    max={100}
                    value={capacity}
                    onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-zinc-200 text-xs font-bold focus:outline-none focus:border-[#ff2d88] transition-colors"
                    required
                  />
                </div>

                {/* Rows */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-1">
                    Grid Rows *
                  </label>
                  <input 
                    type="number" 
                    min={1}
                    max={20}
                    value={rows}
                    onChange={(e) => setRows(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-zinc-200 text-xs font-bold focus:outline-none focus:border-[#ff2d88] transition-colors"
                    required
                  />
                </div>

                {/* Columns */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-1">
                    Grid Columns *
                  </label>
                  <input 
                    type="number" 
                    min={1}
                    max={10}
                    value={cols}
                    onChange={(e) => setCols(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-zinc-200 text-xs font-bold focus:outline-none focus:border-[#ff2d88] transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Grid boundary notice alert */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-800/40 rounded-2xl flex gap-3 text-xs leading-normal select-none">
                <Layers className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 text-zinc-500">
                  <span className="font-extrabold text-zinc-700 dark:text-zinc-300">Layout Verification Bounds:</span>
                  <span>Currently configured: <strong>{rows} rows × {cols} columns</strong> = accommodating up to <strong>{rows * cols}</strong> seat coordinates (Required total capacity: <strong>{capacity}</strong>).</span>
                </div>
              </div>

              {/* Amenities */}
              <div className="flex flex-col gap-3.5">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-1">
                  Onboard Fleet Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map((am) => {
                    const isSelected = amenities.includes(am);
                    return (
                      <button
                        key={am}
                        type="button"
                        onClick={() => toggleAmenity(am)}
                        className={`px-4 py-2 border rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900' 
                            : 'bg-zinc-50 border-zinc-200/60 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-950/20 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        {am}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Interactive configurator preview */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-1">
                Interactive Seating Visualizer
              </label>
              {renderInteractiveGrid()}
            </div>

          </div>
        </div>

        {/* SECTION 3: BUS IMAGES */}
        <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center font-black text-sm shrink-0">
              3
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-950 dark:text-white leading-none">Vehicle Preview Photos</h3>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block mt-1">Upload premium pictures of your registered coach (Max 5 images, up to 5MB each)</span>
            </div>
          </div>

          <div className="flex flex-col gap-5 mt-2">
            
            {/* Uploader Box */}
            <div className="relative border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-[#ff2d88] dark:hover:border-[#ff5666] transition-colors rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-zinc-50/50 dark:bg-zinc-950/10">
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              />
              
              <div className="h-14 w-14 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-150 dark:border-zinc-850 flex items-center justify-center text-zinc-400 mb-4">
                <Upload className="h-6 w-6" />
              </div>
              
              <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 leading-none">
                Drag & Drop or Click to Upload Images
              </h4>
              
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-2.5">
                PNG, JPG, JPEG files (max 5MB per file)
              </p>
            </div>

            {/* Uploaded image previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-1">
                {imagePreviews.map((url, index) => (
                  <div key={index} className="relative rounded-2xl overflow-hidden aspect-video border border-zinc-200/50 dark:border-zinc-800 group shadow-sm">
                    <img 
                      src={url} 
                      alt={`Bus preview ${index + 1}`}
                      className="w-full h-full object-cover" 
                    />
                    {/* Delete overlay */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-150 cursor-pointer"
                    >
                      <Trash2 className="h-5 w-5 hover:text-rose-400 transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ACTIONS ROW */}
        <div className="flex items-center justify-between gap-4 mt-2">
          
          <button
            type="button"
            onClick={handleResetForm}
            className="px-6 py-3.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-extrabold text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Reset Form
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:from-[#ff8e6b] hover:to-[#ff459b] hover:shadow-lg hover:shadow-[#ff2d88]/20 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Registering...
              </>
            ) : (
              <>
                <Plus className="h-4.5 w-4.5 shrink-0" />
                Register Bus Fleet
              </>
            )}
          </button>

        </div>

      </form>
      
    </div>
  );
}
