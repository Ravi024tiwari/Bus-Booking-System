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
      color: "bg-[#ff7c52] text-white"
    },
    {
      num: 2,
      title: "Choose & Book",
      desc: "Compare trips, select your preferred coach and real-time seat.",
      icon: BusIcon,
      color: "bg-[#ff2d88] text-white"
    },
    {
      num: 3,
      title: "Make Payment",
      desc: "Pay securely using UPI, cards, or net banking with instant protection.",
      icon: ShieldCheck,
      color: "bg-emerald-500 text-white"
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
    <section id="how-it-works" className="py-24 bg-zinc-100/50 dark:bg-zinc-900/50 border-t border-b border-zinc-200/80 dark:border-zinc-800">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 text-center">
        
        <PullUpReveal className="max-w-xl mx-auto mb-16 flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#ff2d88] bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 rounded-full py-1 px-3.5 mb-3">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
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
              whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 30px -10px rgba(255,45,136,0.12)" }}
              className="flex flex-col items-center text-center p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs transition-all group"
            >
              {/* Step Circle with Step Number */}
              <div className="relative mb-4">
                <div className="size-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <step.icon className="h-7 w-7 text-zinc-700 dark:text-zinc-200" />
                </div>
                <span className={`absolute -top-1.5 -right-1.5 size-6 rounded-full ${step.color} text-[11px] font-black flex items-center justify-center shadow-md`}>
                  {step.num}
                </span>
              </div>

              <h3 className="text-base font-bold text-zinc-900 dark:text-white">{step.title}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed max-w-[210px]">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
