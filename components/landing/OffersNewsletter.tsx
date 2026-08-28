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
        <div className="bg-gradient-to-r from-[#FF6B00] via-[#FF7A00] to-[#FF5500] text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-slate-950/20 backdrop-blur-md border border-white/20 text-white rounded-2xl shrink-0">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">Stay Updated with Latest Offers</h3>
              <p className="text-xs text-white/90 font-semibold mt-0.5">Subscribe to our newsletter and never miss a promo deal on TripGo!</p>
            </div>
          </div>

          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-white text-slate-900 border-none font-medium text-xs h-11 rounded-xl w-full sm:w-72 focus-visible:ring-2 focus-visible:ring-slate-950"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
            />
            <Button type="submit" className="bg-[#1E40AF] hover:bg-[#1D4ED8] text-white font-black text-xs uppercase px-6 h-11 rounded-xl shrink-0 shadow-md">
              Subscribe
            </Button>
          </form>
        </div>
      </PullUpReveal>
    </section>
  );
}
