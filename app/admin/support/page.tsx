'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MessageSquare, 
  User, 
  Phone, 
  Clock, 
  AlertTriangle, 
  Send, 
  Lock, 
  Paperclip, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  CornerDownRight,
  TrendingUp,
  Inbox,
  Filter,
  Sparkles,
  RefreshCw,
  Plus,
  X,
  Info,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Type Definitions
interface Message {
  id: string;
  sender: 'customer' | 'admin' | 'system';
  senderName: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  isInternal?: boolean;
}

interface Ticket {
  id: string;
  title: string;
  customerName: string;
  email: string;
  phone: string;
  category: 'Refunds / Payments' | 'Seat Allocation' | 'Live Tracking' | 'Promo Codes' | 'General';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved';
  lastUpdated: string;
  messages: Message[];
  metadata: {
    bookingId?: string;
    tripDetails?: string;
    operatorName?: string;
    amountPaid?: string;
    seatNo?: string;
  };
}

// Initial Tickets Data
const initialTickets: Ticket[] = [
  {
    id: "TKT-82739",
    title: "Seat hold expired during transaction OTP check",
    customerName: "Priyanjali Sen",
    email: "priya.sen@outlook.com",
    phone: "+91 87654 32109",
    category: "Seat Allocation",
    priority: "Critical",
    status: "In Progress",
    lastUpdated: "5 mins ago",
    messages: [
      {
        id: "m1",
        sender: "customer",
        senderName: "Priyanjali Sen",
        content: "I was booking seat 12B on the Delhi-Dehradun AC Sleeper. During the OTP check, the seat hold timer expired. Now the seat shows as booked by someone else but my money was deducted!",
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: "m2",
        sender: "admin",
        senderName: "System Note",
        content: "Checked BullMQ release queue. The seat hold job expired at the exact millisecond of the payment webhook. Need to manually confirm booking.",
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        isInternal: true
      },
      {
        id: "m3",
        sender: "admin",
        senderName: "Admin Rohit",
        content: "Hi Priyanjali, checking this transaction details with Razorpay logs. If the hold released but payment captured, we will manually allocate another seat or process instant refund. Please give me 5 minutes.",
        timestamp: new Date(Date.now() - 15 * 60 * 1000)
      }
    ],
    metadata: {
      bookingId: "BK-DE-8930",
      tripDetails: "Delhi ⇄ Dehradun (20:30 AC Sleeper)",
      amountPaid: "₹950.00",
      seatNo: "12B (Lower Deck)"
    }
  },
  {
    id: "TKT-29381",
    title: "Refund not received for Delhi-Jaipur booking cancellation",
    customerName: "Amit Sharma",
    email: "amit.sharma@gmail.com",
    phone: "+91 98765 43210",
    category: "Refunds / Payments",
    priority: "High",
    status: "Open",
    lastUpdated: "12 mins ago",
    messages: [
      {
        id: "m4",
        sender: "customer",
        senderName: "Amit Sharma",
        content: "I cancelled my seat on Trip Delhi-Jaipur yesterday but the refund hasn't reflected in my account. Razorpay payment ID is pay_P283j1h2. Please expedite.",
        timestamp: new Date(Date.now() - 45 * 60 * 1000)
      }
    ],
    metadata: {
      bookingId: "BK-JP-1129",
      tripDetails: "Delhi ⇄ Jaipur (06:00 Express)",
      amountPaid: "₹650.00",
      seatNo: "04A"
    }
  },
  {
    id: "TKT-71289",
    title: "GPS Live Tracking coordinates not updating on Driver app",
    customerName: "Rajesh Patel",
    email: "rajesh.operators@gmail.com",
    phone: "+91 76543 21098",
    category: "Live Tracking",
    priority: "Medium",
    status: "Open",
    lastUpdated: "1 hr ago",
    messages: [
      {
        id: "m5",
        sender: "customer",
        senderName: "Rajesh Patel (Operator)",
        content: "My driver app coordinates are not uploading from Trip DL-01-A-9923. Passengers are calling me saying they cannot see the live tracking on their user app. Fix urgently.",
        timestamp: new Date(Date.now() - 60 * 60 * 1000)
      }
    ],
    metadata: {
      operatorName: "Patel Travels Ltd",
      tripDetails: "DL-01-A-9923 (Delhi-Haridwar Route)"
    }
  },
  {
    id: "TKT-44910",
    title: "Coupon code 'SEATPLUS40' not applying to booking",
    customerName: "Manish Malhotra",
    email: "manish.m@yahoo.com",
    phone: "+91 91234 56789",
    category: "Promo Codes",
    priority: "Low",
    status: "Resolved",
    lastUpdated: "3 hrs ago",
    messages: [
      {
        id: "m6",
        sender: "customer",
        senderName: "Manish Malhotra",
        content: "I tried applying the coupon SEATPLUS40 on Delhi-Agra route but it shows coupon invalid.",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        id: "m7",
        sender: "admin",
        senderName: "Admin Rohit",
        content: "Hello Manish, the SEATPLUS40 coupon has reached its maximum threshold of 500 bookings. You can use 'SEAT25' for 25% off instead.",
        timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000)
      },
      {
        id: "m8",
        sender: "customer",
        senderName: "Manish Malhotra",
        content: "Ah, ok! Thanks, that worked.",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
      }
    ],
    metadata: {
      bookingId: "BK-AG-3094",
      tripDetails: "Delhi ⇄ Agra (14:00 Volvo Multi-Axle)",
      amountPaid: "₹480.00"
    }
  }
];

// Predefined Canned Responses
const CANNED_RESPONSES = [
  { label: "Refund Timeline", text: "Hi, I have initiated the refund for this booking. The amount has been credited from our side and will reflect in your original payment account within 5-7 business days." },
  { label: "Check Razorpay", text: "We have checked with Razorpay gateway, and the payment status is marked as 'Captured'. Let me manually confirm your ticket seats now." },
  { label: "GPS Reset Instructions", text: "Dear Operator, please ask your driver to logout, clear app cache, check if Location permission is set to 'Always Allow', and then log back in." },
  { label: "Expired Hold", text: "The seat hold timed out because the bank OTP took longer than 10 minutes. Since your amount was deducted, I am manually issuing a seat voucher for the booking." }
];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(initialTickets[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'In Progress' | 'Resolved'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low'>('All');
  const [chatInput, setChatInput] = useState('');
  const [replyMode, setReplyMode] = useState<'customer' | 'internal'>('customer');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hydration safety mount check
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTime = (date: Date) => {
    if (!mounted) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Responsive device view states
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  // Auto scroll to bottom of chat thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages, isTyping]);

  // Statistics indicators
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    critical: tickets.filter(t => t.priority === 'Critical').length,
  };

  // Ticket filtering logic
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Action handlers
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'admin',
      senderName: replyMode === 'internal' ? 'Internal Staff' : 'Admin Staff',
      content: text,
      timestamp: new Date(),
      isInternal: replyMode === 'internal'
    };

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          lastUpdated: "Just now",
          messages: [...t.messages, newMessage],
          status: (t.status === 'Open' && replyMode === 'customer') ? 'In Progress' : t.status
        };
      }
      return t;
    }));

    if (!textToSend) setChatInput('');
    toast.success(replyMode === 'internal' ? 'Internal note added' : 'Reply sent to client');

    // Simulate auto response
    if (replyMode === 'customer') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const customerReplies = [
          "Thank you for looking into this, let me know when it is done.",
          "Perfect, I appreciate the quick support!",
          "Yes, the deducted amount was ₹" + (selectedTicket.metadata.amountPaid || "950") + ". Let me know what step is next.",
          "Awesome. I will check my bank statement and update."
        ];
        const randomReply = customerReplies[Math.floor(Math.random() * customerReplies.length)];

        const autoReply: Message = {
          id: `msg-auto-${Date.now()}`,
          sender: 'customer',
          senderName: selectedTicket.customerName,
          content: randomReply,
          timestamp: new Date()
        };

        setTickets(prev => prev.map(t => {
          if (t.id === selectedTicket.id) {
            return {
              ...t,
              lastUpdated: "Just now",
              messages: [...t.messages, autoReply]
            };
          }
          return t;
        }));
        
        toast.info(`New message from ${selectedTicket.customerName}`);
      }, 2500);
    }
  };

  const changeTicketStatus = (newStatus: 'Open' | 'In Progress' | 'Resolved') => {
    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return { ...t, status: newStatus };
      }
      return t;
    }));
    toast.success(`Ticket status updated to ${newStatus}`);
  };

  const applyCannedResponse = (response: string) => {
    setChatInput(response);
    toast.info("Canned response loaded into draft");
  };

  // Status mapping colors
  const priorityColors = {
    Critical: "bg-red-500/10 text-red-500 border-red-500/20",
    High: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    Low: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  };

  const statusColors = {
    Open: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    "In Progress": "bg-amber-500/10 text-amber-600 border-amber-500/20",
    Resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
  };

  // Reusable Customer Metadata Panel
  const renderMetadataSidebar = () => (
    <div className="flex flex-col gap-4">
      {/* Customer profile */}
      <Card className="border-border/60 shadow-xs bg-card/50 backdrop-blur-xs">
        <CardHeader className="p-4 border-b border-border/40 pb-2.5 bg-muted/20">
          <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customer Info</CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 ring-1 ring-border">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {selectedTicket.customerName.split(' ').map(n=>n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate">{selectedTicket.customerName}</h4>
              <span className="text-[10px] text-muted-foreground truncate block">{selectedTicket.email}</span>
            </div>
          </div>
          
          <div className="space-y-2 border-t border-border/40 pt-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone:</span>
              <span className="font-semibold text-foreground">{selectedTicket.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> KYC Verification:</span>
              <Badge variant="outline" className="text-[9px] h-4.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-1 rounded-sm">Verified</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking details */}
      {selectedTicket.metadata.bookingId && (
        <Card className="border-border/60 shadow-xs bg-card/50 backdrop-blur-xs">
          <CardHeader className="p-4 border-b border-border/40 pb-2.5 bg-muted/20">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Booking & Route Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-2.5 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-0.5">Booking ID</span>
              <span className="font-mono font-bold text-foreground text-sm flex items-center gap-1">
                {selectedTicket.metadata.bookingId} 
                <Button variant="link" size="icon-xs" className="h-4 p-0 text-primary" onClick={() => toast.info(`Navigating to Booking: ${selectedTicket.metadata.bookingId}`)}>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-0.5">Trip Details</span>
              <span className="font-medium text-foreground leading-relaxed">{selectedTicket.metadata.tripDetails}</span>
            </div>
            {selectedTicket.metadata.seatNo && (
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-0.5">Seat No</span>
                <span className="font-semibold text-foreground">{selectedTicket.metadata.seatNo}</span>
              </div>
            )}
            {selectedTicket.metadata.amountPaid && (
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-0.5">Transaction Amount</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedTicket.metadata.amountPaid}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Canned responses */}
      <Card className="border-border/60 shadow-xs bg-card/50 backdrop-blur-xs flex-1">
        <CardHeader className="p-4 border-b border-border/40 pb-2.5 bg-muted/20">
          <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> Pre-set Macros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex flex-col gap-1.5">
          {CANNED_RESPONSES.map((res, idx) => (
            <button
              key={idx}
              onClick={() => {
                applyCannedResponse(res.text);
                if (showMobileSidebar) setShowMobileSidebar(false);
              }}
              className="w-full p-2 border border-border/50 hover:border-primary hover:bg-primary/5 rounded-lg text-left text-xs text-foreground font-medium transition-all duration-200 flex justify-between items-center group cursor-pointer"
            >
              <span className="truncate">{res.label}</span>
              <CornerDownRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-primary transition-opacity shrink-0 ml-2" />
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 min-h-screen bg-background dark:bg-zinc-950">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Inbox className="h-5.5 w-5.5 text-primary" /> Support Desk Console
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
            Resolve bookings disputes, refund workflows, and vehicle telemetry tracking complaints.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 sm:flex-initial h-8.5 rounded-lg text-xs" 
            onClick={() => { setTickets(initialTickets); toast.success("Reset data to default demo state"); }}
          >
            <RefreshCw className="h-4 w-4" /> Reset Demo
          </Button>
          <Button 
            size="sm" 
            className="flex-1 sm:flex-initial h-8.5 rounded-lg text-xs" 
            onClick={() => toast.info("Add ticket dialog schema - database bind required")}
          >
            <Plus className="h-4 w-4" /> Create Ticket
          </Button>
        </div>
      </div>

      {/* Grid Stats Header widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{
          label: "Total Tickets", val: stats.total, color: "text-foreground", icon: MessageSquare, bg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
        }, {
          label: "Open State", val: stats.open, color: "text-purple-500", icon: Inbox, bg: "bg-purple-500/10 text-purple-500"
        }, {
          label: "In Progress", val: stats.inProgress, color: "text-amber-500", icon: TrendingUp, bg: "bg-amber-500/10 text-amber-500"
        }, {
          label: "Critical Alerts", val: stats.critical, color: "text-red-500", icon: AlertTriangle, bg: "bg-red-500/10 text-red-500 animate-pulse"
        }].map((s, idx) => (
          <Card key={idx} className="shadow-xs dark:bg-zinc-900/50 border-border/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <h3 className={`text-xl md:text-2xl font-black ${s.color} mt-1`}>{s.val}</h3>
              </div>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className="h-4.5 w-4.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Responsive Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-270px)] min-h-[580px] relative">
        
        {/* LEFT COLUMN: Tickets lists (xl:4 cols) */}
        <div className={`xl:col-span-4 flex flex-col gap-3 h-full border border-border/60 rounded-xl bg-card overflow-hidden shadow-xs ${
          mobileView === 'list' ? 'flex' : 'hidden xl:flex'
        }`}>
          <div className="p-4 border-b border-border/60 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search complaint, name, phone..." 
                className="pl-9 bg-muted/20 border-border/60 text-xs h-9 rounded-lg"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Quick Filters */}
            <div className="flex gap-2 items-center flex-wrap">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Filter className="h-3 w-3" /> Filter:
              </div>
              
              <select 
                className="bg-transparent border border-border text-[10px] rounded-md px-1.5 py-0.5 outline-none text-foreground dark:bg-zinc-900 bg-muted/20"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select 
                className="bg-transparent border border-border text-[10px] rounded-md px-1.5 py-0.5 outline-none text-foreground dark:bg-zinc-900 bg-muted/20"
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as any)}
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Tickets Scroll Block */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Inbox className="h-8 w-8 text-zinc-400" />
                <p className="text-sm font-semibold">No complaints found</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicketId(ticket.id);
                    setMobileView('chat');
                  }}
                  className={`p-4 flex flex-col gap-2 cursor-pointer transition-all duration-200 relative overflow-hidden ${
                    selectedTicket.id === ticket.id ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Sliding spring layout indicator */}
                  {selectedTicket.id === ticket.id && (
                    <motion.div 
                      layoutId="activeTicketIndicator"
                      className="absolute inset-y-0 left-0 w-1.5 bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground/80">{ticket.id}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {ticket.lastUpdated}
                    </span>
                  </div>
                  <h4 className="text-xs md:text-sm font-semibold text-foreground line-clamp-1">{ticket.title}</h4>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                      <User className="h-3 w-3" /> {ticket.customerName}
                    </span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className={`text-[9px] px-1.5 h-4 rounded-sm border ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant="outline" className={`text-[9px] px-1.5 h-4 rounded-sm border ${statusColors[ticket.status]}`}>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Live chat console (xl:5 cols) */}
        <div className={`xl:col-span-5 flex flex-col h-full border border-border/60 rounded-xl bg-card overflow-hidden shadow-xs ${
          mobileView === 'chat' ? 'flex' : 'hidden xl:flex'
        }`}>
          {/* Conversation Header */}
          <div className="p-4 border-b border-border/60 bg-muted/10 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back to list on mobile */}
              <Button 
                variant="ghost" 
                size="icon-xs"
                className="xl:hidden shrink-0 border border-border"
                onClick={() => setMobileView('list')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-semibold truncate">{selectedTicket.id}</span>
                  <Badge className="bg-primary/20 text-primary border-primary/25 rounded-md text-[9px] h-4.5">
                    {selectedTicket.category}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground truncate mt-0.5">{selectedTicket.title}</h3>
              </div>
            </div>
            
            {/* Status change select & Toggle metadata button for mobile */}
            <div className="flex items-center gap-2">
              <select 
                className="bg-zinc-100 dark:bg-zinc-800 text-[11px] border border-border font-bold rounded-md px-2 py-1 text-foreground outline-none cursor-pointer"
                value={selectedTicket.status}
                onChange={e => changeTicketStatus(e.target.value as any)}
              >
                <option value="Open">🔴 Open</option>
                <option value="In Progress">🟡 Progress</option>
                <option value="Resolved">🟢 Resolved</option>
              </select>

              <Button
                variant="outline"
                size="icon-xs"
                className="xl:hidden shrink-0"
                onClick={() => setShowMobileSidebar(true)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Chat Conversation Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/5 dark:bg-zinc-950/40">
            <AnimatePresence initial={false}>
              {selectedTicket.messages.map((msg) => {
                if (msg.isInternal) {
                  return (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="mx-2 p-3 bg-amber-500/10 border border-dashed border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-400"
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Lock className="h-3.5 w-3.5" /> INTERNAL STAFF NOTE
                      </div>
                      <p className="leading-relaxed font-mono">{msg.content}</p>
                      <div className="text-[9px] text-amber-600/70 dark:text-amber-400/50 mt-1.5 flex items-center justify-between">
                        <span>Staff: {msg.senderName}</span>
                        <span>{formatTime(msg.timestamp)}</span>
                      </div>
                    </motion.div>
                  );
                }

                const isAdmin = msg.sender === 'admin';
                return (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className={`flex items-start gap-2.5 ${isAdmin ? 'justify-end' : ''}`}
                  >
                    {!isAdmin && (
                      <Avatar className="size-7 shrink-0 ring-1 ring-border">
                        <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-foreground font-bold text-[10px]">
                          {msg.senderName.split(' ').map(n=>n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`flex flex-col gap-0.5 max-w-[80%] ${isAdmin ? 'items-end' : ''}`}>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] font-bold text-foreground">{msg.senderName}</span>
                        <span className="text-[9px] text-muted-foreground">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      
                      <div className={`p-2.5 rounded-xl text-xs md:text-sm leading-relaxed ${
                        isAdmin 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-zinc-100 dark:bg-zinc-900 border border-border/40 text-foreground rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>

                    {isAdmin && (
                      <Avatar className="size-7 shrink-0 ring-1 ring-primary/20">
                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-[10px]">
                          AD
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5"
              >
                <Avatar className="size-7 shrink-0 ring-1 ring-border">
                  <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold">
                    {selectedTicket.customerName.split(' ').map(n=>n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-xl text-xs text-muted-foreground flex gap-1.5 items-center">
                  <span>{selectedTicket.customerName} typing</span>
                  <span className="flex gap-0.5 mt-0.5">
                    <span className="size-1 rounded-full bg-muted-foreground/60 animate-bounce"></span>
                    <span className="size-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="size-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Ticket Input controls */}
          <div className="p-4 border-t border-border/60 bg-muted/5 flex flex-col gap-3">
            {/* Sliding Pill Tab Switcher */}
            <div className="relative flex p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-full w-fit">
              <button
                className={`relative z-10 px-3 py-1 text-[11px] font-semibold transition-colors duration-200 rounded-full flex items-center gap-1 ${
                  replyMode === 'customer' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setReplyMode('customer')}
              >
                {replyMode === 'customer' && (
                  <motion.div
                    layoutId="activeReplyTab"
                    className="absolute inset-0 bg-primary rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
                <MessageSquare className="h-3 w-3" /> Reply Client
              </button>
              <button
                className={`relative z-10 px-3 py-1 text-[11px] font-semibold transition-colors duration-200 rounded-full flex items-center gap-1 ${
                  replyMode === 'internal' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setReplyMode('internal')}
              >
                {replyMode === 'internal' && (
                  <motion.div
                    layoutId="activeReplyTab"
                    className="absolute inset-0 bg-amber-600 rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
                <Lock className="h-3 w-3" /> Staff Note
              </button>
            </div>

            {/* Input Row */}
            <div className="flex gap-2 relative items-end">
              <div className="relative flex-1">
                <textarea 
                  className={`w-full min-h-[44px] max-h-[120px] rounded-lg border px-3 py-2 text-xs outline-none resize-none pr-10 bg-background transition-all ${
                    replyMode === 'internal' 
                      ? 'border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-amber-500/5' 
                      : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
                  }`}
                  placeholder={replyMode === 'internal' ? 'Write internal note...' : 'Type client response... (Press Send)'}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => toast.info("Cloudinary file manager selection trigger")}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </button>
              </div>
              <Button 
                className={`h-9 px-3 shrink-0 rounded-lg ${replyMode === 'internal' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary hover:bg-primary/95'}`}
                onClick={() => handleSendMessage()}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Desktop Info panel (xl:3 cols) */}
        <div className="hidden xl:flex xl:col-span-3 flex-col gap-4 h-full overflow-y-auto">
          {renderMetadataSidebar()}
        </div>

      </div>

      {/* MOBILE DRAWER: Customer context drawer slide-over panel */}
      <AnimatePresence>
        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 xl:hidden">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-xs"
            />
            {/* Drawer sheet body */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card border-l border-border p-4 shadow-2xl overflow-y-auto flex flex-col gap-4"
            >
              {/* Drawer Close line */}
              <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">User Context Info</span>
                <Button variant="ghost" size="icon-xs" className="h-7 w-7 rounded-full border border-border" onClick={() => setShowMobileSidebar(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Load sidebar contents inside drawer */}
              {renderMetadataSidebar()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
