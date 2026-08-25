'use client';

import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  PhoneCall, 
  MapPin, 
  Clock, 
  Send, 
  ShieldAlert, 
  Luggage, 
  Scale, 
  FileText, 
  Info,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// FAQ data schema
interface FAQItem {
  question: string;
  answer: string;
  category: 'booking' | 'refund' | 'general';
}

export default function HelpSupportPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  // Expanded FAQ ID
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  // Rules & Regulations Active Tab
  const [activeTab, setActiveTab] = useState<'cancellation' | 'baggage' | 'terms' | 'safety'>('cancellation');

  // Contact Form State
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    pnr: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FAQ List
  const faqs: FAQItem[] = [
    {
      question: "How do I cancel my bus ticket?",
      answer: "You can cancel your ticket by navigating to the 'My Bookings' tab in your sidebar, selecting the active booking, and clicking the 'Cancel Booking' button. Refund amounts will be calculated automatically based on our cancellation policy.",
      category: 'refund'
    },
    {
      question: "Can I change my boarding point after booking?",
      answer: "Yes, you can update your boarding point up to 8 hours before the scheduled departure time. Navigate to 'My Bookings', click on the booking card, and select 'Change Boarding Point'.",
      category: 'booking'
    },
    {
      question: "What happens if my bus is delayed or cancelled?",
      answer: "In the rare event that a bus operator cancels a trip or is delayed by more than 2 hours, you are eligible for a 100% refund. We will notify you immediately via SMS/Email and credit your source account or TripGo Wallet.",
      category: 'general'
    },
    {
      question: "Is there a baggage limit for passengers?",
      answer: "Each passenger is allowed 1 checked-in bag up to 15 kg and 1 hand/cabin bag up to 7 kg free of charge. Oversized or extra luggage will be charged at a rate of ₹20 per excess kilogram at the boarding gate.",
      category: 'general'
    },
    {
      question: "How long does it take to receive a refund?",
      answer: "Refunds processed to your TripGo Wallet are credited instantly. Refunds back to bank accounts, credit cards, or UPI accounts typically take 3 to 5 business days depending on your banking institution.",
      category: 'refund'
    },
    {
      question: "Can I book a ticket for family or friends?",
      answer: "Absolutely. During checkout, you will have the option to enter passenger details. Simply input their correct name, age, gender, and contact mobile number so they receive direct ticket details and updates.",
      category: 'booking'
    }
  ];

  // Filtering FAQs based on search
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.category) {
      toast.error('Please select an issue category');
      return;
    }
    if (!formData.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please enter your message details');
      return;
    }

    setIsSubmitting(true);

    // Mock API submission delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    toast.success('Your support ticket has been submitted successfully! We will contact you soon.');
    
    // Reset Form
    setFormData({
      category: '',
      subject: '',
      pnr: '',
      message: ''
    });
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col select-none">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          Help & Support <HelpCircle className="h-7 w-7 text-[#ff2d88]" />
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
          Have questions or need assistance? We are here to support you 24/7.
        </p>
      </div>

      {/* MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: FAQs & RULES & REGULATIONS */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* FAQ SECTION */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 sm:p-8 flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
            <div>
              <h2 className="font-extrabold text-lg text-zinc-900 dark:text-white">Frequently Asked Questions</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
                Quick answers to the most common queries
              </p>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/20 px-4 py-3 rounded-2xl w-full focus-within:ring-2 focus-within:ring-[#ff7c52]/30 transition-all duration-300">
              <Search className="h-5 w-5 text-zinc-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search for questions, keywords, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-700 dark:text-zinc-200 placeholder-zinc-400"
              />
            </div>

            {/* FAQ List */}
            <div className="flex flex-col gap-3">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => {
                  const isExpanded = expandedFaq === index;
                  return (
                    <div 
                      key={index} 
                      className={`border rounded-2xl transition-all duration-300 ${
                        isExpanded 
                          ? 'border-zinc-200 dark:border-zinc-750 bg-zinc-50/50 dark:bg-zinc-800/20' 
                          : 'border-zinc-100 dark:border-zinc-800/60 hover:border-zinc-200 dark:hover:border-zinc-850'
                      }`}
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 transition-colors"
                      >
                        <span>{faq.question}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-[#ff2d88] shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 text-xs text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed border-t border-zinc-100/50 dark:border-zinc-800/50">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-zinc-400 dark:text-zinc-500 font-medium text-xs">
                  No FAQs found matching your query. Please try another search term or send us a message!
                </div>
              )}
            </div>
          </div>

          {/* RULES & REGULATIONS SECTION */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 sm:p-8 flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
            <div>
              <h2 className="font-extrabold text-lg text-zinc-900 dark:text-white">Rules & Regulations</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
                Please review our policies to ensure a smooth and safe trip
              </p>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-zinc-150 dark:border-zinc-800 overflow-x-auto gap-2 select-none scrollbar-none">
              <button
                onClick={() => setActiveTab('cancellation')}
                className={`pb-3 px-2 text-xs font-black transition-all duration-200 whitespace-nowrap border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'cancellation'
                    ? 'border-[#ff2d88] text-[#ff2d88]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Scale className="h-4 w-4" />
                Cancellations & Refunds
              </button>
              
              <button
                onClick={() => setActiveTab('baggage')}
                className={`pb-3 px-2 text-xs font-black transition-all duration-200 whitespace-nowrap border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'baggage'
                    ? 'border-[#ff2d88] text-[#ff2d88]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Luggage className="h-4 w-4" />
                Baggage Policy
              </button>
              
              <button
                onClick={() => setActiveTab('terms')}
                className={`pb-3 px-2 text-xs font-black transition-all duration-200 whitespace-nowrap border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'terms'
                    ? 'border-[#ff2d88] text-[#ff2d88]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="h-4 w-4" />
                General Terms
              </button>

              <button
                onClick={() => setActiveTab('safety')}
                className={`pb-3 px-2 text-xs font-black transition-all duration-200 whitespace-nowrap border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'safety'
                    ? 'border-[#ff2d88] text-[#ff2d88]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                Safety Guidelines
              </button>
            </div>

            {/* Tab Body Content */}
            <div className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold leading-relaxed">
              
              {/* Cancellation & Refund Tab */}
              {activeTab === 'cancellation' && (
                <div className="flex flex-col gap-4">
                  <p>Our cancellation charge policy depends strictly on the hours left before the scheduled trip departure time:</p>
                  
                  {/* Cancellation Policy Table */}
                  <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden mt-1 bg-zinc-50/50 dark:bg-zinc-900/40">
                    <div className="grid grid-cols-2 bg-zinc-100 dark:bg-zinc-800/60 py-2.5 px-4 font-extrabold text-[10px] text-zinc-500 uppercase tracking-wider">
                      <div>Cancellation Timing</div>
                      <div className="text-right">Deduction Charge (Base Fare)</div>
                    </div>
                    
                    <div className="divide-y divide-zinc-150 dark:divide-zinc-850">
                      <div className="grid grid-cols-2 py-3 px-4">
                        <div className="text-zinc-800 dark:text-zinc-200">More than 24 hours before departure</div>
                        <div className="text-right text-emerald-600 dark:text-emerald-455 font-extrabold">10% Deduction</div>
                      </div>
                      <div className="grid grid-cols-2 py-3 px-4">
                        <div className="text-zinc-800 dark:text-zinc-200">Between 12 to 24 hours before departure</div>
                        <div className="text-right text-amber-600 dark:text-amber-500 font-extrabold">50% Deduction</div>
                      </div>
                      <div className="grid grid-cols-2 py-3 px-4">
                        <div className="text-zinc-800 dark:text-zinc-200">Less than 12 hours before departure</div>
                        <div className="text-right text-rose-600 dark:text-rose-500 font-extrabold">100% Deduction (No Refund)</div>
                      </div>
                    </div>
                  </div>

                  <ul className="list-disc pl-5 mt-2 flex flex-col gap-2">
                    <li>Booking fees and internet handling convenience charges are non-refundable.</li>
                    <li>Refunds are auto-processed. If credited to TripGo Wallet, it takes less than 5 minutes. Bank transfers can take 3-5 days.</li>
                    <li>Partial cancellation (cancelling only specific seats in a booking) is supported via the Booking detail screen.</li>
                  </ul>
                </div>
              )}

              {/* Baggage Policy Tab */}
              {activeTab === 'baggage' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3 p-3 bg-zinc-100/50 dark:bg-zinc-800/20 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
                    <Info className="h-4.5 w-4.5 text-[#ff7c52] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-zinc-900 dark:text-white block text-[11px] mb-0.5">Baggage Allowance Summary</span>
                      <span>Free Baggage allowance is limited to 15 kg Checked luggage (stored in the bus cargo compartment) and 7 kg Cabin luggage (handbag/backpack carried with you).</span>
                    </div>
                  </div>

                  <ul className="list-disc pl-5 mt-2 flex flex-col gap-2">
                    <li>Extra baggage will be charged at the rate of ₹20 per kg. Space is subject to bus capacity.</li>
                    <li><strong>Prohibited Items:</strong> Dangerous goods, fireworks, chemicals, combustible fuels, illicit substances, and weapons are strictly prohibited in cargo and cabin.</li>
                    <li>Valuables such as cash, jewelry, laptops, and confidential documents should always be carried in cabin baggage. TripGo is not liable for any losses of valuables stored in the bus trunk.</li>
                  </ul>
                </div>
              )}

              {/* General Terms Tab */}
              {activeTab === 'terms' && (
                <div className="flex flex-col gap-3">
                  <ul className="list-disc pl-5 flex flex-col gap-2.5">
                    <li><strong>Reporting Time:</strong> Passengers must arrive at their designated boarding points 30 minutes prior to the scheduled departure. The bus will not wait for late passengers.</li>
                    <li><strong>Identity Verification:</strong> It is mandatory to carry a valid government-issued photo ID (Aadhaar, PAN, Passport, Voter ID) alongside your digital ticket.</li>
                    <li><strong>Children Tickets:</strong> Children above 5 years old require a full ticket purchase. Children below 5 years can travel free but will not be allocated a separate seat.</li>
                    <li><strong>Passenger Behavior:</strong> Smoking, consuming alcohol, or playing loud audio without headphones is prohibited inside the bus. Operators hold the right to de-board disruptive passengers.</li>
                  </ul>
                </div>
              )}

              {/* Safety Guidelines Tab */}
              {activeTab === 'safety' && (
                <div className="flex flex-col gap-3">
                  <p>TripGo prioritizes passenger safety above all else. Every partner bus operator adheres to the following guidelines:</p>
                  <ul className="list-disc pl-5 flex flex-col gap-2">
                    <li>All buses are fully sanitized prior to boarding and at each major layover.</li>
                    <li>Emergency exits, hammer glass breaks, first-aid boxes, and dry chemical fire extinguishers are properly located on every vehicle.</li>
                    <li>For solo female travelers, you can request seats next to other female travelers during seat layout selection.</li>
                    <li>In case of a breakdown or medical emergency, immediately notify the driver/conductor or click the 'Panic Button' in the Live Tracking dashboard.</li>
                  </ul>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CONTACT DETAILS & SUPPORT FORM */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* CONTACT INFO CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 sm:p-8 flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden select-none">
            {/* Background Glow */}
            <div className="absolute top-[-20%] right-[-20%] w-[150px] h-[150px] bg-gradient-to-tr from-[#ff7c52]/20 to-[#ff2d88]/20 rounded-full blur-[40px] pointer-events-none" />

            <div>
              <h2 className="font-extrabold text-lg text-zinc-900 dark:text-white">Contact Us</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
                Reach out to us directly for urgent help
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {/* Phone option */}
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 bg-orange-500/10 text-orange-500 dark:bg-orange-550/15 dark:text-orange-400 rounded-2xl flex items-center justify-center shrink-0 border border-orange-500/15">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider leading-none">24/7 Helpline</span>
                  <a href="tel:+18005550199" className="text-sm font-black text-zinc-800 dark:text-zinc-200 hover:text-[#ff7c52] mt-1.5 leading-none transition-colors">
                    +1 (800) 555-0199
                  </a>
                </div>
              </div>

              {/* Email option */}
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 bg-pink-500/10 text-pink-500 dark:bg-pink-550/15 dark:text-pink-400 rounded-2xl flex items-center justify-center shrink-0 border border-pink-500/15">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider leading-none">Email Support</span>
                  <a href="mailto:raviashoktiwari@gmail.com" className="text-sm font-black text-zinc-800 dark:text-zinc-200 hover:text-[#ff2d88] mt-1.5 leading-none transition-colors select-all">
                    raviashoktiwari@gmail.com
                  </a>
                </div>
              </div>

              {/* Address option */}
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 bg-indigo-500/10 text-indigo-500 dark:bg-indigo-550/15 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-500/15">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider leading-none">Headquarters</span>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-1.5 leading-tight">
                    TripGo Headquarters, Sector 5, Raipur, Chhattisgarh, 492001
                  </span>
                </div>
              </div>

              {/* Timings */}
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 bg-emerald-500/10 text-emerald-500 dark:bg-emerald-555/15 dark:text-emerald-450 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/15">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider leading-none">Support Timing</span>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-1.5 leading-none">
                    24 Hours • 7 Days a Week
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* MESSAGE FORM */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 sm:p-8 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
            <div>
              <h2 className="font-extrabold text-lg text-zinc-900 dark:text-white">Submit a Support Ticket</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
                Fill the form below and we will get back to you shortly
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              
              {/* Category selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  Issue Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-800 px-4 py-3 rounded-2xl text-xs font-bold text-zinc-750 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#ff7c52]/30 transition-all duration-200 disabled:opacity-50"
                >
                  <option value="">Select a category...</option>
                  <option value="Booking issues">Ticket Booking Issues</option>
                  <option value="Cancellation/Refund">Cancellation & Refunds</option>
                  <option value="Bus operator behavior/delay">Operator/Bus Delay Inquiries</option>
                  <option value="App issues">Technical/App Troubleshooting</option>
                  <option value="Feedback/General Info">Feedback & General Suggestions</option>
                  <option value="Other">Other Issues</option>
                </select>
              </div>

              {/* PNR Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  PNR Number / Ticket ID (Optional)
                </label>
                <input
                  type="text"
                  name="pnr"
                  placeholder="e.g. TG12345678"
                  value={formData.pnr}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-800 px-4 py-3 rounded-2xl text-xs font-bold text-zinc-750 dark:text-zinc-200 placeholder-zinc-400/80 focus:outline-none focus:ring-2 focus:ring-[#ff7c52]/30 transition-all duration-200 disabled:opacity-50"
                />
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  placeholder="Brief summary of your query"
                  value={formData.subject}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-800 px-4 py-3 rounded-2xl text-xs font-bold text-zinc-750 dark:text-zinc-200 placeholder-zinc-400/80 focus:outline-none focus:ring-2 focus:ring-[#ff7c52]/30 transition-all duration-200 disabled:opacity-50"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  Details / Message Description
                </label>
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Please describe your issue in detail so we can help you faster..."
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-800 px-4 py-3 rounded-2xl text-xs font-bold text-zinc-750 dark:text-zinc-200 placeholder-zinc-400/80 focus:outline-none focus:ring-2 focus:ring-[#ff7c52]/30 transition-all duration-200 resize-none disabled:opacity-50"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:opacity-90 text-white font-extrabold text-xs rounded-2xl shadow-md hover:shadow-lg hover:shadow-[#ff2d88]/15 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 select-none disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Submitting Ticket...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Ticket
                  </>
                )}
              </button>

            </form>
          </div>

        </div>

      </div>
      
    </div>
  );
}
