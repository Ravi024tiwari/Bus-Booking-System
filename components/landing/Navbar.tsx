'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND_NAME } from './types';
import { BusIcon, customEase } from './motion';

interface NavbarProps {
  activeSection: string;
  onNavigate: (targetId: string) => void;
}

export default function Navbar({ activeSection, onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Why Us', id: 'why-us' },
    { name: 'How It Works', id: 'how-it-works' },
    { name: 'Services', id: 'services' },
    { name: 'Fleet', id: 'fleet' },
    { name: 'Benefits', id: 'benefits' },
    { name: 'Reviews', id: 'reviews' },
    { name: 'Mobile App', id: 'app' },
    { name: 'Contact', id: 'contact' },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: customEase }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl bg-[#0b0827]/90 border-b border-white/10 shadow-2xl py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex justify-between items-center">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 select-none group">
          <div className="bg-gradient-to-br from-[#ff7c52] to-[#ff2d88] p-2 rounded-xl flex items-center justify-center shadow-md shadow-[#ff2d88]/25 group-hover:scale-105 transition-transform">
            <BusIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight leading-none text-white">
              Trip<span className="text-[#ff5666]">Go</span>
            </span>
            <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">
              Journey Made Easy
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigate(link.id)}
                className={`relative text-xs font-bold uppercase tracking-wider transition-colors py-1 cursor-pointer outline-none ${
                  isActive ? 'text-[#ff5666]' : 'text-zinc-300 hover:text-white'
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="activeNavUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Action CTA Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 uppercase tracking-wider px-4 rounded-xl"
            >
              Log In
            </Button>
          </Link>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:from-[#ff6b40] hover:to-[#ea1f7b] text-white rounded-xl text-xs font-extrabold uppercase tracking-wider px-5 shadow-lg shadow-[#ff2d88]/25 cursor-pointer"
              >
                Sign Up
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl outline-none cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="lg:hidden bg-[#0e0a30] border-b border-white/10 absolute top-full left-0 right-0 py-6 px-6 shadow-2xl flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate(link.id);
                }}
                className="text-left text-sm font-bold text-zinc-300 hover:text-[#ff5666] py-1.5 border-b border-white/10"
              >
                {link.name}
              </button>
            ))}
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full text-xs font-bold text-white border-white/20 bg-white/5 uppercase py-5 rounded-xl">
                  Log In
                </Button>
              </Link>
              <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white text-xs font-extrabold uppercase py-5 rounded-xl shadow-md">
                  Sign Up
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
