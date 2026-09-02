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
        <span className="text-[10px] font-black uppercase tracking-widest text-[#ff2d88] bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 rounded-full py-1 px-3.5 mb-3">
          TESTIMONIALS
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
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
            whileHover={{ y: -8, scale: 1.02, boxShadow: "0 20px 30px -10px rgba(255,45,136,0.12)" }}
            className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-xs text-left flex flex-col justify-between gap-4 transition-all"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="size-11 border-2 border-rose-100 dark:border-rose-900/50 shrink-0">
                  <AvatarImage src={t.avatar} alt={t.name} className="object-cover" />
                  <AvatarFallback className="bg-rose-100 dark:bg-rose-950 text-[#ff2d88] font-bold text-xs">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{t.name}</h4>
                  <span className="text-[10px] text-zinc-400">{t.location}</span>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed italic">
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
