'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface BusFiltersProps {
  filterOptions: {
    operators: Array<{ id: string; name: string }>;
    routes: Array<{ id: string; source: string; destination: string }>;
  };
  initialOperator?: string;
  onFilter: (filters: {
    search: string;
    route: string;
    operator: string;
    type: string;
    status: string;
  }) => void;
  onReset: () => void;
}

export default function BusFilters({ filterOptions, initialOperator = 'ALL', onFilter, onReset }: BusFiltersProps) {
  const [search, setSearch] = useState('');
  const [route, setRoute] = useState('ALL');
  const [operator, setOperator] = useState(initialOperator);
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    setOperator(initialOperator);
  }, [initialOperator]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({ search, route, operator, type, status });
  };

  const handleReset = () => {
    setSearch('');
    setRoute('ALL');
    setOperator('ALL');
    setType('ALL');
    setStatus('ALL');
    onReset();
  };

  return (
    <form 
      onSubmit={handleApply}
      className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-wrap gap-5 items-end select-none"
    >
      {/* Search plate number */}
      <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase pl-1">Search Bus Number / Reg. No.</span>
        <div className="relative">
          <input
            type="text"
            placeholder="Search bus number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/20 dark:border-zinc-700/20 pl-9 pr-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-250 outline-none placeholder-zinc-400"
          />
          <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-3.5" />
        </div>
      </div>

      {/* Route Select */}
      <div className="w-[160px] flex flex-col gap-1.5">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase pl-1">Route</span>
        <div className="relative">
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/20 dark:border-zinc-700/20 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-350 outline-none appearance-none cursor-pointer"
          >
            <option value="ALL">All Routes</option>
            {filterOptions.routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.source} ➔ {r.destination}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 text-zinc-400 absolute right-3 top-3.5 pointer-events-none" />
        </div>
      </div>

      {/* Operator Select */}
      <div className="w-[160px] flex flex-col gap-1.5">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase pl-1">Operator</span>
        <div className="relative">
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/20 dark:border-zinc-700/20 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-350 outline-none appearance-none cursor-pointer"
          >
            <option value="ALL">All Operators</option>
            {filterOptions.operators.map((op) => (
              <option key={op.id} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 text-zinc-400 absolute right-3 top-3.5 pointer-events-none" />
        </div>
      </div>

      {/* Bus Type */}
      <div className="w-[140px] flex flex-col gap-1.5">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase pl-1">Bus Type</span>
        <div className="relative">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/20 dark:border-zinc-700/20 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-350 outline-none appearance-none cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="AC Sleeper">AC Sleeper</option>
            <option value="Non-AC Sleeper">Non-AC Sleeper</option>
            <option value="AC Seater">AC Seater</option>
            <option value="Non-AC Seater">Non-AC Seater</option>
          </select>
          <ChevronDown className="h-4 w-4 text-zinc-400 absolute right-3 top-3.5 pointer-events-none" />
        </div>
      </div>

      {/* Status */}
      <div className="w-[140px] flex flex-col gap-1.5">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase pl-1">Status</span>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/20 dark:border-zinc-700/20 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-350 outline-none appearance-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">In Maintenance</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <ChevronDown className="h-4 w-4 text-zinc-400 absolute right-3 top-3.5 pointer-events-none" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 min-w-[200px]">
        <button
          type="submit"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer outline-none flex-grow"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-2.5 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-150 dark:hover:bg-zinc-850 border border-zinc-200/20 dark:border-zinc-700/20 text-zinc-650 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors cursor-pointer outline-none"
        >
          Reset
        </button>
      </div>

    </form>
  );
}
