'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Zap, ShieldCheck, Radio } from 'lucide-react';
import { PullUpReveal, staggerContainerVariants, staggerItemVariants } from './motion';

export default function WhyChooseUs() {
  const features = [
    {
      title: "Wide Network",
      desc: "Travel to 100+ cities across the country with verified bus operators.",
      icon: Compass,
      bg: "bg-rose-50 dark:bg-rose-950/40 text-[#ff2d88] border-rose-200/60 dark:border-rose-800/40"
    },
    {
      title: "Easy Booking",
      desc: "Book your tickets in just a few clicks with instant seat selection.",
      icon: Zap,
      bg: "bg-orange-50 dark:bg-orange-950/40 text-[#ff7c52] border-orange-200/60 dark:border-orange-800/40"
    },
    {
      title: "Secure Payments",
      desc: "Multiple payment options with 100% security & instant refund protection.",
      icon: ShieldCheck,
      bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200/60 dark:border-emerald-800/40"
    },
    {
      title: "Live Tracking",
      desc: "Track your bus in real-time with live GPS updates for a worry-free journey.",
      icon: Radio,
      bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 border-purple-200/60 dark:border-purple-800/40"
    }
  ];

  return (
    <section id="why-us" className="py-24 max-w-[1400px] mx-auto px-4 md:px-8 text-center">
      <PullUpReveal className="max-w-xl mx-auto mb-16 flex flex-col items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#ff2d88] bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 rounded-full py-1 px-3.5 mb-3">
          WHY CHOOSE US
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
          Everything You Need for <br />
          Comfortable <span className="bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] bg-clip-text text-transparent">Travel</span>
        </h2>
      </PullUpReveal>

      {/* 4 Feature Cards Emerging from Below */}
      <motion.div 
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map((feat, idx) => (
          <motion.div
            key={idx}
            variants={staggerItemVariants}
            whileHover={{ y: -8, scale: 1.02, boxShadow: "0 20px 30px -10px rgba(255,45,136,0.12)" }}
            className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl text-left flex flex-col gap-3.5 transition-all shadow-xs group"
          >
            <div className={`p-3.5 rounded-2xl w-fit border ${feat.bg} group-hover:scale-110 transition-transform`}>
              <feat.icon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-1">{feat.title}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
