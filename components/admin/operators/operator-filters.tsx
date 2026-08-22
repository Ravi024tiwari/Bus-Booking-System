'use client';

import React, { useState } from 'react';
import { Search, Calendar, ChevronDown, Filter } from 'lucide-react';

interface OperatorFiltersProps {
  onFilter: (filters: { status: string; search: string; joinedStart: string; joinedEnd: string }) => void;
  onReset: () => void;
}

export default function OperatorFilters({ onFilter, onReset }: OperatorFiltersProps) {
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [joinedStart, setJoinedStart] = useState('');
  const [joinedEnd, setJoinedEnd] = useState('');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({ status, search, joinedStart, joinedEnd });
  };

  const handleReset = () => {
    setStatus('ALL');
    setSearch('');
    setJoinedStart('');
    setJoinedEnd('');
    onReset();
  };

  return (
    <form 
      onSubmit={handleApply}
      className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col gap-5 select-none"
    >
      <div className="pb-3 border-b border-zinc-150 dark:border-zinc-800">
        <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-indigo-500" />
          Filter Operators
        </h3>
      </div>

      {/* Status Filter */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase pl-1">Status</span>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/20 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-350 outline-none appearance-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active (Approved)</option>
            <option value="PENDING">Pending Approval</option>
            <option value="SUSPENDED">Suspended (Rejected)</option>
          </select>
          <ChevronDown className="h-4 w-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Date Filters */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase pl-1">Joined From</span>
        <input
          type="date"
          value={joinedStart}
          onChange={(e) => setJoinedStart(e.target.value)}
          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/20 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-750 dark:text-zinc-350 outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase pl-1">Joined To</span>
        <input
          type="date"
          value={joinedEnd}
          onChange={(e) => setJoinedEnd(e.target.value)}
          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/20 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-750 dark:text-zinc-350 outline-none"
        />
      </div>

      {/* Text Search */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase pl-1">Search Keyword</span>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/20 pl-9 pr-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-250 outline-none placeholder-zinc-400"
          />
          <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-2">
        <button
          type="submit"
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2.5 rounded-xl shadow-md transition-colors cursor-pointer outline-none"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-150 dark:hover:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/20 text-zinc-600 dark:text-zinc-300 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer outline-none"
        >
          Reset
        </button>
      </div>

    </form>
  );
}
