'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusIcon, pullEase } from './motion';
import { MOCK_BUSES } from './types';
import { toast } from 'sonner';

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromCity: string;
  toCity: string;
  travelDate: string;
}

export default function SearchResultsModal({
  isOpen,
  onClose,
  fromCity,
  toCity,
  travelDate,
}: SearchResultsModalProps) {
  const [selectedBusForSeat, setSelectedBusForSeat] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['12A']);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 40 }}
          transition={{ duration: 0.4, ease: pullEase }}
          className="bg-white dark:bg-zinc-900 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex justify-between items-center bg-rose-50/50 dark:bg-zinc-950">
            <div>
              <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                <BusIcon className="h-5 w-5 text-[#ff2d88]" /> {fromCity} ➔ {toCity}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Showing direct bus departures on TripGo for {travelDate}</p>
            </div>
            <Button variant="ghost" size="icon-xs" onClick={onClose} className="rounded-full cursor-pointer">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Bus Cards List */}
          <div className="p-5 overflow-y-auto space-y-4">
            {MOCK_BUSES.map((bus) => (
              <div
                key={bus.id}
                className="border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-2xl hover:border-[#ff2d88]/60 transition-all bg-white dark:bg-zinc-900 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{bus.operator}</h4>
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Star className="h-3 w-3 fill-emerald-600" /> {bus.rating}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{bus.type}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-[#ff2d88]">₹{bus.price}</span>
                    <span className="text-[10px] text-zinc-400 block">{bus.seatsLeft} seats remaining</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{bus.departure}</span>
                    <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{bus.duration}</span>
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{bus.arrival}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedBusForSeat(selectedBusForSeat === bus.id ? null : bus.id);
                      toast.info(`Configuring seat selection for ${bus.operator}`);
                    }}
                    className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {selectedBusForSeat === bus.id ? 'Close Seat Map' : 'Select Seat'}
                  </Button>
                </div>

                {/* Interactive Seat Selector Preview */}
                {selectedBusForSeat === bus.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200/80 dark:border-zinc-800"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Lower Deck (2+1 Sleeper)</span>
                      <span className="text-xs text-[#ff2d88] font-semibold">Selected: {selectedSeats.join(', ')}</span>
                    </div>
                    <div className="grid grid-cols-6 gap-2 max-w-sm mx-auto">
                      {['1A', '2A', '3A', '4A', '5A', '6A', '1B', '2B', '3B', '4B', '5B', '6B'].map((seat) => {
                        const isSelected = selectedSeats.includes(seat);
                        return (
                          <button
                            key={seat}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSeats(selectedSeats.filter((s) => s !== seat));
                              } else {
                                setSelectedSeats([...selectedSeats, seat]);
                              }
                            }}
                            className={`p-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white border-[#ff2d88] shadow-xs'
                                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-[#ff2d88]'
                            }`}
                          >
                            {seat}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Link href="/login">
                        <Button size="sm" className="bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:from-[#ff6b40] hover:to-[#ea1f7b] text-white font-extrabold text-xs cursor-pointer shadow-md shadow-[#ff2d88]/20">
                          Proceed with {selectedSeats.length} Seat(s) ➔
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
