import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { getAdminBusDetails } from '@/lib/admin-buses';
import { 
  ArrowLeft, 
  MapPin, 
  UserCheck, 
  Mail, 
  Phone, 
  Layers, 
  Sparkles, 
  Wifi, 
  Wind, 
  Zap, 
  Droplet, 
  Armchair, 
  Activity 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const dynamic = 'force-dynamic';

interface AdminBusDetailPageProps {
  params: Promise<{ busId: string }>;
}

export default async function AdminBusDetailPage({ params }: AdminBusDetailPageProps) {
  const { busId } = await params;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      redirect('/login');
    }

    const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
    const decoded: any = jwt.verify(token, jwtSecret);

    if (decoded && decoded.id) {
      await dbConnect();
      const user = await User.findById(decoded.id);

      if (!user || user.role !== 'admin') {
        redirect('/login');
      }
    } else {
      redirect('/login');
    }
  } catch (err) {
    console.error('[Admin Bus Detail Server Page] Authentication validation failure:', err);
    redirect('/login');
  }

  // Fetch single bus details
  const bus = await getAdminBusDetails(busId);

  if (!bus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 select-none">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Bus Not Found</h2>
        <p className="text-zinc-500 mt-2 text-xs font-semibold">The specified bus record does not exist or has been removed.</p>
        <Link 
          href="/admin/buses"
          className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-colors outline-none"
        >
          Back to Buses
        </Link>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'MAINTENANCE':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'INACTIVE':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'ACTIVE') return 'Active';
    if (status === 'MAINTENANCE') return 'In Maintenance';
    if (status === 'INACTIVE') return 'Inactive';
    return status;
  };

  const renderAmenityIcon = (amenity: string) => {
    const clean = amenity.toLowerCase();
    if (clean.includes('wifi') || clean.includes('wi-fi')) return <Wifi className="h-4 w-4 text-sky-500" />;
    if (clean.includes('ac') || clean.includes('air')) return <Wind className="h-4 w-4 text-teal-500" />;
    if (clean.includes('charg') || clean.includes('usb') || clean.includes('plug')) return <Zap className="h-4 w-4 text-amber-500" />;
    if (clean.includes('water')) return <Droplet className="h-4 w-4 text-blue-500" />;
    return <Sparkles className="h-4 w-4 text-zinc-400" />;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto select-none">
      
      {/* Header with back navigation button */}
      <div className="flex flex-col gap-1.5">
        <Link 
          href="/admin/buses"
          className="flex items-center gap-1 text-[11px] font-black text-indigo-650 hover:text-indigo-700 outline-none uppercase tracking-widest self-start transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to fleet
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div className="flex flex-col">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-none">
              Bus Details
            </h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
              Configuration, layout patterns, route allocations, and operators profiling.
            </p>
          </div>
          
          <span className={`px-4.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${getStatusStyle(bus.status)}`}>
            {getStatusLabel(bus.status)}
          </span>
        </div>
      </div>

      {/* Grid view containing layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Images, grid, amenities (7 columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Bus Image Preview */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative aspect-[16/9]">
            <img 
              src={bus.imageUrl} 
              alt={bus.busNumber}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Grid Seating Layout pattern */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col gap-5">
            <div className="pb-3 border-b border-zinc-150 dark:border-zinc-800">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                Seating Layout Grid
              </h3>
            </div>

            <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-850/30 rounded-[2rem] border border-dashed border-zinc-200/30 dark:border-zinc-850">
              {/* Driver cabin block */}
              <div className="w-full max-w-[280px] border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4 mb-6 flex justify-between items-center text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                <span>Driver Cabin</span>
                <div className="h-6 w-6 rounded-md bg-zinc-250 dark:bg-zinc-800 border flex items-center justify-center">
                  <Activity className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Grid Seating loop */}
              <div className="flex flex-col gap-3.5">
                {Array.from({ length: bus.rows }).map((_, rIdx) => (
                  <div key={rIdx} className="flex gap-3.5 justify-center">
                    {Array.from({ length: bus.cols }).map((_, cIdx) => {
                      const seatNo = `${String.fromCharCode(65 + rIdx)}${cIdx + 1}`;
                      const isSleeper = bus.sleeperSeats.includes(seatNo) || bus.type.includes('Sleeper');
                      const isAisle = cIdx === 2; // Simulated walkway aisle

                      if (isAisle) {
                        return <div key={cIdx} className="w-6 shrink-0" />; // Spacer walk path
                      }

                      return (
                        <div 
                          key={cIdx}
                          title={`Seat ${seatNo} (${isSleeper ? 'Sleeper' : 'Seater'})`}
                          className={`h-9 w-9 border rounded-xl flex items-center justify-center text-[10px] font-extrabold select-none transition-all cursor-default ${
                            isSleeper 
                              ? 'bg-indigo-50/40 border-indigo-250 dark:bg-indigo-950/20 dark:border-indigo-900 text-indigo-650 dark:text-indigo-400' 
                              : 'bg-zinc-50 border-zinc-200/60 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-600 dark:text-zinc-350'
                          }`}
                        >
                          <Armchair className="h-3.5 w-3.5 opacity-80" />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-6 text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900" />
                  <span>Sleeper berth</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700" />
                  <span>Standard seat</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Specs, Operator details, Route allocation (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Specifications Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col gap-4">
            <div className="pb-3 border-b border-zinc-150 dark:border-zinc-800">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                Technical Specifications
              </h3>
            </div>

            <div className="flex flex-col gap-3 text-xs font-bold text-zinc-750 dark:text-zinc-350">
              <div className="flex justify-between py-1.5 border-b border-dashed border-zinc-100 dark:border-zinc-850">
                <span className="text-zinc-450 dark:text-zinc-500">License Plate No.</span>
                <span className="uppercase text-zinc-900 dark:text-white font-extrabold">{bus.busNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-zinc-100 dark:border-zinc-850">
                <span className="text-zinc-450 dark:text-zinc-500">Bus Type</span>
                <span>{bus.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-zinc-100 dark:border-zinc-850">
                <span className="text-zinc-450 dark:text-zinc-500">Bus Model Class</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{bus.model}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-zinc-100 dark:border-zinc-850">
                <span className="text-zinc-450 dark:text-zinc-500">Total Capacity</span>
                <span>{bus.capacity} seats ({bus.rows}x{bus.cols} Grid)</span>
              </div>
            </div>

            {/* Amenities Section */}
            <div className="mt-2 flex flex-col gap-2">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase">Equipped Amenities</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {bus.amenities.map((item, idx) => (
                  <span 
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-200/10 rounded-xl text-[10px] font-extrabold text-zinc-700 dark:text-zinc-300"
                  >
                    {renderAmenityIcon(item)}
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Operator Profile Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col gap-4">
            <div className="pb-3 border-b border-zinc-150 dark:border-zinc-800">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Operator Profile
              </h3>
            </div>

            {bus.operator ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-indigo-100/50">
                    <AvatarImage src={bus.operator.profileImage || ''} alt={bus.operator.name} />
                    <AvatarFallback className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-black text-sm flex items-center justify-center">
                      {bus.operator.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-zinc-900 dark:text-white leading-none">
                      {bus.operator.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-550 font-bold mt-1.5 flex items-center gap-1 leading-none uppercase">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                      Platform Partner
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-zinc-400" />
                    <span>{bus.operator.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-zinc-400" />
                    <span>{bus.operator.phoneNumber}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 font-semibold italic">No operator linked.</div>
            )}
          </div>

          {/* Allocated Route Detail Timeline */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col gap-4">
            <div className="pb-3 border-b border-zinc-150 dark:border-zinc-800">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                Allocated Route Details
              </h3>
            </div>

            {bus.route ? (
              <div className="flex flex-col gap-5 mt-2 select-none">
                <div className="flex items-center justify-between text-xs font-extrabold text-zinc-850 dark:text-zinc-200">
                  <span className="bg-indigo-50/80 dark:bg-indigo-950/20 px-3 py-1.5 rounded-lg border">
                    {bus.route.source}
                  </span>
                  <span className="text-zinc-400">➔</span>
                  <span className="bg-indigo-50/80 dark:bg-indigo-950/20 px-3 py-1.5 rounded-lg border">
                    {bus.route.destination}
                  </span>
                </div>

                {/* Transit Timeline List */}
                {bus.route.stops && bus.route.stops.length > 0 && (
                  <div className="flex flex-col gap-4 pl-3.5 border-l-2 border-indigo-100 dark:border-zinc-800 relative ml-2">
                    {bus.route.stops
                      .sort((a, b) => a.sequence - b.sequence)
                      .map((stop, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-3 text-xs font-bold text-zinc-700 dark:text-zinc-350 relative">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-zinc-900 shrink-0" />
                          <div className="flex flex-col">
                            <span>{stop.stopName}</span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">Stop sequence #{stop.sequence}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 font-semibold italic">No route template assigned to this fleet unit.</div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
