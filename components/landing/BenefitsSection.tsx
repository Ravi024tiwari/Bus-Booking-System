'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Tag, ShieldCheck, Clock, Phone } from 'lucide-react';
import { PullUpReveal, BusIcon, staggerContainerVariants, staggerItemVariants } from './motion';

export default function BenefitsSection() {
  const benefits = [
    { title: "Affordable Prices", desc: "Best fares for every journey.", icon: Tag },
    { title: "Safe & Reliable", desc: "Verified operators and safe travel.", icon: ShieldCheck },
    { title: "On-time Departures", desc: "Punctual trips for a hassle-free experience.", icon: Clock },
    { title: "Comfortable Ride", desc: "Clean buses and cozy seats for you.", icon: BusIcon },
    { title: "24/7 Support", desc: "We're here to help you anytime.", icon: Phone }
  ];

  return (
    <section id="benefits" className="py-20 bg-zinc-100/50 dark:bg-zinc-900/50 border-t border-b border-zinc-200/80 dark:border-zinc-800">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 text-center">
        <PullUpReveal className="max-w-xl mx-auto mb-10 flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#ff2d88] bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 rounded-full py-1 px-3.5 mb-3">
            BENEFITS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            Why Travelers Love Trip<span className="text-[#ff5666]">Go</span>
          </h2>
        </PullUpReveal>

        <motion.div 
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {benefits.map((ben, idx) => (
            <motion.div 
              key={idx} 
              variants={staggerItemVariants}
              whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 30px -10px rgba(255,45,136,0.12)" }}
              className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl flex flex-col items-center text-center gap-2 shadow-xs transition-all group"
            >
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-[#ff2d88] group-hover:scale-110 transition-transform">
                <ben.icon className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white mt-1">{ben.title}</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug">{ben.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
