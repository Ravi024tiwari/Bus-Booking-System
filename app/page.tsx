'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import SearchResultsModal from '@/components/landing/SearchResultsModal';
import WhyChooseUs from '@/components/landing/WhyChooseUs';
import MetricsBanner from '@/components/landing/MetricsBanner';
import HowItWorks from '@/components/landing/HowItWorks';
import ServicesSection from '@/components/landing/ServicesSection';
import PullGlideShowcase, { FleetCardItem } from '@/components/landing/pull-glide-showcase';
import BenefitsSection from '@/components/landing/BenefitsSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import AppDownloadBanner from '@/components/landing/AppDownloadBanner';
import OffersNewsletter from '@/components/landing/OffersNewsletter';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('home');
  const [fromCity, setFromCity] = useState('Delhi');
  const [toCity, setToCity] = useState('Jaipur');
  const [travelDate, setTravelDate] = useState('2026-09-01');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Smooth scroll handler
  const scrollToSection = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      const yOffset = -80; // Offset for sticky navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Monitor scroll for active section indicator (Scroll Spy)
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'why-us', 'how-it-works', 'services', 'fleet', 'benefits', 'reviews', 'app', 'offers'];
      const scrollPosition = window.scrollY + 140;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSwapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
    toast.info('Swapped departure and destination');
  };

  const handleSearch = () => {
    setShowSearchResults(true);
    toast.success(`Found 12 available buses on TripGo from ${fromCity} to ${toCity}!`);
  };

  const fleetShowcaseCards: FleetCardItem[] = [
    {
      id: "fleet-1",
      tag: "FLAGSHIP LUXURY",
      name: "TripGo Volvo 9600 Multi-Axle Sleeper",
      category: "Ultra Luxury Sleeper",
      description: "Individual panoramic windows, ambient reading lights, noise cancellation air suspension, and sanitized interiors.",
      image: "/images/volvo.png",
      price: "1,250",
      seatsAvailable: "8 Sleepers",
      rating: 4.9,
      reviewsCount: 840,
      amenities: ["Live GPS", "AC Purifier", "Wifi", "Snacks"],
      actionLabel: "Book Volvo"
    },
    {
      id: "fleet-2",
      tag: "POPULAR CHOICE",
      name: "TripGo Scania Touring HD Coach",
      category: "Executive Multi-Axle",
      description: "Ergonomic leather pushback recliners, onboard USB-C rapid charging, spacious legroom, and GPS telemetry tracking.",
      image: "/images/bus-hero.jpg",
      price: "950",
      seatsAvailable: "14 Seats",
      rating: 4.9,
      reviewsCount: 620,
      amenities: ["Live GPS", "USB-C Charging", "Water", "CCTV"],
      actionLabel: "Book Scania"
    },
    {
      id: "fleet-3",
      tag: "ZERO EMISSION",
      name: "TripGo BharatBenz Electric Glide",
      category: "Eco Smart Express",
      description: "Whisper-quiet electric drive, smooth hill-assist steering, automated climate sensors, and real-time battery status monitoring.",
      image: "/images/bus1.jpg",
      price: "680",
      seatsAvailable: "18 Seats",
      rating: 4.8,
      reviewsCount: 310,
      amenities: ["Fast AC", "Silent Drive", "Live GPS", "SOS"],
      actionLabel: "Book EV"
    },
    {
      id: "fleet-4",
      tag: "ROYAL NIGHT COACH",
      name: "TripGo Mercedes Super High-Deck",
      category: "Royal Club Class",
      description: "Custom memory foam mattresses, individual entertainment screens, emergency SOS bells, and curtain-partitioned privacy suites.",
      image: "/images/bus2.jpg",
      price: "1,400",
      seatsAvailable: "6 Sleepers",
      rating: 5.0,
      reviewsCount: 490,
      amenities: ["Privacy Suites", "Blanket Kit", "Wifi", "Hot Beverage"],
      actionLabel: "Book Royal"
    },
    {
      id: "fleet-5",
      tag: "REGIONAL EXPRESS",
      name: "TripGo Ashok Leyland Falcon",
      category: "Daily Intercity Express",
      description: "Punctual point-to-point intercity routes with verified commercial drivers and quick automated e-ticket validation.",
      image: "/images/volvo2.png",
      price: "480",
      seatsAvailable: "22 Seats",
      rating: 4.7,
      reviewsCount: 750,
      amenities: ["Water Bottle", "Clean Seats", "Punctual"],
      actionLabel: "Book Falcon"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafc] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-[#ff2d88] selection:text-white font-sans antialiased overflow-x-hidden">

      {/* 1. Header Navbar */}
      <Navbar
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      {/* 2. Pinned / Sticky Hero Banner (100vh viewport stage) */}
      <div className="sticky top-0 z-0 w-full overflow-hidden">
        <HeroSection 
          fromCity={fromCity}
          toCity={toCity}
          travelDate={travelDate}
          onFromChange={setFromCity}
          onToChange={setToCity}
          onDateChange={setTravelDate}
          onSwapCities={handleSwapCities}
          onSearch={handleSearch}
        />
      </div>

      {/* 3. Search Results Modal Drawer */}
      <SearchResultsModal 
        isOpen={showSearchResults}
        onClose={() => setShowSearchResults(false)}
        fromCity={fromCity}
        toCity={toCity}
        travelDate={travelDate}
      />

      {/* 4. Overlapping Content Sheet (Glides directly OVER the pinned banner) */}
      <div className="relative z-20 bg-[#fafafc] dark:bg-zinc-950 rounded-t-[36px] sm:rounded-t-[48px] md:rounded-t-[60px] shadow-[0_-30px_70px_-10px_rgba(0,0,0,0.55)] dark:shadow-[0_-30px_70px_-10px_rgba(0,0,0,0.95)] border-t border-white/20 dark:border-zinc-800 -mt-8 sm:-mt-12 transition-all">
        
        {/* Visual Grab Handle / Sheet Indicator */}
        <div className="flex justify-center pt-3.5 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700/80" />
        </div>

        {/* 5. Why Choose Us Feature Cards */}
        <WhyChooseUs />

        {/* 6. Metrics Banner */}
        <MetricsBanner />

        {/* 7. How It Works 4-Step Process */}
        <HowItWorks />

        {/* 8. Services Category Grid */}
        <ServicesSection />

        {/* 9. Scroll-Tethered Pull & Glide Fleet Showcase */}
        <section id="fleet" className="w-full">
          <PullGlideShowcase 
            title="Engineered for Royal Comfort"
            subtitle="Glide through our handpicked fleet of multi-axle luxury Volvos, EV express coaches, and panoramic sleeper buses on TripGo."
            badgeText="SCROLL-TETHERED FLEET SHOWCASE"
            cards={fleetShowcaseCards}
            onSelectCard={(card) => {
              toast.success(`Selected ${card.name}. Ready to book!`);
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
          />
        </section>

        {/* 10. Benefits 5-Pill Section */}
        <BenefitsSection />

        {/* 11. Testimonials / Reviews */}
        <TestimonialsSection />

        {/* 12. Download App Banner */}
        <AppDownloadBanner />

        {/* 13. Offers & Promo Subscription */}
        <OffersNewsletter />

        {/* 14. Footer */}
        <Footer onNavigate={scrollToSection} />

      </div>

    </div>
  );
}
