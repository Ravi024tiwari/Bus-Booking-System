'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const customEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const pullEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 55, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.75,
      ease: pullEase,
    },
  },
};

export function PullUpReveal({
  children,
  delay = 0,
  yOffset = 50,
  duration = 0.8,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  yOffset?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration,
        delay,
        ease: pullEase,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Icon helper components
export function BusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 6V4c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M18 8h 2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10c0-1.1.9-2 2-2h2" />
      <path d="M4 18h16" />
      <circle cx="6.5" cy="14.5" r="1.5" />
      <circle cx="17.5" cy="14.5" r="1.5" />
    </svg>
  );
}

export function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.99.08 2.16-.52 2.82-1.33z" />
    </svg>
  );
}
