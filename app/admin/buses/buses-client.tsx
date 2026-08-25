'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { RefreshCw, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import BusKPIsWidget from '@/components/admin/buses/bus-kpis';
import BusFilters from '@/components/admin/buses/bus-filters';
import BusCard from '@/components/admin/buses/bus-card';
import { BusKPIs, AdminBusDetails } from '@/lib/admin-buses';

interface BusesClientProps {
  initialKPIs: BusKPIs;
  initialFilterOptions: {
    operators: Array<{ id: string; name: string }>;
    routes: Array<{ id: string; source: string; destination: string }>;
  };
  initialBuses: AdminBusDetails[];
  initialTotal: number;
  selectedOperatorId?: string;
}

export default function BusesClient({
  initialKPIs,
  initialFilterOptions,
  initialBuses,
  initialTotal,
  selectedOperatorId
}: BusesClientProps) {
  const router = useRouter();

  // Local state for list, stats, pagination
  const [buses, setBuses] = useState<AdminBusDetails[]>(initialBuses);
  const [kpis, setKpis] = useState<BusKPIs>(initialKPIs);
  const [total, setTotal] = useState(initialTotal);
  
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    route: 'ALL',
    operator: selectedOperatorId || 'ALL',
    type: 'ALL',
    status: 'ALL'
  });

  // Data fetching trigger
  const fetchBuses = useCallback(async (currentPage: number, currentFilters: typeof filters) => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit,
        status: currentFilters.status,
        search: currentFilters.search,
        type: currentFilters.type,
        route: currentFilters.route,
        operator: currentFilters.operator
      };

      const response = await axios.get('/api/admin/buses', { params });
      if (response.data?.success && response.data?.data) {
        setBuses(response.data.data.buses);
        setTotal(response.data.data.pagination.total);
      } else {
        toast.error('Failed to load buses list.');
      }
    } catch (err: any) {
      console.error('[Buses Client Fetch] Error:', err);
      toast.error(err.response?.data?.message || 'Error loading buses.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const fetchKPIs = useCallback(async () => {
    try {
      const response = await axios.get('/api/admin/buses/kpis');
      if (response.data?.success && response.data?.data) {
        setKpis(response.data.data.kpis);
      }
    } catch (err) {
      console.error('[Buses Client Fetch KPIs] Error:', err);
    }
  }, []);

  const handleRefreshAll = () => {
    fetchBuses(page, filters);
    fetchKPIs();
    toast.success('Refreshing buses list and metrics...');
  };

  // Triggers when page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchBuses(newPage, filters);
  };

  // Triggers when filters are applied
  const handleFilter = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
    fetchBuses(1, newFilters);
  };

  // Triggers when filters are reset
  const handleReset = () => {
    const defaultFilters = { search: '', route: 'ALL', operator: 'ALL', type: 'ALL', status: 'ALL' };
    setFilters(defaultFilters);
    setPage(1);
    fetchBuses(1, defaultFilters);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto select-none">
      
      {/* Title & Actions row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-1.5 leading-none">
            Buses
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
            Manage all registered buses in the platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefreshAll}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100/50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 rounded-xl font-extrabold text-xs shadow-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer outline-none"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Fleet Data
          </button>
        </div>
      </div>

      {/* KPI Stats widgets */}
      <BusKPIsWidget kpis={kpis} />

      {/* Horizontal filter widgets */}
      <BusFilters 
        filterOptions={initialFilterOptions} 
        initialOperator={filters.operator}
        onFilter={handleFilter} 
        onReset={handleReset} 
      />

      {/* Buses listing grid container */}
      <div className="relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/45 dark:bg-zinc-950/45 backdrop-blur-xs flex items-center justify-center z-10 rounded-[2rem]">
            <div className="h-7 w-7 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          </div>
        )}

        {buses.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-550 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
            <Ban className="h-9 w-9 mb-2 opacity-35" />
            <span className="text-xs font-bold">No buses matched the filter criteria.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {buses.map((bus) => (
              <BusCard 
                key={bus.id} 
                bus={bus} 
                onClick={() => router.push(`/admin/buses/${bus.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-150 dark:border-zinc-800/80 pt-5 mt-4 text-xs font-bold text-zinc-500 shrink-0">
          <span>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} buses
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
