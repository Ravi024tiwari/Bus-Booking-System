import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse select-none">
      
      {/* GREETING SKELETON */}
      <div className="flex flex-col gap-2.5">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      {/* KPI CARDS SKELETONS (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-5 flex items-center gap-4.5"
          >
            <div className="h-12 w-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
            <div className="flex flex-col gap-2 w-full">
              <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-3.5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* MAIN SPLIT GRID SKELETONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        
        {/* LEFT COLUMN: 8 spans */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* UPCOMING TRIP SKELETON */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 p-4 border border-zinc-100 dark:border-zinc-800/50 rounded-[2.2rem]">
              {/* Image Skeleton */}
              <div className="w-full md:w-[180px] h-[120px] bg-zinc-200 dark:bg-zinc-800 rounded-2xl shrink-0" />
              
              {/* Central Text Skeleton */}
              <div className="flex-1 flex flex-col justify-between py-1 gap-2.5">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl mt-1" />
                  <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded mt-1" />
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="h-3.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-3.5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>

              {/* Right Button & PNR Skeleton */}
              <div className="flex flex-col justify-between py-1 shrink-0 md:pl-6 md:w-[150px] gap-4">
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded self-start md:self-end" />
                  <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded self-start md:self-end" />
                </div>
                <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              </div>
            </div>
          </div>

          {/* RECENT BOOKINGS LIST SKELETON */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="h-5 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            </div>

            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl"
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl shrink-0" />
                    <div className="flex flex-col gap-2 w-full">
                      <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                  <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 4 spans */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* QUICK ACTIONS SKELETON */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5">
            <div className="h-5 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i}
                  className="flex items-center p-3.5 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl gap-3.5"
                >
                  <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl shrink-0" />
                  <div className="flex flex-col gap-2 w-1/2">
                    <div className="h-3.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EXCLUSIVE OFFERS SKELETON */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            </div>

            <div className="flex flex-col gap-4">
              <div className="h-44 w-full bg-zinc-200 dark:bg-zinc-800 rounded-[2.2rem]" />
              <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
