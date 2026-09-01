'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Bus, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  Search, 
  Clock, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Inbox,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationItem {
  _id: string;
  type: 'BUS_ADDED' | 'TRIP_ADDED' | 'GENERAL';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'BUS_ADDED' | 'TRIP_ADDED' | 'GENERAL'>('all');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  // Initial fetch on mount & mark all notifications as read in DB
  const loadInitialData = async () => {
    setIsInitialLoading(true);
    try {
      const response = await axios.get('/api/admin/notifications?limit=15');
      if (response.data?.success) {
        setNotifications(response.data.notifications);
        setNextCursor(response.data.nextCursor);
      }
      
      // Auto mark read in database
      await axios.put('/api/admin/notifications');
    } catch (err: any) {
      console.error('[Notifications Page] Initial fetch failed:', err);
      toast.error('Failed to load notifications feed.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch older notifications based on the current nextCursor
  const fetchMoreNotifications = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const response = await axios.get(`/api/admin/notifications?limit=10&cursor=${nextCursor}`);
      if (response.data?.success) {
        setNotifications((prev) => [...prev, ...response.data.notifications]);
        setNextCursor(response.data.nextCursor);
      }
    } catch (err: any) {
      console.error('[Notifications Page] Load more failed:', err);
      toast.error('Failed to load older notifications.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Intersection Observer for scroll-based infinite loading
  useEffect(() => {
    const currentTarget = observerRef.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && nextCursor && !isLoadingMore && !isInitialLoading) {
          fetchMoreNotifications();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [nextCursor, isLoadingMore, isInitialLoading]);

  // Relative Date/Time formatter
  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Style and icon configurations depending on type
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'BUS_ADDED':
        return {
          icon: Bus,
          iconColor: 'text-emerald-500 dark:text-emerald-400',
          bgColor: 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700/60',
          badgeText: 'Bus Added',
          badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
          ctaText: 'Inspect Bus Fleet',
          ctaPath: '/admin/buses',
        };
      case 'TRIP_ADDED':
        return {
          icon: Calendar,
          iconColor: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/20 hover:border-amber-300 dark:hover:border-amber-700/60',
          badgeText: 'Trip Scheduled',
          badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
          ctaText: 'Manage Trip Routes',
          ctaPath: '/admin/routes',
        };
      default:
        return {
          icon: Bell,
          iconColor: 'text-indigo-500 dark:text-indigo-400',
          bgColor: 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100/50 dark:border-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700/60',
          badgeText: 'System Alert',
          badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
          ctaText: 'Check Dashboard',
          ctaPath: '/admin/dashboard',
        };
    }
  };

  // Toggle card expansion
  const handleCardClick = (id: string) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  // Filtered Notifications list
  const filteredNotifications = notifications.filter((item) => {
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Category counts based on active loaded items
  const totalCount = notifications.length;
  const busCount = notifications.filter(n => n.type === 'BUS_ADDED').length;
  const tripCount = notifications.filter(n => n.type === 'TRIP_ADDED').length;
  const generalCount = notifications.filter(n => n.type === 'GENERAL').length;

  return (
    <div className="w-full select-none">
      
      {/* Header section with floating title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="relative">
              <Bell className="h-7 w-7 text-indigo-600 animate-pulse shrink-0" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
              </span>
            </div>
            Notifications Control Centre
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-semibold mt-1">
            Analyze, filter, and drill down into real-time operator activities across your bus network.
          </p>
        </div>

        <button 
          onClick={loadInitialData}
          disabled={isInitialLoading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer outline-none w-fit shrink-0"
        >
          <RefreshCw className={`h-4 w-4 shrink-0 ${isInitialLoading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Summary Statistics Dashboard Cards */}
      <div className="w-full mb-8">
        {/* Mobile Scroll Indicator */}
        <div className="flex items-center justify-between sm:hidden mb-2.5 px-1 select-none">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Alerts Summary
          </span>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            Scroll to view all <ArrowRight className="w-3 h-3 animate-bounce-x" />
          </span>
        </div>

        {/* Container: strictly compact, non-stretching horizontal row */}
        <div className="flex overflow-x-auto sm:overflow-x-visible no-scrollbar flex-nowrap gap-3 sm:gap-4 pb-2 sm:pb-0 pt-0.5 px-1 -mx-1 snap-x snap-mandatory sm:snap-none w-full sm:w-auto">
          {/* Total Metric Card */}
          <div className="w-[165px] sm:w-[195px] shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 border border-indigo-100 dark:border-indigo-900/30">
              <Layers className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block truncate">Total Alerts</span>
              <span className="text-base sm:text-lg font-extrabold text-zinc-800 dark:text-white leading-none mt-0.5 block truncate">
                {isInitialLoading ? '...' : totalCount}
              </span>
            </div>
          </div>

          {/* Bus Metric Card */}
          <div className="w-[165px] sm:w-[195px] shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 border border-emerald-100 dark:border-emerald-900/30">
              <Bus className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block truncate">Buses Added</span>
              <span className="text-base sm:text-lg font-extrabold text-zinc-800 dark:text-white leading-none mt-0.5 block truncate">
                {isInitialLoading ? '...' : busCount}
              </span>
            </div>
          </div>

          {/* Trip Metric Card */}
          <div className="w-[165px] sm:w-[195px] shrink-0 snap-start bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 border border-amber-100 dark:border-amber-900/30">
              <Calendar className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block truncate">Trips Scheduled</span>
              <span className="text-base sm:text-lg font-extrabold text-zinc-800 dark:text-white leading-none mt-0.5 block truncate">
                {isInitialLoading ? '...' : tripCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar: Tabs + Search input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/50 p-3 rounded-[2rem] shadow-sm mb-6">
        
        {/* Animated Slide Highlight Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pl-1 py-1">
          {[
            { id: 'all', label: 'All Alerts', count: totalCount },
            { id: 'BUS_ADDED', label: 'Buses', count: busCount },
            { id: 'TRIP_ADDED', label: 'Trips', count: tripCount },
            { id: 'GENERAL', label: 'System Logs', count: generalCount }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setExpandedCardId(null);
              }}
              className={`relative px-4 py-2 text-xs font-extrabold rounded-2xl transition-all cursor-pointer whitespace-nowrap outline-none flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-950/40' 
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-transparent border border-transparent'
              }`}
            >
              {tab.label}
              {!isInitialLoading && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search bar input field */}
        <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/30 dark:border-zinc-700/10 px-4 py-2.5 rounded-2xl w-full md:max-w-[300px] focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all duration-300">
          <Search className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search alerts content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-xs font-extrabold text-zinc-700 dark:text-zinc-200 placeholder-zinc-400"
          />
        </div>
      </div>

      {/* Main notifications list feed */}
      <div className="space-y-4">
        {isInitialLoading ? (
          // Skeletons
          Array.from({ length: 4 }).map((_, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/40 rounded-3xl p-5 flex gap-4 animate-pulse"
            >
              <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4.5 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                </div>
                <div className="h-3.5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              </div>
            </div>
          ))
        ) : filteredNotifications.length === 0 ? (
          // Empty State Design
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-14 bg-white dark:bg-zinc-900/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]"
          >
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-3xl mb-4">
              <Inbox className="h-8 w-8" />
            </div>
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">No Matching Notifications</h3>
            <p className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold max-w-xs mt-1">
              There are no notifications matching your active search filters. Try resetting the criteria or keywords.
            </p>
          </motion.div>
        ) : (
          // List view
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {filteredNotifications.map((item, idx) => {
                const style = getNotificationStyle(item.type);
                const Icon = style.icon;
                const isExpanded = expandedCardId === item._id;

                return (
                  <motion.div
                    key={item._id}
                    layoutId={`card-${item._id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
                    onClick={() => handleCardClick(item._id)}
                    className={`relative overflow-hidden bg-white dark:bg-zinc-900 border ${style.bgColor} rounded-[2rem] p-5 flex flex-col gap-3 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md cursor-pointer border-l-4 border-l-indigo-500 dark:border-l-indigo-600 group`}
                    style={{
                      borderLeftColor: item.type === 'BUS_ADDED' ? '#10b981' : item.type === 'TRIP_ADDED' ? '#f59e0b' : '#6366f1'
                    }}
                  >
                    {/* Top Row Overview */}
                    <div className="flex gap-4 items-start">
                      {/* Icon */}
                      <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800/80 rounded-2xl shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105">
                        <Icon className={`h-5 w-5 ${style.iconColor}`} />
                      </div>

                      {/* Content Overview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md ${style.badgeColor}`}>
                              {style.badgeText}
                            </span>
                            <h4 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-150 truncate">
                              {item.title}
                            </h4>
                          </div>
                          
                          {/* Time */}
                          <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 shrink-0">
                            <Clock className="h-3.5 w-3.5" />
                            {formatRelativeTime(item.createdAt)}
                          </div>
                        </div>
                        <p className="text-zinc-650 dark:text-zinc-400 text-xs font-semibold leading-relaxed truncate group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
                          {item.message}
                        </p>
                      </div>

                      {/* Toggle Expand Arrow */}
                      <div className="text-zinc-400 pl-2 self-center shrink-0">
                        {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                      </div>
                    </div>

                    {/* Expandable Drill Down Layout */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="border-t border-zinc-200/40 dark:border-zinc-800/50 pt-4 mt-2 overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          onClick={(e) => e.stopPropagation()} // Stop toggle event on click inside expanded region
                        >
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wide block">Notification metadata</span>
                            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                              <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                                <span className="text-zinc-400">Record ID:</span> {item._id}
                              </div>
                              <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                                <span className="text-zinc-400">Received:</span> {new Date(item.createdAt).toLocaleString()}
                              </div>
                              <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                                <span className="text-zinc-400">Audience:</span> Administrator Console
                              </div>
                            </div>
                          </div>

                          {/* CTA Redirect Button */}
                          <button
                            onClick={() => {
                              toast.info(`Redirecting to ${style.badgeText} management...`);
                              router.push(style.ctaPath);
                            }}
                            className="flex items-center justify-center gap-1.5 px-4.5 py-2 bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-white dark:text-zinc-150 text-[10px] font-black tracking-wider uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer outline-none w-fit"
                          >
                            {style.ctaText}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Observer target for Scroll-Based Infinite loading */}
        <div ref={observerRef} className="py-8 flex items-center justify-center select-none">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Fetching older logs...
            </div>
          )}
          {!nextCursor && notifications.length > 0 && !isLoadingMore && (
            <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-xs font-extrabold py-2">
             
              All notifications successfully caught up!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
