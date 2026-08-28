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
    <section id="benefits" className="py-16 bg-blue-50/50 border-t border-b border-blue-100">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 text-center">
        <PullUpReveal className="max-w-xl mx-auto mb-10 flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100/70 border border-blue-200 rounded-full py-1 px-3.5 mb-3">
            BENEFITS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Why Travelers Love Us
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
              whileHover={{ y: -6 }}
              className="p-4 bg-white border border-slate-200/80 rounded-2xl flex flex-col items-center text-center gap-2 shadow-xs transition-all"
            >
              <div className="p-2.5 rounded-full bg-blue-50 text-blue-600">
                <ben.icon className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 mt-1">{ben.title}</h4>
              <p className="text-[10px] text-slate-500 leading-snug">{ben.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
