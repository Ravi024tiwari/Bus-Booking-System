'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
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
  Edit3,
  X,
  Plus,
  Wifi,
  Wind,
  Zap,
  Droplet,
  MapPin,
  Calendar,
  Eye,
  AlertCircle
} from 'lucide-react';
import { RootState } from '@/store';
import BusHeroBanner from './bus-hero-banner';

interface BusDetailViewProps {
  busId: string;
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

export default function BusDetailView({ busId }: BusDetailViewProps) {
  const router = useRouter();
  
  // Redux Profile validation
  const userProfile = useSelector((state: RootState) => state.user.profile);

  // Component Data States
  const [bus, setBus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Form State (for Edit mode)
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

  // New Image Files & Previews (for editing uploader)
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [deleteImages, setDeleteImages] = useState<string[]>([]);
  
  // Submit state
  const [submitting, setSubmitting] = useState(false);

  // Fetch Bus details & Routes on mount
  const fetchBusDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/buses/${busId}`);
      if (res.data?.success && res.data?.data) {
        const b = res.data.data;
        setBus(b);
        setActiveImageIndex(0);
        
        // Populate form initial fields
        setBusNumber(b.busNumber || '');
        setType(b.type || 'AC Seater');
        setRouteId(b.routeId || '');
        setCapacity(b.capacity || 30);
        setRows(b.rows || 8);
        setCols(b.cols || 4);
        setSleeperSeats(b.sleeperSeats || []);
        setAmenities(b.amenities || []);
        setExistingImages(b.images || []);
        setDeleteImages([]);
      } else {
        toast.error('Failed to load bus specifications.');
      }
    } catch (err) {
      console.error('[Bus Details View] Fetch error:', err);
      toast.error('Could not load vehicle details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusDetails();
  }, [busId]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await axios.get('/api/routes?bypassCache=true&all=true');
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setRoutes(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load routes:', err);
      } finally {
        setRoutesLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  // Sync routeId if routes load after bus details
  useEffect(() => {
    if (routes.length > 0 && !routeId) {
      if (bus?.routeId) {
        setRouteId(bus.routeId);
      } else if (routes[0]?.id) {
        setRouteId(routes[0].id);
      }
    }
  }, [routes, bus, routeId]);

  // Local profile load fallback for loading states
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        if (res.data?.success && res.data?.data) {
          setCurrentUser(res.data.data);
        }
      } catch (err) {
        console.error('[Bus Details View] Local profile load error:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Clean up Object URLs on unmount/re-upload
  useEffect(() => {
    return () => {
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]);

  // Authorization Check (Uses Redux state with direct profile API check as sync fallback)
  const canEdit = (userProfile && (userProfile.role === 'admin' || userProfile.id === bus?.operatorId)) ||
                  (currentUser && (currentUser.role === 'admin' || (currentUser._id || currentUser.id) === bus?.operatorId));

  // Handler when user changes bus type in edit mode
  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType.toLowerCase().includes('sleeper')) {
      setCols(3); // Sleeper default columns
    } else {
      setCols(4); // Seater default columns
      setSleeperSeats([]); // Clear sleeper berths for seater category
    }
  };

  // Image upload handling for edit uploader
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Total count cannot exceed 5
    const totalCount = existingImages.length - deleteImages.length + newImageFiles.length + files.length;
    if (totalCount > 5) {
      toast.warning('You can upload a maximum of 5 pictures total.');
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 5MB size limit.`);
        continue;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setNewImageFiles(prev => [...prev, ...newFiles]);
    setNewImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleExistingImageDelete = (url: string) => {
    setDeleteImages(prev => 
      prev.includes(url) 
        ? prev.filter(img => img !== url) 
        : [...prev, url]
    );
  };

  // Toggle Amenity check
  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    );
  };

  // Toggle seat status in edit seating visualizer
  const toggleSeatSleeper = (seatName: string) => {
    setSleeperSeats(prev => 
      prev.includes(seatName) 
        ? prev.filter(s => s !== seatName) 
        : [...prev, seatName]
    );
  };

  // Reset form editing states to initial fetched state
  const handleCancelEditing = () => {
    if (bus) {
      setBusNumber(bus.busNumber || '');
      setType(bus.type || 'AC Seater');
      setRouteId(bus.routeId || (routes[0]?.id || ''));
      setCapacity(bus.capacity || 30);
      setRows(bus.rows || 8);
      setCols(bus.cols || 4);
      setSleeperSeats(bus.sleeperSeats || []);
      setAmenities(bus.amenities || []);
      setDeleteImages([]);
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setNewImageFiles([]);
      setNewImagePreviews([]);
    }
    setIsEditMode(false);
  };

  // Submit edit form logic
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!busNumber.trim()) {
      toast.error('Registration plate number is required.');
      return;
    }
    if (!routeId) {
      toast.error('Please select an assigned operations route.');
      return;
    }
    if (capacity <= 0 || rows <= 0 || cols <= 0) {
      toast.error('Dimensions and capacity values must be greater than 0.');
      return;
    }
    if (rows * cols < capacity) {
      toast.error(`A grid size of ${rows}x${cols} (${rows * cols} spaces) cannot fit ${capacity} seats. Please increase rows/cols or decrease capacity.`);
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Saving vehicle updates and syncing metadata...');

    try {
      const fd = new FormData();
      fd.append('busNumber', busNumber.trim());
      fd.append('type', type);
      fd.append('routeId', routeId);
      fd.append('capacity', capacity.toString());
      fd.append('rows', rows.toString());
      fd.append('cols', cols.toString());
      fd.append('sleeperSeats', JSON.stringify(sleeperSeats));
      fd.append('amenities', JSON.stringify(amenities));
      
      if (deleteImages.length > 0) {
        fd.append('deleteImages', JSON.stringify(deleteImages));
      }

      newImageFiles.forEach((file) => {
        fd.append('images', file);
      });

      const res = await axios.put(`/api/buses/${busId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        toast.success('Specifications updated successfully!', { id: toastId });
        setIsEditMode(false);
        fetchBusDetails(); // Refetch updated state
      } else {
        toast.error(res.data?.message || 'Failed to update bus details.', { id: toastId });
      }
    } catch (err: any) {
      console.error('[Bus Details View] Submit error:', err);
      toast.error(err?.response?.data?.message || 'Error occurred while updating fleet specifications.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Render Amenities icons in view mode
  const renderAmenityIcon = (amenity: string) => {
    const clean = amenity.toLowerCase();
    if (clean.includes('wifi') || clean.includes('wi-fi')) {
      return (
        <span key={amenity} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-200/40 rounded-xl text-[11px] font-extrabold select-none">
          <Wifi className="h-3.5 w-3.5" />
          Wi-Fi
        </span>
      );
    }
    if (clean.includes('ac') || clean.includes('condition')) {
      return (
        <span key={amenity} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border border-teal-200/40 rounded-xl text-[11px] font-extrabold select-none">
          <Wind className="h-3.5 w-3.5" />
          AC Comfort
        </span>
      );
    }
    if (clean.includes('charg') || clean.includes('usb') || clean.includes('plug')) {
      return (
        <span key={amenity} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/40 rounded-xl text-[11px] font-extrabold select-none">
          <Zap className="h-3.5 w-3.5" />
          Charging Port
        </span>
      );
    }
    if (clean.includes('water')) {
      return (
        <span key={amenity} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/40 rounded-xl text-[11px] font-extrabold select-none">
          <Droplet className="h-3.5 w-3.5" />
          Water Bottle
        </span>
      );
    }
    return (
      <span key={amenity} className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-850 rounded-xl text-[11px] font-bold select-none">
        {amenity}
      </span>
    );
  };

  // Render Seating Grid Layout Map
  const renderSeatingGrid = (viewOnly: boolean) => {
    const gridRows = [];
    const targetCols = viewOnly ? bus?.cols : cols;
    const targetRows = viewOnly ? bus?.rows : rows;
    const targetSleeper = viewOnly ? bus?.sleeperSeats || [] : sleeperSeats;

    const colLetters = Array.from({ length: targetCols }, (_, i) => String.fromCharCode(65 + i));
    const aisleIndex = Math.floor(targetCols / 2);

    for (let r = 1; r <= targetRows; r++) {
      const rowElements = [];
      for (let c = 0; c < targetCols; c++) {
        // Insert Aisle spacer
        if (c === aisleIndex && targetCols > 2) {
          rowElements.push(
            <div key={`aisle-${r}-${c}`} className="w-10 h-10 flex items-center justify-center text-[9px] text-zinc-400 font-extrabold uppercase select-none">
              Aisle
            </div>
          );
        }

        const seatName = `${r}${colLetters[c]}`;
        const isSelectedSleeper = targetSleeper.includes(seatName);

        if (viewOnly) {
          rowElements.push(
            <div
              key={seatName}
              className={`relative rounded-xl border flex flex-col items-center justify-center font-bold text-[10px] sm:text-xs shadow-sm select-none ${
                isSelectedSleeper
                  ? 'w-10 h-16 bg-indigo-500 border-indigo-600 text-white shadow-indigo-500/10'
                  : 'w-10 h-10 bg-emerald-50 dark:bg-emerald-950/15 border-emerald-200/60 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {isSelectedSleeper ? (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white opacity-60" />
              ) : (
                <Armchair className="h-3 w-3 opacity-60 mb-0.5" />
              )}
              <span>{seatName}</span>
            </div>
          );
        } else {
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
      }

      gridRows.push(
        <div key={`row-${r}`} className="flex items-center gap-3 justify-center">
          <span className="w-8 text-right text-[10px] text-zinc-400 font-black uppercase">Row {r}</span>
          {rowElements}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3.5 p-6 bg-zinc-50 dark:bg-zinc-950/40 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 max-h-[380px] overflow-y-auto w-full select-none">
        <div className="flex items-center justify-between border-b border-zinc-250 dark:border-zinc-800 pb-3 mb-2 px-2">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">CABIN FRONT</span>
          {!viewOnly && (
            <span className="text-[10px] text-[#ff7c52] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Click seat to toggle sleeper berth
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3.5">
          {gridRows}
        </div>
      </div>
    );
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="flex flex-col gap-6 select-none">
        <div className="h-[260px] w-full bg-zinc-100 dark:bg-zinc-800 rounded-[2.5rem] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-zinc-100 dark:bg-zinc-800 rounded-[2.5rem] animate-pulse" />
          <div className="h-[400px] bg-zinc-100 dark:bg-zinc-800 rounded-[2.5rem] animate-pulse" />
        </div>
      </div>
    );
  }

  // Not Found fallback
  if (!bus) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] mt-6 shadow-sm select-none">
        <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
        <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white leading-none">Vehicle Not Found</h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-2">
          The requested coach details do not exist or have been removed.
        </p>
        <button 
          onClick={() => router.push('/operator/buses')}
          className="mt-5 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-850 cursor-pointer"
        >
          Return to Fleet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* PAGE ACTION ROW (Highly responsive on small screens) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/operator/buses')}
            className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors cursor-pointer flex items-center justify-center border border-zinc-200/50 dark:border-zinc-800"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-none">Vehicle Profile</h2>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block mt-1.5">Plate Number: <strong className="text-zinc-700 dark:text-zinc-300">{bus.busNumber}</strong></span>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              if (isEditMode) handleCancelEditing();
              else setIsEditMode(true);
            }}
            className="px-5 py-3 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:from-[#ff8e6b] hover:to-[#ff459b] hover:shadow-lg hover:shadow-[#ff2d88]/20 transition-all duration-200 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer w-full sm:w-auto"
          >
            {isEditMode ? (
              <>
                <X className="h-4 w-4" />
                Cancel Editing
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                Edit Specifications
              </>
            )}
          </button>
        )}
      </div>

      {/* HEADER HERO BANNER */}
      <BusHeroBanner 
        title={isEditMode ? "Edit Fleet Specs" : `Fleet: ${bus.busNumber}`}
        description={isEditMode ? "Modify capacity grids, route lines, class categories, or upload image previews." : `Currently registered as ${bus.type} with a total capacity of ${bus.capacity} seats.`}
        subBadgeText={isEditMode ? "Fleet Update" : "Vehicle Profile"}
      />

      {/* VIEW-ONLY MODE DETAILS PAGE */}
      {!isEditMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Specifications Card */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Core Specs */}
            <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center font-black">
                    <Bus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-950 dark:text-white leading-none">Vehicle Specifications</h3>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block mt-1">Core physical attributes and operational capacities</span>
                  </div>
                </div>

                {/* Edit details button (Only if user has canEdit permission) */}
                {canEdit && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-4.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-850 text-white dark:text-zinc-900 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Details
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 select-none">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-0.5">Category</span>
                  <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950/20 px-3 py-2 border border-zinc-200/50 dark:border-zinc-850 rounded-xl leading-none">{bus.type}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-0.5">Capacity</span>
                  <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950/20 px-3 py-2 border border-zinc-200/50 dark:border-zinc-850 rounded-xl leading-none">{bus.capacity} seats</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-0.5">Grid size</span>
                  <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950/20 px-3 py-2 border border-zinc-200/50 dark:border-zinc-850 rounded-xl leading-none flex items-center gap-1"><Layers className="h-4 w-4 text-zinc-400" />{bus.rows}x{bus.cols}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-0.5">Berth Type</span>
                  <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950/20 px-3 py-2 border border-zinc-200/50 dark:border-zinc-850 rounded-xl leading-none">{bus.sleeperSeats?.length || 0} Sleeper berths</span>
                </div>
              </div>

              {/* Amenities View */}
              <div className="flex flex-col gap-3.5 border-t border-zinc-150 dark:border-zinc-850 pt-5">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-0.5">Onboard Amenities</span>
                <div className="flex flex-wrap gap-2.5">
                  {bus.amenities && bus.amenities.length > 0 ? (
                    bus.amenities.map((amenity: string) => renderAmenityIcon(amenity))
                  ) : (
                    <span className="text-xs text-zinc-400 font-semibold italic pl-0.5">No special onboard amenities specified.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Visual Seating map */}
            <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
              <div>
                <h3 className="font-extrabold text-base text-zinc-950 dark:text-white leading-none flex items-center gap-2">
                  <Eye className="h-5 w-5 text-indigo-500" />
                  Cabin Seat Layout Map
                </h3>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block mt-1.5">Physical distribution map of seats (emerald armchairs) and double-berth sleeper berths (indigo sleepers)</span>
              </div>
              {renderSeatingGrid(true)}
            </div>

          </div>

          {/* Right sidebar: Image previews, assigned route details, active trip status */}
          <div className="flex flex-col gap-6 w-full">
            
            {/* Bus Pictures uploader previews */}
            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] flex flex-col gap-4.5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] w-full">
              <h3 className="font-extrabold text-base text-zinc-950 dark:text-white leading-none">Vehicle Photos</h3>
              
              {bus.images && bus.images.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl overflow-hidden border border-zinc-200/50 dark:border-zinc-855 aspect-video shadow-sm">
                    <img 
                      src={bus.images[activeImageIndex] || bus.images[0]} 
                      alt="Bus preview main" 
                      className="w-full h-full object-cover transition-all duration-305" 
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {bus.images.map((url: string, index: number) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={`rounded-xl overflow-hidden aspect-video border transition-all cursor-pointer ${
                          activeImageIndex === index
                            ? 'border-[#ff2d88] ring-2 ring-[#ff2d88]/20 scale-95 shadow-sm'
                            : 'border-zinc-200/50 dark:border-zinc-850 hover:border-zinc-400'
                        }`}
                      >
                        <img src={url} alt={`Preview thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center bg-zinc-50/50 dark:bg-zinc-950/10">
                  <div className="h-12 w-12 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-400 mb-3 border border-zinc-150 dark:border-zinc-850">
                    <Bus className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">No photos registered</h4>
                  <span className="text-[10px] text-zinc-400 font-bold block mt-1.5">Edit this vehicle to add fleet previews.</span>
                </div>
              )}
            </div>

            {/* Assigned Route Template Info */}
            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] flex flex-col gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.01)] w-full">
              <h3 className="font-extrabold text-base text-zinc-950 dark:text-white leading-none">Assigned Path Details</h3>
              {(() => {
                const targetRoute = bus.route || routes.find(r => (r.id || r._id) === bus.routeId);
                if (!targetRoute) {
                  return (
                    <span className="text-xs text-zinc-400 font-semibold italic mt-1 leading-normal pl-0.5">
                      No operational route has been mapped to this vehicle yet. Update vehicle config to assign routes.
                    </span>
                  );
                }
                return (
                  <div className="flex flex-col gap-3.5 mt-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-zinc-800 dark:text-zinc-200">
                      <span>{targetRoute.source}</span>
                      <span className="text-zinc-400 font-normal">➔</span>
                      <span>{targetRoute.destination}</span>
                    </div>
                    {targetRoute.stops && targetRoute.stops.length > 0 && (
                      <div className="flex flex-col gap-1.5 border-t border-zinc-150 dark:border-zinc-850 pt-3">
                        <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest pl-0.5">Route Stops:</span>
                        <div className="flex flex-wrap gap-1 mt-1 leading-normal">
                          {targetRoute.stops.map((stop: any, idx: number) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <span className="text-zinc-400 text-[10px] self-center">➔</span>}
                              <span className="bg-zinc-50 dark:bg-zinc-950/20 px-2 py-0.5 rounded border border-zinc-200/40 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">{stop.stopName}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

          </div>

        </div>
      ) : (
        
        // EDIT MODE REGISTER FORM
        <form onSubmit={handleSaveChanges} className="flex flex-col gap-6 select-none">
          
          {/* Section 1: Basic Information */}
          <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center font-black text-sm shrink-0">
                1
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-950 dark:text-white leading-none">Edit Basic Bus Information</h3>
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
                  onChange={(e) => handleTypeChange(e.target.value)}
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
                      <option value="" disabled>Select an Operations Route</option>
                      {routes.map((r) => (
                        <option key={r.id || r._id} value={r.id || r._id} className="bg-white dark:bg-zinc-900 font-semibold">
                          {r.source} ➔ {r.destination} ({r.stops?.length || 0} stops)
                        </option>
                      ))}
                    </select>

                    {/* Dynamic Route Stops Preview */}
                    {(() => {
                      const selectedRoute = routes.find(r => (r.id || r._id) === routeId);
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

          {/* Section 2: Seating & Capacity */}
          <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center font-black text-sm shrink-0">
                2
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-950 dark:text-white leading-none">Edit Seating Layout & Capacity</h3>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block mt-1">Configure columns, grid boundaries, and select onboard amenities</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
              
              {/* Grid dimensions inputs */}
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

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-800/40 rounded-2xl flex gap-3 text-xs leading-normal select-none">
                  <Layers className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5 text-zinc-500">
                    <span className="font-extrabold text-zinc-700 dark:text-zinc-300">Layout Verification Bounds:</span>
                    <span>Currently configured: <strong>{rows} rows × {cols} columns</strong> = accommodating up to <strong>{rows * cols}</strong> seat coordinates (Required total capacity: <strong>{capacity}</strong>).</span>
                  </div>
                </div>

                {/* Amenities editing */}
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

              {/* Seating edit configurator map */}
              <div className="flex flex-col gap-3">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-1">
                  Interactive Seating Visualizer
                </label>
                {renderSeatingGrid(false)}
              </div>

            </div>
          </div>

          {/* Section 3: Bus Images */}
          <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center font-black text-sm shrink-0">
                3
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-950 dark:text-white leading-none">Vehicle Photos</h3>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block mt-1">Manage existing pictures or upload new ones (Max 5 images total)</span>
              </div>
            </div>

            <div className="flex flex-col gap-5 mt-2">
              
              {/* Existing Images list showing trash toggle overlay */}
              {existingImages.length > 0 && (
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-1">
                    Existing Vehicle Images
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {existingImages.map((url, idx) => {
                      const isMarkedDelete = deleteImages.includes(url);
                      return (
                        <div key={idx} className={`relative rounded-2xl overflow-hidden aspect-video border group shadow-sm transition-all duration-200 ${
                          isMarkedDelete ? 'border-rose-500 opacity-40 scale-95' : 'border-zinc-200/50 dark:border-zinc-800'
                        }`}>
                          <img src={url} alt={`Existing bus ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => toggleExistingImageDelete(url)}
                            className={`absolute inset-0 flex items-center justify-center text-white transition-opacity duration-150 cursor-pointer ${
                              isMarkedDelete ? 'bg-rose-950/70 opacity-100' : 'bg-black/60 opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <Trash2 className={`h-5 w-5 ${isMarkedDelete ? 'text-rose-400' : 'hover:text-rose-400'}`} />
                          </button>
                          {isMarkedDelete && (
                            <span className="absolute bottom-1 right-2 text-[8px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shadow">
                              Delete
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload new images drag-drop area */}
              <div className="flex flex-col gap-3 border-t border-zinc-150 dark:border-zinc-850 pt-5">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider pl-1">
                  Upload New Pictures
                </label>
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
              </div>

              {/* Uploaded new image previews */}
              {newImagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {newImagePreviews.map((url, index) => (
                    <div key={index} className="relative rounded-2xl overflow-hidden aspect-video border border-zinc-200/50 dark:border-zinc-800 group shadow-sm">
                      <img 
                        src={url} 
                        alt={`New upload preview ${index + 1}`}
                        className="w-full h-full object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
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

          {/* Form editing save controls */}
          <div className="flex items-center justify-between gap-4 mt-2">
            <button
              type="button"
              onClick={handleCancelEditing}
              className="px-6 py-3.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-extrabold text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel Edit
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
                  Saving Updates...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                  Save Vehicle Updates
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
