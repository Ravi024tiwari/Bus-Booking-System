'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

import OperatorKPIsWidget from '@/components/admin/operators/operator-kpis';
import OperatorTable from '@/components/admin/operators/operator-table';
import OperatorFilters from '@/components/admin/operators/operator-filters';
import OperatorDonutChart from '@/components/admin/operators/operator-donut-chart';
import OperatorSidebarWidgets from '@/components/admin/operators/operator-sidebar-widgets';

import { OperatorKPIs, OperatorDetails } from '@/lib/admin-operators';

interface OperatorsClientProps {
  initialKPIs: OperatorKPIs;
  initialOperators: OperatorDetails[];
  initialTotal: number;
}

export default function OperatorsClient({ initialKPIs, initialOperators, initialTotal }: OperatorsClientProps) {
  // Local state for list, stats, pagination
  const [operators, setOperators] = useState<OperatorDetails[]>(initialOperators);
  const [kpis, setKpis] = useState<OperatorKPIs>(initialKPIs);
  const [total, setTotal] = useState(initialTotal);
  
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'ALL',
    search: '',
    joinedStart: '',
    joinedEnd: ''
  });

  // Data fetching trigger
  const fetchOperators = useCallback(async (currentPage: number, currentFilters: typeof filters) => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit,
        status: currentFilters.status,
        search: currentFilters.search
      };

      if (currentFilters.joinedStart) params.joinedStart = currentFilters.joinedStart;
      if (currentFilters.joinedEnd) params.joinedEnd = currentFilters.joinedEnd;

      const response = await axios.get('/api/admin/operators', { params });
      if (response.data?.success && response.data?.data) {
        setOperators(response.data.data.operators);
        setTotal(response.data.data.pagination.total);
      } else {
        toast.error('Failed to load operators list.');
      }
    } catch (err: any) {
      console.error('[Operators Client Fetch] Error:', err);
      toast.error(err.response?.data?.message || 'Error loading operators.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const fetchKPIs = useCallback(async () => {
    try {
      const response = await axios.get('/api/admin/operators/kpis');
      if (response.data?.success && response.data?.data) {
        setKpis(response.data.data);
      }
    } catch (err) {
      console.error('[Operators Client Fetch KPIs] Error:', err);
    }
  }, []);

  const handleRefreshAll = () => {
    fetchOperators(page, filters);
    fetchKPIs();
    toast.success('Refreshing operators list and metrics...');
  };

  // Triggers when page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchOperators(newPage, filters);
  };

  // Triggers when filters are applied
  const handleFilter = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
    fetchOperators(1, newFilters);
  };

  // Triggers when filters are reset
  const handleReset = () => {
    const defaultFilters = { status: 'ALL', search: '', joinedStart: '', joinedEnd: '' };
    setFilters(defaultFilters);
    setPage(1);
    fetchOperators(1, defaultFilters);
  };

  const paginationData = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto select-none">
      
      {/* Breadcrumbs navigation and title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-1.5 leading-none">
            Operators
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
            Manage all bus operators and their account activities.
          </p>
        </div>

        <button 
          onClick={handleRefreshAll}
          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100/50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 rounded-xl font-extrabold text-xs shadow-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer outline-none self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Operator Data
        </button>
      </div>

      {/* KPI Cards summary */}
      <OperatorKPIsWidget kpis={kpis} />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Operator list table (8 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-10 rounded-[2rem]">
                <div className="h-7 w-7 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
              </div>
            )}
            <OperatorTable 
              operators={operators} 
              pagination={paginationData} 
              onPageChange={handlePageChange}
              onRefresh={handleRefreshAll}
            />
          </div>
        </div>

        {/* Right Side: Filters, chart, support widgets (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <OperatorDonutChart kpis={kpis} />
          <OperatorFilters onFilter={handleFilter} onReset={handleReset} />
          <OperatorSidebarWidgets kpis={kpis} />
        </div>

      </div>

    </div>
  );
}
