'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PullUpReveal } from './motion';
import { toast } from 'sonner';

export default function OffersNewsletter() {
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Please provide a valid email address');
      return;
    }
    toast.success("Thanks for subscribing! Use promo code 'TRIPGO40' for ₹200 OFF on your first booking.");
    setNewsletterEmail('');
  };

  return (
    <section id="offers" className="max-w-[1400px] mx-auto px-4 md:px-8 mb-24">
      <PullUpReveal yOffset={50}>
        <div className="bg-gradient-to-r from-[#ff7c52] via-[#ff5666] to-[#ff2d88] text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-[#ff2d88]/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-white/15 backdrop-blur-md border border-white/20 text-white rounded-2xl shrink-0">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">Stay Updated with Exclusive Offers</h3>
              <p className="text-xs text-white/90 font-medium mt-0.5">Subscribe to our newsletter and never miss verified promo deals on TripGo!</p>
            </div>
          </div>

          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-white text-zinc-900 border-none font-medium text-xs h-11 rounded-xl w-full sm:w-72 focus-visible:ring-2 focus-visible:ring-white shadow-sm"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
            />
            <Button type="submit" className="bg-[#0e0a30] hover:bg-[#1a1256] text-white font-black text-xs uppercase px-6 h-11 rounded-xl shrink-0 shadow-lg cursor-pointer transition-transform active:scale-95">
              Subscribe
            </Button>
          </form>
        </div>
      </PullUpReveal>
    </section>
  );
}
