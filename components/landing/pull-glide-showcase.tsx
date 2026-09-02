'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Star, ArrowRight, ShieldCheck, Wifi, Tv, Coffee, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface FleetCardItem {
  id: string;
  tag: string;
  badgeColor?: string;
  name: string;
  category: string;
  description: string;
  image: string;
  price: string;
  seatsAvailable: string;
  rating: number;
  reviewsCount: number;
  amenities?: string[];
  features?: string[];
  actionLabel?: string;
  onAction?: () => void;
}

interface PullGlideShowcaseProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  cards: FleetCardItem[];
  onSelectCard?: (card: FleetCardItem) => void;
}

// 3D Tilt Card Component with Interactive Hover & Glare
export function TiltCard({
  card,
  index,
  onSelect,
}: {
  card: FleetCardItem;
  index: number;
  onSelect?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for smooth 3D tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg']);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{
        y: -10,
        scale: 1.025,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
      }}
      className="relative w-[340px] sm:w-[380px] md:w-[420px] shrink-0 rounded-[28px] bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-[0_10px_35px_-15px_rgba(0,0,0,0.07)] hover:shadow-[0_25px_50px_-12px_rgba(15,23,42,0.15)] transition-shadow duration-300 overflow-hidden flex flex-col justify-between group select-none cursor-pointer transform-gpu"
      onClick={onSelect}
    >
      {/* Top Media Preview with Zoom Container */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
        <Image
          src={card.image}
          alt={card.name}
          fill
          className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          sizes="(max-width: 768px) 100vw, 420px"
        />

        {/* Ambient Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Badge className="bg-white/90 dark:bg-zinc-900/90 text-slate-900 dark:text-white backdrop-blur-md border border-white/20 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
            {card.tag}
          </Badge>
          <div className="bg-[#1E40AF]/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-black tracking-tight border border-white/20 shadow-sm flex items-center gap-1">
            <span className="text-[#FF6B00] text-sm">₹</span>{card.price}
          </div>
        </div>

        {/* Bottom Info Bar inside image */}
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-white z-10">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider block">
              {card.category}
            </span>
            <h4 className="text-base font-extrabold text-white line-clamp-1 drop-shadow-sm">
              {card.name}
            </h4>
          </div>
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-black">
            <Star className="h-3.5 w-3.5 fill-[#FF6B00] text-[#FF6B00]" />
            <span>{card.rating}</span>
          </div>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-5 flex flex-col gap-4 flex-1 justify-between bg-white dark:bg-zinc-900">
        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {card.description}
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(card.amenities || ['Live GPS', 'AC Air Purifier', 'Pushback Seats']).map((amenity, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-2.5 py-1 rounded-md flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3 text-indigo-500" />
              {amenity}
            </span>
          ))}
        </div>

        {/* Bottom Footer Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Availability</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              {card.seatsAvailable} Left
            </span>
          </div>

          <Button
            size="sm"
            className="bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:from-[#ff6b40] hover:to-[#ea1f7b] text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-md shadow-[#ff2d88]/20 transition-all cursor-pointer"
          >
            {card.actionLabel || 'Book Seat'}
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Dynamic Shine Light overlay on hover */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none rounded-[28px]" />
      )}
    </motion.div>
  );
}

export default function PullGlideShowcase({
  title = "Explore Our Premium Fleet",
  subtitle = "Experience smooth, seamless travel with state-of-the-art multi-axle luxury Volvos and sleeper coaches.",
  badgeText = "PULL & GLIDE SHOWCASE",
  cards,
  onSelectCard,
}: PullGlideShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll Progress tethered to container height
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Physical Spring dampening (cubic-bezier feel with inertia)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  });

  // Horizontal Glide transform: pulls cards from right to left across viewport
  const x = useTransform(smoothProgress, [0, 1], ['2%', '-58%']);

  return (
    <div className="w-full relative">
      
      {/* DESKTOP VIEW: Scroll-Tethered Horizontal Pinned Scrub (>= 1024px) */}
      <div ref={containerRef} className="hidden lg:block relative h-[240vh] bg-zinc-50/50 dark:bg-zinc-950">
        
        <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden py-8">
          
          {/* Header Content */}
          <div className="max-w-[1400px] mx-auto px-8 w-full mb-8 flex justify-between items-end">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ff2d88] bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 rounded-full py-1 px-3.5 mb-2 inline-block">
                {badgeText}
              </span>
              <h2 className="text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                {title}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
                {subtitle}
              </p>
            </div>

            {/* Scroll Indicator Prompt */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 px-3.5 py-1.5 rounded-full shadow-xs text-xs font-bold text-zinc-600 dark:text-zinc-300">
              <span className="size-2 rounded-full bg-[#ff2d88] animate-ping" />
              <span>Scroll down to glide through fleet</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#ff2d88]" />
            </div>
          </div>

          {/* Gliding Cards Track */}
          <div className="w-full relative">
            <motion.div
              style={{ x }}
              className="flex gap-8 pl-8 md:pl-16 pr-24 items-center"
            >
              {cards.map((card, idx) => (
                <TiltCard
                  key={card.id}
                  card={card}
                  index={idx}
                  onSelect={() => onSelectCard?.(card)}
                />
              ))}
            </motion.div>
          </div>

          {/* Bottom Progress Bar Indicator */}
          <div className="max-w-[1400px] mx-auto px-8 w-full mt-8">
            <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                style={{ scaleX: smoothProgress, transformOrigin: '0%' }}
                className="h-full bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] rounded-full"
              />
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE & TABLET VIEW: Native Momentum Touch Carousel (< 1024px) */}
      <div className="lg:hidden py-16 px-4 max-w-[1400px] mx-auto">
        <div className="mb-8 text-center sm:text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#ff2d88] bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 rounded-full py-1 px-3.5 mb-2 inline-block">
            {badgeText}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {subtitle}
          </p>
        </div>

        {/* Horizontal Touch Snap Scroll with whileInView animations */}
        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 pt-2 px-1 scrollbar-none">
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{
                type: 'spring',
                stiffness: 220,
                damping: 20,
                delay: idx * 0.08,
              }}
              className="snap-center shrink-0"
            >
              <TiltCard
                card={card}
                index={idx}
                onSelect={() => onSelectCard?.(card)}
              />
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
