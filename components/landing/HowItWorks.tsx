'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PullUpReveal, BusIcon, staggerContainerVariants, staggerItemVariants } from './motion';

export default function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: "Search Bus",
      desc: "Enter your source, destination and date to find buses on TripGo.",
      icon: Search,
      color: "bg-emerald-500 text-white"
    },
    {
      num: 2,
      title: "Choose & Book",
      desc: "Compare trips, select your preferred coach and real-time seat.",
      icon: BusIcon,
      color: "bg-blue-600 text-white"
    },
    {
      num: 3,
      title: "Make Payment",
      desc: "Pay securely using UPI, cards, or net banking with instant protection.",
      icon: ShieldCheck,
      color: "bg-orange-500 text-white"
    },
    {
      num: 4,
      title: "Travel & Enjoy",
      desc: "Get your e-ticket instantly and enjoy a safe, tracked journey.",
      icon: CheckCircle2,
      color: "bg-purple-500 text-white"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-blue-50/40 border-t border-b border-blue-100/70">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 text-center">
        
        <PullUpReveal className="max-w-xl mx-auto mb-16 flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100/70 border border-blue-200 rounded-full py-1 px-3.5 mb-3">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Simple Steps to Book Your Trip
          </h2>
        </PullUpReveal>

        {/* Stepper with 4 Steps Emerging with Stagger */}
        <motion.div 
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative"
        >
          {steps.map((step, idx) => (
            <motion.div 
              key={idx} 
              variants={staggerItemVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs transition-all"
            >
              {/* Step Circle with Step Number */}
              <div className="relative mb-4">
                <div className="size-16 rounded-full bg-blue-50/60 border border-blue-100 flex items-center justify-center shadow-xs">
                  <step.icon className="h-7 w-7 text-slate-700" />
                </div>
                <span className={`absolute -top-1 -left-1 size-6 rounded-full ${step.color} text-[11px] font-black flex items-center justify-center shadow-sm`}>
                  {step.num}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-[210px]">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
