'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import { BusIcon } from './motion';

interface FooterProps {
  onNavigate: (targetId: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer id="contact" className="bg-[#09061f] text-zinc-400 pt-16 pb-12 border-t border-white/10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-6 gap-8 text-left">
        
        {/* Logo & Info */}
        <div className="col-span-2 flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-[#ff7c52] to-[#ff2d88] p-2 rounded-xl flex items-center justify-center shadow-md shadow-[#ff2d88]/20">
              <BusIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-xl text-white">
              Trip<span className="text-[#ff5666]">Go</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
            Your trusted platform for safe, reliable, and comfortable bus travel across 100+ cities. Instant booking confirmations, live GPS tracking, and seamless cancellations on TripGo.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Links</h4>
          <ul className="flex flex-col gap-2 text-xs">
            <li><button type="button" onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer text-left">Home</button></li>
            <li><button type="button" onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer text-left">Trips</button></li>
            <li><button type="button" onClick={() => onNavigate('fleet')} className="hover:text-white transition-colors cursor-pointer text-left">Fleet Showcase</button></li>
            <li><button type="button" onClick={() => onNavigate('why-us')} className="hover:text-white transition-colors cursor-pointer text-left">About Us</button></li>
            <li><button type="button" onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer text-left">Contact</button></li>
          </ul>
        </div>

        {/* For Travelers */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">For Travelers</h4>
          <ul className="flex flex-col gap-2 text-xs">
            <li><button type="button" onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors cursor-pointer text-left">How It Works</button></li>
            <li><button type="button" onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer text-left">Booking Guide</button></li>
            <li><button type="button" onClick={() => onNavigate('why-us')} className="hover:text-white transition-colors cursor-pointer text-left">Cancellation Policy</button></li>
            <li><button type="button" onClick={() => onNavigate('why-us')} className="hover:text-white transition-colors cursor-pointer text-left">Payment Methods</button></li>
            <li><button type="button" onClick={() => onNavigate('benefits')} className="hover:text-white transition-colors cursor-pointer text-left">FAQs</button></li>
          </ul>
        </div>

        {/* For Operators */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">For Operators</h4>
          <ul className="flex flex-col gap-2 text-xs">
            <li><Link href="/register" className="hover:text-white transition-colors">Register Your Bus</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Operator Login</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Manage Trips</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Earnings & Reports</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Fleet Telemetry</Link></li>
          </ul>
        </div>

        {/* Contact Details */}
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contact Us</h4>
          <ul className="flex flex-col gap-2.5 text-xs text-zinc-400">
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-[#ff5666]" /> +91 98765 43210
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-[#ff5666]" /> support@tripgo.com
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[#ff5666]" /> Bilaspur, Chhattisgarh
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
        <span>&copy; {new Date().getFullYear()} TripGo. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-zinc-300 transition-colors">Terms & Conditions</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
