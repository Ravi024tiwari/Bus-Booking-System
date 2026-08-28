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
      bg: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      title: "Easy Booking",
      desc: "Book your tickets in just a few clicks with instant seat selection.",
      icon: Zap,
      bg: "bg-orange-50 text-orange-600 border-orange-100"
    },
    {
      title: "Secure Payments",
      desc: "Multiple payment options with 100% security & instant refund protection.",
      icon: ShieldCheck,
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    {
      title: "Live Tracking",
      desc: "Track your bus in real-time with live GPS updates for a worry-free journey.",
      icon: Radio,
      bg: "bg-purple-50 text-purple-600 border-purple-100"
    }
  ];

  return (
    <section id="why-us" className="py-24 max-w-[1400px] mx-auto px-4 md:px-8 text-center">
      <PullUpReveal className="max-w-xl mx-auto mb-16 flex flex-col items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full py-1 px-3.5 mb-3">
          WHY CHOOSE US
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Everything You Need for <br />
          Comfortable <span className="text-blue-600">Travel</span>
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
            whileHover={{ y: -8, scale: 1.02, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.08)" }}
            className="p-6 bg-white border border-slate-200/80 rounded-2xl text-left flex flex-col gap-3.5 transition-all shadow-xs"
          >
            <div className={`p-3 rounded-2xl w-fit border ${feat.bg}`}>
              <feat.icon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{feat.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
