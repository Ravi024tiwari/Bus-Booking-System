'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TESTIMONIALS_DATA } from './types';
import { PullUpReveal, staggerContainerVariants, staggerItemVariants } from './motion';

export default function TestimonialsSection() {
  return (
    <section id="reviews" className="py-24 max-w-[1400px] mx-auto px-4 md:px-8 text-center">
      <PullUpReveal className="max-w-xl mx-auto mb-14 flex flex-col items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full py-1 px-3.5 mb-3">
          TESTIMONIALS
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          What Our Travelers Say
        </h2>
      </PullUpReveal>

      {/* Testimonials Cards Grid */}
      <motion.div 
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {TESTIMONIALS_DATA.map((t, idx) => (
          <motion.div
            key={idx}
            variants={staggerItemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs text-left flex flex-col justify-between gap-4 transition-all"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="size-11 border-2 border-blue-100 shrink-0">
                  <AvatarImage src={t.avatar} alt={t.name} className="object-cover" />
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                  <span className="text-[10px] text-slate-400">{t.location}</span>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-[#FF6B00] text-[#FF6B00]" />
                ))}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed italic">
                &ldquo;{t.comment}&rdquo;
              </p>
            </div>

            <div className="text-right text-blue-500 font-serif text-2xl">
              ❝
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
