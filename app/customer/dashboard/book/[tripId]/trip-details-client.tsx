'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  Armchair,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { holdSeat, releaseSeat } from '@/app/actions/seat';

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

  // Dynamic Image gallery state
  const busImages = [
    '/images/bus-hero.jpg',
    '/images/bus1.jpg',
    '/images/bus2.jpg',
  ];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Authentication & Layout states
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [busDetails, setBusDetails] = useState<any | null>(null);
  const [occupiedSeats, setOccupiedSeats] = useState<Record<string, { status: string; heldBy?: string; heldUntil?: string; fromSequence: number; toSequence: number }>>({});
  const [loadingLayout, setLoadingLayout] = useState(true);

  // Selection states
  const [boardingStop, setBoardingStop] = useState<Stop>(tripDetails.stops[0]);
  const [droppingStop, setDroppingStop] = useState<Stop>(tripDetails.stops[tripDetails.stops.length - 1]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [activeDeck, setActiveDeck] = useState<'lower' | 'upper'>('lower');
  const [passengerDetails, setPassengerDetails] = useState<Record<string, { name: string; age: string; gender: string }>>({});

  // WebSocket connection state
  const [socket, setSocket] = useState<Socket | null>(null);

  // Hold Timer state
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Booking / Order State
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Refs for cleanup safety
  const selectedSeatsRef = useRef<string[]>([]);
  const isBookingConfirmedRef = useRef(false);

  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [selectedSeats]);

  // Load Razorpay Script & Auth status on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Fetch profile
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (json.success && json.data) {
          setCurrentUser(json.data);
        }
      } catch (err) {
        console.error('[Client Profile Fetch Error]:', err);
      }
    };

    fetchUser();

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch occupied seats and layout on load
  const fetchLayoutAndOccupancy = async () => {
    setLoadingLayout(true);
    try {
      const res = await fetch(`/api/trips/${tripDetails.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setBusDetails(json.data.bus);
        setOccupiedSeats(json.data.occupiedSeats || {});
      } else {
        toast.error('Failed to load seating configuration details.');
      }
    } catch (err) {
      console.error('[Fetch Seating Layout Error]:', err);
      toast.error('Error fetching seating map layout.');
    } finally {
      setLoadingLayout(false);
    }
  };

  useEffect(() => {
    fetchLayoutAndOccupancy();
  }, [tripDetails.id]);

  // WebSocket room setup
  useEffect(() => {
    const socketInstance = io(window.location.origin, {
      transports: ['websocket'],
    });

    setSocket(socketInstance);

    // Join specialized Room
    socketInstance.emit('join-trip', tripDetails.id);
    console.log(`[WebSocket] Connected and joined room: ${tripDetails.id}`);

    // Clean up
    return () => {
      socketInstance.emit('leave-trip', tripDetails.id);
      socketInstance.disconnect();
      console.log(`[WebSocket] Disconnected and left room.`);
    };
  }, [tripDetails.id]);

  // WebSocket listeners for real-time synchronization
  useEffect(() => {
    if (!socket) return;

    socket.on('seat:held', (data: { seatNo: string; heldBy: string; fromSequence: number; toSequence: number }) => {
      console.log('[WebSocket] seat:held received:', data);
      setOccupiedSeats(prev => ({
        ...prev,
        [data.seatNo]: {
          status: 'HELD',
          heldBy: data.heldBy,
          fromSequence: data.fromSequence,
          toSequence: data.toSequence
        }
      }));
    });

    socket.on('seat:released', (data: { seatNo: string; fromSequence: number; toSequence: number }) => {
      console.log('[WebSocket] seat:released received:', data);
      setOccupiedSeats(prev => {
        const next = { ...prev };
        // Delete this hold only if it matches sequence segments
        if (next[data.seatNo]?.status === 'HELD' && next[data.seatNo]?.fromSequence === data.fromSequence) {
          delete next[data.seatNo];
        }
        return next;
      });
    });

    socket.on('seat:booked', (data: { seatNumbers: string[] }) => {
      console.log('[WebSocket] seat:booked received:', data);
      setOccupiedSeats(prev => {
        const next = { ...prev };
        data.seatNumbers.forEach(seatNo => {
          next[seatNo] = {
            status: 'BOOKED',
            fromSequence: boardingStop.sequence,
            toSequence: droppingStop.sequence
          };
        });
        return next;
      });
    });

    return () => {
      socket.off('seat:held');
      socket.off('seat:released');
      socket.off('seat:booked');
    };
  }, [socket, boardingStop.sequence, droppingStop.sequence]);

  // Release held seats on unmount to prevent stale database locks
  const currentUserId = currentUser?.id;
  const boardingName = boardingStop?.stopName;
  const droppingName = droppingStop?.stopName;

  useEffect(() => {
    return () => {
      const currentSelected = selectedSeatsRef.current;
      if (
        currentSelected.length > 0 &&
        currentUserId &&
        boardingName &&
        droppingName &&
        !isBookingConfirmedRef.current
      ) {
        console.log('[Cleanup] Releasing held seats:', currentSelected);
        currentSelected.forEach(seatNo => {
          releaseSeat(tripDetails.id, seatNo, currentUserId, boardingName, droppingName);
        });
      }
    };
  }, [currentUserId, boardingName, droppingName, tripDetails.id]);

  // Handle seat timer countdown
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setTimeLeft(0);
      return;
    }

    // Set hold expiry to 5 minutes
    setTimeLeft(300);

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.warning('Seat reservation holds have expired and been released.', {
            duration: 5000
          });
          setSelectedSeats([]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSeats]);

  // Dynamic Passenger Spec updates
  useEffect(() => {
    setPassengerDetails(prev => {
      const next = { ...prev };
      selectedSeats.forEach(seat => {
        if (!next[seat]) {
          next[seat] = { name: '', age: '', gender: 'Male' };
        }
      });
      Object.keys(next).forEach(seat => {
        if (!selectedSeats.includes(seat)) {
          delete next[seat];
        }
      });
      return next;
    });
  }, [selectedSeats]);

  // Stop Selection Handlers
  const handleBoardingChange = (stopName: string) => {
    const stop = tripDetails.stops.find((s: any) => s.stopName === stopName);
    if (!stop) return;
    
    // Clear holds if stop sequence changes
    if (selectedSeats.length > 0 && currentUser) {
      selectedSeats.forEach(seatNo => {
        releaseSeat(tripDetails.id, seatNo, currentUser.id, boardingStop.stopName, droppingStop.stopName);
      });
      setSelectedSeats([]);
    }

    setBoardingStop(stop);

    // Enforce sequence logic
    if (droppingStop && droppingStop.sequence <= stop.sequence) {
      const nextStop = tripDetails.stops.find((s: any) => s.sequence === stop.sequence + 1);
      setDroppingStop(nextStop || tripDetails.stops[tripDetails.stops.length - 1]);
    }
  };

  const handleDroppingChange = (stopName: string) => {
    const stop = tripDetails.stops.find((s: any) => s.stopName === stopName);
    if (!stop) return;
    
    // Clear holds if stop sequence changes
    if (selectedSeats.length > 0 && currentUser) {
      selectedSeats.forEach(seatNo => {
        releaseSeat(tripDetails.id, seatNo, currentUser.id, boardingStop.stopName, droppingStop.stopName);
      });
      setSelectedSeats([]);
    }

    setDroppingStop(stop);
  };

  // dynamic segment fare calculator
  const getSelectedSegmentFare = () => {
    if (!boardingStop || !droppingStop) return tripDetails.fare;
    let fareSum = 0;
    tripDetails.stops.forEach((stop: any) => {
      if (stop.sequence > boardingStop.sequence && stop.sequence <= droppingStop.sequence) {
        fareSum += stop.fareFromPrev;
      }
    });
    return fareSum === 0 ? tripDetails.fare : fareSum;
  };

  const segmentFare = getSelectedSegmentFare();
  const totalPrice = segmentFare * selectedSeats.length;

  const offerPercentage = tripDetails.offerPercentage || 0;
  const offerLimit = tripDetails.offerLimit || 0;
  const offerBookedCount = tripDetails.offerBookedCount || 0;
  const remainingOfferSeats = Math.max(0, offerLimit - offerBookedCount);

  const discountedSeatsCount = offerPercentage > 0 && remainingOfferSeats > 0
    ? Math.min(selectedSeats.length, remainingOfferSeats)
    : 0;

  const discountAmount = discountedSeatsCount > 0
    ? Math.round(segmentFare * (offerPercentage / 100) * discountedSeatsCount)
    : 0;

  const finalPrice = totalPrice - discountAmount;

  const isBookingAllowed = tripDetails.status === 'SCHEDULED' || tripDetails.status === 'BOARDING';

  // Check overlap helper for client-side rendering
  const getSeatBlockStatus = (seatNo: string) => {
    const seatState = occupiedSeats[seatNo];
    if (!seatState) return null;

    const fromSeq = boardingStop.sequence;
    const toSeq = droppingStop.sequence;

    const overlap = seatState.fromSequence < toSeq && seatState.toSequence > fromSeq;

    if (seatState.status === 'BOOKED' && overlap) {
      return 'BOOKED';
    }

    if (seatState.status === 'HELD' && overlap) {
      const isExpired = seatState.heldUntil && new Date(seatState.heldUntil).getTime() < Date.now();
      if (!isExpired) {
        return seatState.heldBy === currentUser?.id ? 'SELECTED' : 'HELD';
      }
    }

    return null;
  };

  // Seat Click Actions
  const handleSeatClick = async (seatNo: string) => {
    if (!currentUser) {
      toast.error('Authentication required. Please sign in to purchase tickets.');
      router.push('/login');
      return;
    }

    if (!isBookingAllowed) {
      toast.error('Ticket purchasing is closed for this trip.');
      return;
    }

    const currentStatus = getSeatBlockStatus(seatNo);

    if (currentStatus === 'SELECTED' || selectedSeats.includes(seatNo)) {
      // Release Hold
      const toastId = toast.loading(`Removing lock for seat ${seatNo}...`);
      try {
        const res = await releaseSeat(
          tripDetails.id,
          seatNo,
          currentUser.id,
          boardingStop.stopName,
          droppingStop.stopName
        );
        if (res.success) {
          setSelectedSeats(prev => prev.filter(s => s !== seatNo));
          toast.success(`Seat ${seatNo} hold removed successfully.`, { id: toastId });
        } else {
          toast.error(res.message || 'Unable to release hold.', { id: toastId });
        }
      } catch (err) {
        toast.error('Network failure releasing hold.', { id: toastId });
      }
    } else if (currentStatus === null) {
      // Acquire Hold
      const toastId = toast.loading(`Requesting 5-minute hold on seat ${seatNo}...`);
      try {
        const res = await holdSeat(
          tripDetails.id,
          seatNo,
          currentUser.id,
          boardingStop.stopName,
          droppingStop.stopName
        );
        if (res.success) {
          setSelectedSeats(prev => [...prev, seatNo]);
          toast.success(`Seat ${seatNo} secured for 5 minutes!`, { id: toastId });
        } else {
          toast.error(res.message || 'Seat is no longer available.', { id: toastId });
        }
      } catch (err) {
        toast.error('Network connection timeout locking seat.', { id: toastId });
      }
    }
  };

  // Seat layout seat names helper
  const getSeatName = (r: number, colLetter: string, deck: 'lower' | 'upper') => {
    const isSleeperBus = busDetails?.sleeperSeats && busDetails.sleeperSeats.length > 0;
    if (isSleeperBus) {
      const prefix = deck === 'lower' ? 'L-' : 'U-';
      return `${prefix}${r}${colLetter}`;
    }
    return `${r}${colLetter}`;
  };

  // Initiate Booking Action
  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) {
      toast.error('Please pick at least one seat before proceeding.');
      return;
    }

    // Validate details
    for (const seat of selectedSeats) {
      const details = passengerDetails[seat];
      if (!details || !details.name.trim() || !details.age.trim()) {
        toast.error(`Please complete name and age details for seat ${seat}.`);
        return;
      }
    }

    setShowCheckoutModal(true);
  };

  const handleBookingSubmit = async () => {
    setBookingLoading(true);
    const toastId = toast.loading('Creating transaction booking record...');

    try {
      const payload = {
        tripId: tripDetails.id,
        seatNumbers: selectedSeats,
        fromStop: boardingStop.stopName,
        toStop: droppingStop.stopName,
        passengerDetails: selectedSeats.map(seat => ({
          seatNumber: seat,
          name: passengerDetails[seat].name,
          age: parseInt(passengerDetails[seat].age, 10),
          gender: passengerDetails[seat].gender
        }))
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success && json.data) {
        toast.success('Order successfully created.', { id: toastId });
        setActiveBooking(json.data);
      } else {
        toast.error(json.message || 'Failed to initialize checkout.', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Network failure connecting to booking APIs.', { id: toastId });
    } finally {
      setBookingLoading(false);
    }
  };

  // Confirm booking success & redirect
  const handleSuccessRedirect = () => {
    isBookingConfirmedRef.current = true;
    toast.success('Tickets confirmed! Redirecting to dashboard...');
    setSelectedSeats([]);
    setTimeout(() => {
      router.push('/customer/dashboard');
    }, 2000);
  };

  // Sandbox Developer Simulator Trigger
  const handleSandboxSimulate = async () => {
    if (!activeBooking) return;
    const toastId = toast.loading('Simulating webhook payment confirmation callback...');
    try {
      const res = await fetch('/api/webhooks/razorpay/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: activeBooking.bookingId })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Mock payment verified successfully.', { id: toastId });
        handleSuccessRedirect();
      } else {
        toast.error(json.message || 'Simulation validation failed.', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to trigger mock simulator.', { id: toastId });
    }
  };

  // Live Razorpay trigger
  const handleRazorpayLiveCheckout = () => {
    if (!activeBooking || !window.Razorpay) {
      toast.error('Razorpay SDK could not be loaded.');
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_key_placeholder',
      amount: activeBooking.amount * 100,
      currency: 'INR',
      name: 'SeatPlus bookings',
      description: `Seats selection reservation for operator ${tripDetails.operatorName}`,
      order_id: activeBooking.razorpayOrderId,
      handler: function (response: any) {
        console.log('[Razorpay Callback response]:', response);
        handleSuccessRedirect();
      },
      prefill: {
        name: activeBooking.passengerName || '',
        email: activeBooking.passengerEmail || '',
      },
      theme: {
        color: '#ff2d88',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Render Seating grid helper
  const renderSeatingGrid = () => {
    if (loadingLayout) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-zinc-450 gap-4">
          <RefreshCw className="h-9 w-9 animate-spin text-[#ff2d88]" />
          <span className="text-xs font-black uppercase tracking-wider">Loading Layout map...</span>
        </div>
      );
    }

    if (!busDetails) {
      return (
        <div className="p-10 border border-zinc-250/60 dark:border-zinc-800/80 rounded-[32px] bg-white dark:bg-zinc-900 text-center text-xs font-bold text-red-500">
          Seating layout configuration not loaded.
        </div>
      );
    }

    const { rows, cols, sleeperSeats = [] } = busDetails;
    const colLetters = Array.from({ length: cols }, (_, i) => String.fromCharCode(65 + i));
    const aisleIndex = Math.floor(cols / 2);
    const isSleeperBus = sleeperSeats.length > 0;

    const gridRows = [];

    for (let r = 1; r <= rows; r++) {
      const rowElements = [];
      for (let c = 0; c < cols; c++) {
        // Insert Aisle spacer
        if (c === aisleIndex && cols > 2) {
          rowElements.push(
            <div key={`aisle-${r}-${c}`} className="w-10 h-10 flex items-center justify-center text-[9px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase select-none">
              Aisle
            </div>
          );
        }

        const seatName = getSeatName(r, colLetters[c], activeDeck);
        const isSleeper = sleeperSeats.includes(seatName);

        // Get seat status
        const status = getSeatBlockStatus(seatName); // 'BOOKED' | 'HELD' | 'SELECTED' | null

        let bgClass = 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-355 hover:bg-zinc-100 hover:border-zinc-300';
        let iconColor = 'text-zinc-400';
        let disabled = false;

        if (status === 'BOOKED') {
          bgClass = 'bg-red-500/10 border-red-500/20 text-red-500 cursor-not-allowed';
          iconColor = 'text-red-500';
          disabled = true;
        } else if (status === 'HELD') {
          bgClass = 'bg-amber-500/10 border-amber-500/20 text-amber-500 cursor-not-allowed';
          iconColor = 'text-amber-500';
          disabled = true;
        } else if (status === 'SELECTED') {
          bgClass = 'bg-gradient-to-br from-[#ff7c52] to-[#ff2d88] border-[#ff2d88] text-white shadow-lg shadow-[#ff2d88]/20 hover:opacity-95';
          iconColor = 'text-white';
        }

        rowElements.push(
          <button
            key={seatName}
            type="button"
            disabled={disabled || !isBookingAllowed}
            onClick={() => handleSeatClick(seatName)}
            className={`relative rounded-xl border flex flex-col items-center justify-center font-black text-[10px] sm:text-xs shadow-sm transition-all duration-200 cursor-pointer ${
              isSleeper ? 'w-10 h-16' : 'w-10 h-10'
            } ${bgClass}`}
          >
            {isSleeper ? (
              <div className="absolute top-1.5 right-1.5 w-1 h-3 rounded-full bg-current opacity-40" />
            ) : (
              <Armchair className={`h-3.5 w-3.5 ${iconColor} mb-0.5`} />
            )}
            <span>{seatName}</span>
          </button>
        );
      }

      gridRows.push(
        <div key={`row-${r}`} className="flex items-center gap-3 justify-center">
          <span className="w-8 text-right text-[9px] text-zinc-400 font-extrabold uppercase select-none">Row {r}</span>
          {rowElements}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {/* Sleeper deck toggle selector */}
        {isSleeperBus && (
          <div className="flex items-center gap-2 justify-center bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-850">
            <button
              type="button"
              onClick={() => setActiveDeck('lower')}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                activeDeck === 'lower'
                  ? 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Lower Deck
            </button>
            <button
              type="button"
              onClick={() => setActiveDeck('upper')}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                activeDeck === 'upper'
                  ? 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Upper Deck
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3.5 p-6 bg-zinc-50 dark:bg-zinc-950/40 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 max-h-[420px] overflow-y-auto w-full">
          <div className="flex items-center justify-between border-b border-zinc-250 dark:border-zinc-800 pb-3 mb-2 px-2">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">CABIN FRONT / STEERING</span>
            <span className="text-[10px] text-zinc-455 font-black uppercase tracking-wider">Driver Cabin</span>
          </div>
          <div className="flex flex-col gap-3.5">
            {gridRows}
          </div>
        </div>
      </div>
    );
  };

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

  // Helper to get travel duration
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
          <span className="text-zinc-600 dark:text-zinc-300 font-extrabold font-mono">Trip Details</span>
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
                <span>•</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  isBookingAllowed 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {tripDetails.status}
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

          {/* B. ROUTE BOARDING & DROPPING POINT SELECTORS */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col gap-5">
            <div>
              <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#ff2d88]" />
                Select Journey Stops
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold mt-1">
                Customize your boarding and dropping points on this trip. Fares adjust dynamically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Boarding Point Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">Boarding Point</label>
                <select
                  disabled={!isBookingAllowed}
                  value={boardingStop?.stopName || ''}
                  onChange={(e) => handleBoardingChange(e.target.value)}
                  className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-855 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-[#ff2d88] transition-colors text-zinc-800 dark:text-white"
                >
                  {tripDetails.stops.slice(0, -1).map((stop: Stop) => (
                    <option key={stop.stopName} value={stop.stopName}>
                      {stop.stopName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropping Point Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">Dropping Point</label>
                <select
                  disabled={!isBookingAllowed}
                  value={droppingStop?.stopName || ''}
                  onChange={(e) => handleDroppingChange(e.target.value)}
                  className="p-3 bg-zinc-50 dark:bg-zinc-955/60 border border-zinc-200 dark:border-zinc-855 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-[#ff2d88] transition-colors text-zinc-800 dark:text-white"
                >
                  {tripDetails.stops
                    .filter((stop: Stop) => !boardingStop || stop.sequence > boardingStop.sequence)
                    .map((stop: Stop) => (
                      <option key={stop.stopName} value={stop.stopName}>
                        {stop.stopName}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* C. SEAT MAP SELECTOR */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">Select Seats</h2>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold mt-1">
                  Choose your preferred seat from the cabin layout
                </p>
              </div>
              
              {/* Hold expiration visual */}
              {timeLeft > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-wider rounded-xl select-none animate-pulse">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Holds expire in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>

            {/* Trip Over / Not allowed Warning banner */}
            {!isBookingAllowed && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500 font-bold select-none">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <span>Ticket booking is closed because this trip has departed, arrived, or been cancelled.</span>
              </div>
            )}

            {/* Layout render */}
            {renderSeatingGrid()}

            {/* Layout legend */}
            <div className="flex flex-wrap items-center justify-center gap-5 border-t border-zinc-150 dark:border-zinc-800 pt-4 text-[10px] font-black uppercase tracking-widest text-zinc-450 select-none">
              <div className="flex items-center gap-2">
                <div className="h-4.5 w-4.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 rounded-md" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4.5 w-4.5 border border-[#ff2d88] bg-gradient-to-br from-[#ff7c52] to-[#ff2d88] rounded-md shadow-sm" />
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4.5 w-4.5 border border-amber-500/25 bg-amber-500/10 rounded-md" />
                <span>Held</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4.5 w-4.5 border border-red-500/25 bg-red-500/10 rounded-md" />
                <span>Booked</span>
              </div>
            </div>
          </div>

          {/* D. PASSENGER DETAILS FORM PANEL */}
          {selectedSeats.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col gap-5">
              <div>
                <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">Passenger Details</h2>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold mt-1">
                  Provide boarding pass information for each locked seat below
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {selectedSeats.map(seat => (
                  <div key={seat} className="p-4 border border-zinc-150/40 dark:border-zinc-800/80 rounded-2xl bg-zinc-50/20 dark:bg-zinc-900/10 flex flex-col gap-3">
                    <span className="text-xs font-black text-zinc-950 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#ff2d88]" />
                      Seat {seat} Details
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={passengerDetails[seat]?.name || ''}
                        onChange={e => setPassengerDetails(prev => ({
                          ...prev,
                          [seat]: { ...prev[seat], name: e.target.value }
                        }))}
                        className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-[#ff2d88] text-zinc-900 dark:text-white"
                      />
                      <input
                        type="number"
                        placeholder="Age"
                        value={passengerDetails[seat]?.age || ''}
                        onChange={e => setPassengerDetails(prev => ({
                          ...prev,
                          [seat]: { ...prev[seat], age: e.target.value }
                        }))}
                        className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-[#ff2d88] text-zinc-900 dark:text-white"
                      />
                      <select
                        value={passengerDetails[seat]?.gender || 'Male'}
                        onChange={e => setPassengerDetails(prev => ({
                          ...prev,
                          [seat]: { ...prev[seat], gender: e.target.value }
                        }))}
                        className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-[#ff2d88] text-zinc-900 dark:text-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* E. DYNAMIC IMAGE GALLERY */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[32px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col gap-4">
            <div className="relative h-60 sm:h-80 md:h-[400px] w-full rounded-2xl overflow-hidden border border-zinc-150 dark:border-zinc-850 shadow-sm select-none">
              <img 
                src={busImages[activeImageIndex]} 
                alt="Bus showcase"
                className="h-full w-full object-cover transition-all duration-300"
              />
              <div className="absolute bottom-4 left-4 p-3 bg-zinc-950/70 border border-white/10 backdrop-blur-md text-white rounded-2xl flex flex-col">
                <span className="text-xs font-black tracking-wide">{tripDetails.operatorName}</span>
                <span className="text-[10px] text-zinc-350 font-bold mt-1 uppercase tracking-widest leading-none">{tripDetails.busType}</span>
              </div>
            </div>

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

          {/* F. TIMELINE */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col gap-6">
            <div>
              <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">Route Stops & Timings</h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold mt-1">
                Detailed timeline of departure, intermediate stops, and arrival
              </p>
            </div>

            <div className="relative pl-6 flex flex-col gap-6 ml-3 select-none">
              <div className="absolute left-[7.5px] top-2 bottom-2 w-[3px] bg-gradient-to-b from-[#ff7c52] to-[#ff2d88] dark:opacity-80 rounded-full" />
              {tripDetails.stops.map((stop: Stop, idx: number) => {
                const isFirst = idx === 0;
                const isLast = idx === tripDetails.stops.length - 1;

                return (
                  <div key={idx} className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className={`absolute left-[-24px] top-1.5 h-4 w-4 rounded-full border-2 bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm z-10 ${
                      isFirst 
                        ? 'border-emerald-500 bg-emerald-500' 
                        : (isLast ? 'border-[#ff2d88] bg-[#ff2d88]' : 'border-zinc-350 bg-white')
                    }`}>
                      {(isFirst || isLast) && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>

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

          {/* G. AMENITIES GRID */}
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

        </div>

        {/* Right Column: Sticky Booking Card (spans 4 columns on desktop) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 flex flex-col gap-6">
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-255/60 dark:border-zinc-800/80 rounded-[32px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.3)] flex flex-col gap-6">
            
            {/* Header: Pricing dynamic summary */}
            <div>
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-extrabold font-mono">Total Fare Details</span>
              <div className="flex items-baseline gap-0.5 mt-2">
                <span className="text-sm font-black text-zinc-450 font-mono">₹</span>
                <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-none font-mono">
                  {selectedSeats.length > 0 ? finalPrice : segmentFare}
                </span>
                <span className="text-[11px] text-zinc-400 font-bold ml-1 font-mono">
                  {selectedSeats.length > 0 ? `for ${selectedSeats.length} seats` : '/ seat fare'}
                </span>
              </div>

              {/* Offer Info Tag */}
              {offerPercentage > 0 && remainingOfferSeats > 0 && (
                <div className="mt-2.5 bg-rose-500/10 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400 px-3 py-1.5 rounded-xl border border-rose-500/10 text-[10px] font-black uppercase flex items-center justify-between">
                  <span>{offerPercentage}% OFF Promo Applied!</span>
                  <span>{remainingOfferSeats} seats remaining</span>
                </div>
              )}
            </div>

            <div className="h-px bg-zinc-150/50 dark:bg-zinc-800/50 w-full" />

            {/* Travel Summary Highlights */}
            <div className="flex flex-col gap-3.5">
              
              {/* Chosen route segment */}
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-zinc-450 dark:text-zinc-500 font-bold">Selected Boarding Stop</span>
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                  {boardingStop?.stopName || 'Not Selected'}
                </span>
              </div>

              <div className="flex flex-col gap-1 text-xs">
                <span className="text-zinc-450 dark:text-zinc-500 font-bold">Selected Dropping Stop</span>
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                  {droppingStop?.stopName || 'Not Selected'}
                </span>
              </div>

              <div className="h-px bg-zinc-100 dark:bg-zinc-800/60 w-full" />

              {/* Date */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-450 dark:text-zinc-500">Departure Date</span>
                <span className="font-extrabold text-zinc-855 dark:text-zinc-150">
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

              {/* Seats list */}
              {selectedSeats.length > 0 && (
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-450 dark:text-zinc-500">Locked Seats</span>
                  <span className="font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/10 font-mono">
                    {selectedSeats.join(', ')}
                  </span>
                </div>
              )}

              {/* Offer savings details */}
              {discountAmount > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-450 dark:text-zinc-500">Base Amount</span>
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 font-mono">
                      ₹{totalPrice}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-rose-500 font-bold">Offer Discount ({discountedSeatsCount} seat{discountedSeatsCount > 1 ? 's' : ''})</span>
                    <span className="font-black text-rose-500 font-mono">
                      -₹{discountAmount}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Proceed to checkout Action button */}
            <button
              onClick={handleProceedToCheckout}
              disabled={selectedSeats.length === 0 || !isBookingAllowed}
              className="w-full py-3.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:opacity-95 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-[#ff2d88]/20 transform active:scale-[0.98] transition-all cursor-pointer outline-none text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Proceed to Book
            </button>

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

      {/* Modern Checkout modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-6 max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setShowCheckoutModal(false);
                  setActiveBooking(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">Confirm Booking Details</h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold mt-1 font-mono">
                    Review and finalize payment to reserve your seat
                  </p>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-2xl border border-zinc-150 dark:border-zinc-850 text-xs font-bold font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-450">Route Segment</span>
                    <span className="text-zinc-800 dark:text-zinc-200">{boardingStop.stopName} → {droppingStop.stopName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-450">Reserved Seats</span>
                    <span className="text-[#ff2d88]">{selectedSeats.join(', ')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-zinc-450">Base Amount</span>
                        <span className="text-zinc-800 dark:text-zinc-200">₹{totalPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-500 font-bold">Offer Savings</span>
                        <span className="text-rose-500">-₹{discountAmount}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3">
                    <span className="text-zinc-450 text-sm font-mono font-bold">Amount Due</span>
                    <span className="text-base font-black text-zinc-900 dark:text-white font-mono">₹{finalPrice}</span>
                  </div>
                </div>

                {!activeBooking ? (
                  <button
                    onClick={handleBookingSubmit}
                    disabled={bookingLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {bookingLoading ? 'Initializing checkout order...' : 'Confirm Order & Proceed'}
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 pt-2">
                    <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono text-center">Payment Integration Options</span>
                    
                    {/* Live checkout action */}
                    <button
                      onClick={handleRazorpayLiveCheckout}
                      className="w-full py-3 bg-[#ff2d88] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md cursor-pointer hover:opacity-95 transition-opacity"
                    >
                      Pay via Razorpay Gateway
                    </button>

                    {/* Developer Mock sandbox option */}
                    <button
                      onClick={handleSandboxSimulate}
                      className="w-full py-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-350 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      Developer Sandbox Simulate Payment
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
