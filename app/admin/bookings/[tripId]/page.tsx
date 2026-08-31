'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRight,
  Bus, 
  MapPin, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Clock, 
  Tag, 
  Users, 
  TrendingUp, 
  Search, 
  Copy, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Info,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface PassengerDetails {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
}

interface BookingManifestItem {
  id: string;
  seatNumbers: string[];
  amount: number;
  status: 'PENDING' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'PAYMENT_FAILED' | 'CANCELLED';
  createdAt: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  fromStop: string;
  toStop: string;
  passengerDetails: PassengerDetails | null;
}

interface RouteStop {
  stopName: string;
  sequence: number;
  fareFromPreviousStop: number;
  arrivalOffsetMinutes: number;
}

interface TripDetails {
  id: string;
  busNumber: string;
  busType: string;
  source: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
  status: string;
  capacity: number;
  seatsBooked: number;
  seatsAvailable: number;
  totalEarnings: number;
  operatorDetails: PassengerDetails | null;
  busImages?: string[];
  routeStops: RouteStop[];
}

export default function TripDetailPage({ params }: { params: Promise<{ tripId: string }> }) {
  const router = useRouter();
  
  // Resolve params using React.use
  const { tripId } = React.use(params);

  // States
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [bookings, setBookings] = useState<BookingManifestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState('');

  const fetchTripManifest = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/bookings/${tripId}`);
      const resData = await response.json();
      
      if (!resData.success) {
        throw new Error(resData.message || 'Failed to fetch trip manifest details.');
      }
      
      setTrip(resData.data.trip);
      setBookings(resData.data.bookings);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve trip manifest.');
      toast.error('Failed to load manifest details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchTripManifest();
    }
  }, [tripId]);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  // Filter passengers in the manifest
  const filteredBookings = bookings.filter((b) => {
    const query = searchVal?.toLowerCase();
    const nameMatches = b.passengerDetails?.name?.toLowerCase().includes(query);
    const emailMatches = b.passengerDetails?.email?.toLowerCase().includes(query);
    const seatMatches = b.seatNumbers.some(seat => seat?.toLowerCase().includes(query));
    const pnrMatches = (b.razorpayOrderId || b.id)?.toLowerCase().includes(query);
    const stopMatches = b.fromStop?.toLowerCase()?.includes(query) || b.toStop?.toLowerCase()?.includes(query);

    return nameMatches || emailMatches || seatMatches || pnrMatches || stopMatches;
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return {
          label: 'Confirmed',
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          cls: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/50'
        };
      case 'PENDING':
      case 'PAYMENT_PENDING':
        return {
          label: 'Pending',
          icon: <Clock className="h-3.5 w-3.5" />,
          cls: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/50'
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: <XCircle className="h-3.5 w-3.5" />,
          cls: 'text-zinc-500 bg-zinc-50 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-450 dark:border-zinc-850'
        };
      default:
        return {
          label: 'Failed',
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
          cls: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/50'
        };
    }
  };

  const getTripStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ARRIVED':
        return 'text-emerald-700 bg-emerald-50 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'CANCELLED':
        return 'text-rose-750 bg-rose-50 border-rose-250 dark:bg-rose-950/20 dark:text-rose-400';
      case 'SCHEDULED':
        return 'text-indigo-700 bg-indigo-50 border-indigo-250 dark:bg-indigo-950/20 dark:text-indigo-400';
      default:
        return 'text-amber-750 bg-amber-50 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-450 dark:text-zinc-550">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-xs font-black uppercase tracking-wider">Retrieving journey manifest...</span>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex flex-col items-center py-20 gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-rose-500" />
        <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">Failed to Load Manifest</h3>
        <p className="text-xs font-semibold text-zinc-500 max-w-sm">{error || 'Trip details could not be found.'}</p>
        <Link 
          href="/admin/bookings"
          className="mt-2 py-2.5 px-5 bg-zinc-905 dark:bg-zinc-800 text-white font-bold text-xs rounded-xl hover:opacity-95"
        >
          Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/admin/bookings')}
            className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer active:scale-95 transition-all duration-200 outline-none shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Trip Manifest <Bus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </h1>
              <span className={`inline-flex px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${getTripStatusBadge(trip.status)}`}>
                {trip.status}
              </span>
            </div>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
              Admin audit sheet for operational bus scheduling.
            </p>
          </div>
        </div>

        {/* Action Row */}
        <button 
          onClick={fetchTripManifest}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 text-xs font-bold text-zinc-700 dark:text-zinc-300 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-850 select-none cursor-pointer active:scale-95 transition-all duration-200 outline-none"
        >
          <RefreshCw className="h-4 w-4 text-zinc-500" />
          Refresh List
        </button>
      </div>

      {/* BUS IMAGE BANNER */}
      {trip.busImages && trip.busImages.length > 0 && (
        <div className="relative h-48 w-full rounded-[2rem] overflow-hidden border border-zinc-200/50 dark:border-zinc-800/55 select-none shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
          <Image
            src={trip.busImages[0]}
            alt="Reserved Bus"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-y-0 left-0 p-6 flex flex-col justify-center text-white gap-1 z-10">
            <span className="text-[10px] text-zinc-350 font-black uppercase tracking-widest leading-none">Reserved Bus Plate Number</span>
            <span className="text-xl font-extrabold tracking-wider mt-1.5 block leading-none">{trip.busNumber}</span>
            <span className="text-xs font-semibold text-zinc-300 mt-1 block leading-none">{trip.busType}</span>
          </div>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        {/* Total Booked Seats */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-5 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.015)]">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider">Seats Occupied</span>
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1.5 block">
            {trip.seatsBooked} <span className="text-[11px] font-semibold text-zinc-450">/ {trip.capacity} capacity</span>
          </span>
        </div>

        {/* Seats Remaining */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-5 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.015)]">
          <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Vacancies</span>
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1.5 block">
            {trip.seatsAvailable} <span className="text-[11px] font-semibold text-zinc-450">available</span>
          </span>
        </div>

        {/* Occupancy percentage */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-5 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.015)]">
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Occupancy Ratio</span>
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1.5 block">
            {trip.capacity > 0 ? Math.round((trip.seatsBooked / trip.capacity) * 100) : 0}%
          </span>
        </div>

        {/* Total Earned Revenue */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-5 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.015)]">
          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Total Segment Revenue</span>
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1.5 block">
            ₹{trip.totalEarnings.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* TRIP DETAILS SPLIT PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (8 spans) - PASSENGER MANIFEST LIST */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-6 sm:p-8 flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.015)]">
            
            {/* Manifest Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">Passenger Manifest</h3>
                <p className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold mt-1">
                  List of travelers booked on this journey.
                </p>
              </div>

              {/* Manifest Search */}
              <div className="flex items-center gap-3 bg-zinc-100/50 dark:bg-zinc-950 border border-zinc-200/20 dark:border-zinc-800/40 px-4 py-2 rounded-2xl w-full sm:max-w-xs focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-300">
                <Search className="h-4 w-4 text-zinc-455 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search passenger, seat, PNR..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-750 dark:text-zinc-200 placeholder-zinc-400"
                />
              </div>
            </div>

            {/* Manifest Manifest Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-450 dark:text-zinc-500 font-extrabold uppercase tracking-widest select-none">
                    <th className="py-4 px-5">Seat</th>
                    <th className="py-4 px-5">Passenger Info</th>
                    <th className="py-4 px-5">Stop segment</th>
                    <th className="py-4 px-5">Paid</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Booking ID / PNR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((b) => {
                      const badge = getStatusBadge(b.status);
                      return (
                        <tr key={b.id} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-800/10 transition-colors">
                          
                          {/* Seat No */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl font-extrabold">
                              {b.seatNumbers.join(', ')}
                            </span>
                          </td>

                          {/* Passenger Info */}
                          <td className="py-4 px-5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-zinc-900 dark:text-white font-extrabold">{b.passengerDetails?.name || 'Unknown'}</span>
                              <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold leading-none">{b.passengerDetails?.phoneNumber || 'N/A'}</span>
                            </div>
                          </td>

                          {/* Stops segment */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-1">
                              <span className="truncate max-w-[80px]">{b.fromStop}</span>
                              <ArrowRight className="h-3 w-3 text-zinc-400 shrink-0" />
                              <span className="truncate max-w-[80px]">{b.toStop}</span>
                            </div>
                          </td>

                          {/* Paid amount */}
                          <td className="py-4 px-5 whitespace-nowrap font-extrabold text-zinc-900 dark:text-white">
                            ₹{b.amount}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${badge.cls}`}>
                              {badge.icon}
                              {badge.label}
                            </span>
                          </td>

                          {/* PNR Code */}
                          <td className="py-4 px-5 whitespace-nowrap font-mono select-all">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 tracking-wider">
                                {b.razorpayOrderId ? b.razorpayOrderId.substring(0, 15) : b.id.substring(0, 10).toUpperCase()}
                              </span>
                              <button 
                                onClick={() => handleCopyText(b.razorpayOrderId || b.id, 'PNR ID')}
                                className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded outline-none"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-450 dark:text-zinc-505 font-semibold">
                        No travelers found matching your manifest queries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN (4 spans) - OPERATOR & ROUTE STOP STATS */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* OPERATOR DETAILS CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.015)] relative overflow-hidden select-none">
            <div className="absolute top-[-30%] right-[-30%] w-[120px] h-[120px] bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
            
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Holding Operator</h3>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold mt-1">
                Company contacts responsible for this run.
              </p>
            </div>

            <div className="flex flex-col gap-4 font-semibold">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/15">
                  <UserIcon className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest leading-none">Operator Name</span>
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1 truncate">{trip.operatorDetails?.name || 'Unknown Operator'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/15">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest leading-none">Email Address</span>
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1 truncate select-all">{trip.operatorDetails?.email || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/15">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest leading-none">Helpline contact</span>
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1 truncate select-all">{trip.operatorDetails?.phoneNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROUTE STOPS CHECKLIST CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/55 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.015)]">
            
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Sequential Route Stops</h3>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold mt-1">
                Journey checkpoints and arrival metrics.
              </p>
            </div>

            <div className="flex flex-col gap-4 pl-2 relative border-l border-zinc-200 dark:border-zinc-800 ml-2 font-semibold select-none">
              
              {/* Start point */}
              <div className="relative pl-6">
                <div className="absolute top-1 left-[-13px] h-2.5 w-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-zinc-900 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-zinc-850 dark:text-zinc-150 leading-none">{trip.source}</span>
                  <span className="text-[9px] text-zinc-450 mt-1 block leading-none">Boarding Hub (Start Stop)</span>
                </div>
              </div>

              {/* Sequential Stops */}
              {trip.routeStops?.map((stop, i) => (
                <div key={i} className="relative pl-6">
                  <div className="absolute top-1 left-[-13px] h-2.5 w-2.5 bg-zinc-400 rounded-full border-2 border-white dark:border-zinc-900 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-250 leading-none">{stop.stopName}</span>
                    <span className="text-[9px] text-zinc-450 mt-1 block leading-none">
                      +{stop.arrivalOffsetMinutes}m arrival • Segment fare +₹{stop.fareFromPreviousStop}
                    </span>
                  </div>
                </div>
              ))}

              {/* End point */}
              <div className="relative pl-6">
                <div className="absolute top-1 left-[-13px] h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-900 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-zinc-850 dark:text-zinc-150 leading-none">{trip.destination}</span>
                  <span className="text-[9px] text-zinc-450 mt-1 block leading-none">Dropping Hub (Last Stop)</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
