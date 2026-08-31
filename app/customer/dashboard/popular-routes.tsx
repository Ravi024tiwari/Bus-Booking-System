'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function PopularRoutes() {
  const router = useRouter();
  const { popularRoutes } = useSelector((state: RootState) => state.customerDashboard);

  const routes = popularRoutes && popularRoutes.length > 0 ? popularRoutes : [
    { source: 'Raipur', destination: 'Mumbai', fare: '1,099', image: '/images/bus-hero.jpg' },
    { source: 'Raipur', destination: 'Delhi', fare: '1,299', image: '/images/bus-hero.jpg' },
    { source: 'Nagpur', destination: 'Pune', fare: '799', image: '/images/bus-hero.jpg' },
    { source: 'Bhopal', destination: 'Indore', fare: '699', image: '/images/bus-hero.jpg' }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
      <div className="flex items-center justify-between select-none">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Popular Routes</h3>
        <button 
          onClick={() => router.push('/customer/book')}
          className="text-xs font-bold text-violet-600 hover:text-violet-700 cursor-pointer"
        >
          Browse All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {routes.map((route, i) => (
          <div
            key={i}
            onClick={() => router.push(`/customer/book?from=${encodeURIComponent(route.source)}&to=${encodeURIComponent(route.destination)}`)}
            className="group relative rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 flex flex-col aspect-[4/5] hover:shadow-md transition-shadow duration-300 cursor-pointer"
          >
            <Image
              src={route.image || '/images/bus-hero.jpg'}
              alt={`${route.source} to ${route.destination}`}
              fill
              sizes="(max-width: 768px) 50vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 text-white z-10 flex flex-col select-none">
              <span className="text-xs font-black block leading-none">
                {route.source} → {route.destination}
              </span>
              <span className="text-[10px] text-zinc-300 mt-1 block">
                From <span className="font-bold text-[#ff5666]">₹{route.fare}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
