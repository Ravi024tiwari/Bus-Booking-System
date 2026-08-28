'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { SERVICES_DATA } from './types';
import { PullUpReveal, staggerContainerVariants, staggerItemVariants } from './motion';

export default function ServicesSection() {
  const [activeFleetTab, setActiveFleetTab] = useState<'All' | 'Intercity' | 'Local' | 'Operator' | 'Charter'>('All');

  const filteredServices = activeFleetTab === 'All'
    ? SERVICES_DATA
    : SERVICES_DATA.filter((s) => s.category === activeFleetTab);

  return (
    <section id="services" className="py-24 max-w-[1400px] mx-auto px-4 md:px-8 text-center">
      <PullUpReveal className="max-w-xl mx-auto mb-10 flex flex-col items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full py-1 px-3.5 mb-3">
          OUR SERVICES
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Designed for Every Traveler
        </h2>
        <p className="text-xs text-slate-500 mt-2">Whether it&apos;s a daily commute or a long trip, we&apos;ve got you covered.</p>
      </PullUpReveal>

      {/* Category Filter Tabs */}
      <PullUpReveal yOffset={30} delay={0.1}>
        <div className="flex justify-center items-center gap-1.5 p-1 bg-slate-100 rounded-full w-fit mx-auto mb-12 border border-slate-200">
          {(['All', 'Intercity', 'Local', 'Operator', 'Charter'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFleetTab(tab)}
              className={`relative z-10 px-4 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                activeFleetTab === tab ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {activeFleetTab === tab && (
                <motion.div
                  layoutId="activeServiceTabPill"
                  className="absolute inset-0 bg-[#1E40AF] rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              {tab === 'All' ? 'All Services' : tab}
            </button>
          ))}
        </div>
      </PullUpReveal>

      {/* 4 Cards Emerging with Stagger */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {filteredServices.map((serv) => (
          <motion.div
            key={serv.id}
            variants={staggerItemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col text-left group transition-all"
          >
            <div className="relative h-44 w-full overflow-hidden bg-slate-100">
              <Image
                src={serv.image}
                alt={serv.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover group-hover:scale-108 transition-transform duration-600"
              />
            </div>

            <div className="p-5 flex flex-col flex-1 justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{serv.tag}</span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{serv.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{serv.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span
                  onClick={() => {
                    if (serv.id === 'operator') {
                      window.location.href = '/login';
                    } else {
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer group-hover:gap-1.5 transition-all"
                >
                  {serv.action} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
