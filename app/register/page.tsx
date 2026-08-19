'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Bus, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Ticket, 
  Gift, 
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { registerSchema } from '@/lib/validations';

// Extend the backend registerSchema for client-side form features (phone & confirmPassword)
const clientRegisterSchema = registerSchema.extend({
  phone: z.string().trim().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the Terms & Conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;

export default function RegisterPage() {
  const router = useRouter();
  
  // State variables
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    password: '',
    confirmPassword: '',
    role: 'passenger' as 'passenger' | 'operator',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ClientRegisterInput | 'confirmPassword', string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: 'bg-red-500', text: 'text-red-500' });
  const [loading, setLoading] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);

  const countryCodes = [
    { code: '+91', name: 'India' },
    { code: '+1', name: 'USA/Canada' },
    { code: '+44', name: 'UK' },
    { code: '+971', name: 'UAE' },
    { code: '+65', name: 'Singapore' },
  ];

  // Calculate password strength in real-time
  useEffect(() => {
    const pwd = formData.password;
    if (!pwd) {
      setPasswordStrength({ score: 0, label: 'Weak', color: 'bg-red-500', text: 'text-red-500' });
      return;
    }

    let score = 0;
    
    // Length check
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    
    // Complexity checks
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSymbols = /[^a-zA-Z0-9]/.test(pwd);

    if (hasLetters && hasNumbers) score += 1;
    if (hasLetters && hasNumbers && hasSymbols) score += 1;

    // Normalizing to 1-4 scale
    const finalScore = Math.max(1, Math.min(score, 4));

    let label = 'Weak';
    let color = 'bg-red-500';
    let text = 'text-red-500';

    if (finalScore === 2) {
      label = 'Fair';
      color = 'bg-orange-500';
      text = 'text-orange-500';
    } else if (finalScore === 3) {
      label = 'Good';
      color = 'bg-yellow-500';
      text = 'text-yellow-500';
    } else if (finalScore === 4) {
      label = 'Strong';
      color = 'bg-emerald-500';
      text = 'text-emerald-500';
    }

    setPasswordStrength({ score: finalScore, label, color, text });
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));

    if (errors[name as keyof ClientRegisterInput]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleRoleChange = (role: 'passenger' | 'operator') => {
    setFormData((prev) => ({ ...prev, role }));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = clientRegisterSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: any = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (path) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      
      // Toast notification for overall errors
      toast.error('Please correct the highlighted validation errors.');
      return;
    }

    setLoading(true);
    
    try {
      // API call to the backend registration endpoint using Axios
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      const data = response.data;

      if (data.success) {
        toast.success(data.message || 'Account created successfully!');
        
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        toast.error(data.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'An error occurred during registration. Please check your connection.';
      toast.error(errorMessage);
      
      if (error.response?.data?.message && error.response.data.message.includes('Email')) {
        setErrors(prev => ({ ...prev, email: 'Email address is already in use' }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 font-sans">
      
      {/* LEFT SIDEBAR PANEL (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-b from-[#0e0a30] via-[#090620] to-[#050314] text-white p-12 flex-col justify-between relative overflow-hidden shrink-0 border-r border-zinc-900">
        
        {/* Subtle decorative glowing backdrops */}
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] bg-gradient-to-tr from-pink-500 to-indigo-500 rounded-full blur-[100px] opacity-15 pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[400px] h-[400px] bg-gradient-to-tr from-orange-500 to-violet-500 rounded-full blur-[120px] opacity-15 pointer-events-none" />
        
        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/10 p-2.5 rounded-2xl border border-white/15 backdrop-blur-md flex items-center justify-center">
            <Bus className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-extrabold text-2xl text-white tracking-tight leading-none">Trip</span>
              <span className="font-extrabold text-2xl text-[#ff5666] tracking-tight leading-none">Go</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase mt-1 block">Bus Booking</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="my-auto py-12 flex flex-col gap-6 relative z-10">
          <h2 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.15]">
            Your Journey<br />Starts Here
          </h2>
          <div className="h-1.5 w-16 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] rounded-full" />
          <p className="text-zinc-400 text-sm max-w-sm leading-relaxed">
            Create your account and unlock seamless bus booking, easy cancellations and exclusive offers just for you!
          </p>
          
          {/* Main Bus Image Illustration */}
          <div className="relative mt-8 rounded-[2.5rem] overflow-hidden border border-white/10 aspect-[4/3] shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
            <Image 
              src="/images/bus-hero.jpg" 
              alt="TripGo Scenic Sunset Route"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <div>
                <span className="text-white font-bold text-base block">TripGo Sunset Cruiser</span>
                <span className="text-zinc-300 text-xs mt-0.5 block">Premium Volvo Multi-Axle AC Sleeper</span>
              </div>
              <span className="text-white text-xs bg-gradient-to-r from-orange-500 to-pink-500 backdrop-blur-md px-3 py-1 rounded-full font-semibold shadow-lg">
                Premium
              </span>
            </div>
          </div>
        </div>

        {/* Feature List */}
        <div className="flex flex-col gap-6 mt-auto relative z-10">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Secure & Safe</h4>
              <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">Your data is protected with industry-standard security.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/25">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Easy Booking</h4>
              <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">Book tickets in just a few clicks anytime, anywhere.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/25">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Exclusive Offers</h4>
              <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">Get access to special discounts and exciting deals.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT REGISTER FORM PANEL */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 relative overflow-hidden">
        
        {/* Soft floating blur backdrops for glassmorphism layout */}
        <div className="absolute top-[-5%] left-[-5%] w-[250px] h-[250px] bg-[#ff7c52]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[300px] h-[300px] bg-[#ff2d88]/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Card Component */}
        <div className="w-full max-w-[500px] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] p-8 sm:p-10 flex flex-col gap-6 relative z-10 transition-shadow duration-300 hover:shadow-[0_20px_70px_rgba(0,0,0,0.06)]">
          
          {/* Header */}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
              Create Your Account <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Join <span className="text-[#ff5666] font-semibold">TripGo</span> and start your journey with us.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* ROLE SELECTOR (Passenger vs. Operator) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Select Account Type
              </label>
              <div className="grid grid-cols-2 p-1.5 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200/40 dark:border-zinc-700/40 relative">
                <button
                  type="button"
                  onClick={() => handleRoleChange('passenger')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    formData.role === 'passenger'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-md'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Ticket className="h-4 w-4" />
                  Passenger
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('operator')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    formData.role === 'operator'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-md'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Bus className="h-4 w-4" />
                  Bus Operator
                </button>
              </div>
            </div>

            {/* FULL NAME INPUT */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Full Name
              </label>
              <div className={`flex items-center gap-3 border bg-white/50 dark:bg-zinc-950/30 rounded-2xl px-4 py-3.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#ff7c52]/30 ${
                errors.name 
                  ? 'border-red-500/50 focus-within:border-red-500' 
                  : 'border-zinc-200 dark:border-zinc-800 focus-within:border-[#ff7c52]'
              }`}>
                <User className="h-5 w-5 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-transparent border-none outline-none w-full text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
                />
              </div>
              {errors.name && (
                <span className="text-xs text-red-500 font-medium px-1 mt-0.5">{errors.name}</span>
              )}
            </div>

            {/* EMAIL INPUT */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className={`flex items-center gap-3 border bg-white/50 dark:bg-zinc-950/30 rounded-2xl px-4 py-3.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#ff7c52]/30 ${
                errors.email 
                  ? 'border-red-500/50 focus-within:border-red-500' 
                  : 'border-zinc-200 dark:border-zinc-800 focus-within:border-[#ff7c52]'
              }`}>
                <Mail className="h-5 w-5 text-zinc-400 shrink-0" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-transparent border-none outline-none w-full text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
                />
              </div>
              {errors.email && (
                <span className="text-xs text-red-500 font-medium px-1 mt-0.5">{errors.email}</span>
              )}
            </div>

            {/* PHONE NUMBER INPUT */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Phone Number
              </label>
              <div className={`flex items-center border bg-white/50 dark:bg-zinc-950/30 rounded-2xl px-4 py-3.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#ff7c52]/30 ${
                errors.phone 
                  ? 'border-red-500/50 focus-within:border-red-500' 
                  : 'border-zinc-200 dark:border-zinc-800 focus-within:border-[#ff7c52]'
              }`}>
                <div className="flex items-center gap-2 pr-3 border-r border-zinc-200 dark:border-zinc-800 relative">
                  <Phone className="h-5 w-5 text-zinc-400 shrink-0" />
                  <button
                    type="button"
                    onClick={() => setShowCountryMenu(!showCountryMenu)}
                    className="flex items-center gap-1 text-sm font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none"
                  >
                    {formData.countryCode}
                    <ChevronDown className="h-3 w-3 text-zinc-400" />
                  </button>

                  {/* Custom Country Menu dropdown */}
                  {showCountryMenu && (
                    <div className="absolute top-[45px] left-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 z-25 min-w-[130px]">
                      {countryCodes.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, countryCode: item.code }));
                            setShowCountryMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex justify-between items-center"
                        >
                          <span>{item.name}</span>
                          <span className="font-bold text-[#ff5666]">{item.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-transparent border-none outline-none w-full text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 pl-3"
                />
              </div>
              {errors.phone && (
                <span className="text-xs text-red-500 font-medium px-1 mt-0.5">{errors.phone}</span>
              )}
            </div>

            {/* PASSWORD INPUT */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Password
              </label>
              <div className={`flex items-center gap-3 border bg-white/50 dark:bg-zinc-950/30 rounded-2xl px-4 py-3.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#ff7c52]/30 ${
                errors.password 
                  ? 'border-red-500/50 focus-within:border-red-500' 
                  : 'border-zinc-200 dark:border-zinc-800 focus-within:border-[#ff7c52]'
              }`}>
                <Lock className="h-5 w-5 text-zinc-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-transparent border-none outline-none w-full text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* PASSWORD STRENGTH GAUGE */}
              {formData.password && (
                <div className="flex flex-col gap-1.5 mt-1 px-1">
                  <div className="grid grid-cols-4 gap-1.5 h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`} />
                    <div className={`h-full rounded-full transition-all duration-500 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`} />
                    <div className={`h-full rounded-full transition-all duration-500 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`} />
                    <div className={`h-full rounded-full transition-all duration-500 ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-transparent'}`} />
                  </div>
                  <span className="text-[11px] font-bold text-zinc-500">
                    Password strength: <span className={passwordStrength.text}>{passwordStrength.label}</span>
                  </span>
                </div>
              )}

              {errors.password && (
                <span className="text-xs text-red-500 font-medium px-1 mt-0.5">{errors.password}</span>
              )}
            </div>

            {/* CONFIRM PASSWORD INPUT */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className={`flex items-center gap-3 border bg-white/50 dark:bg-zinc-950/30 rounded-2xl px-4 py-3.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#ff7c52]/30 ${
                errors.confirmPassword 
                  ? 'border-red-500/50 focus-within:border-red-500' 
                  : 'border-zinc-200 dark:border-zinc-800 focus-within:border-[#ff7c52]'
              }`}>
                <Lock className="h-5 w-5 text-zinc-400 shrink-0" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-transparent border-none outline-none w-full text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-red-500 font-medium px-1 mt-0.5">{errors.confirmPassword}</span>
              )}
            </div>

            {/* TERMS & CONDITIONS CHECKBOX */}
            <div className="flex flex-col gap-1 mt-1">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white/50 dark:bg-zinc-950/20 peer-checked:bg-gradient-to-r peer-checked:from-[#ff7c52] peer-checked:to-[#ff2d88] peer-checked:border-transparent transition-all duration-200 flex items-center justify-center" />
                  <svg
                    className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold">
                  I agree to the <span className="text-[#ff2d88] font-bold hover:underline cursor-pointer">Terms & Conditions</span> and <span className="text-[#ff2d88] font-bold hover:underline cursor-pointer">Privacy Policy</span>
                </span>
              </label>
              {errors.agreeToTerms && (
                <span className="text-xs text-red-500 font-medium px-1.5 mt-0.5">{errors.agreeToTerms}</span>
              )}
            </div>

            {/* REGISTER NOW SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white font-extrabold text-sm shadow-[0_10px_20px_rgba(255,45,136,0.25)] hover:shadow-[0_10px_25px_rgba(255,45,136,0.35)] active:scale-[0.98] active:shadow-[0_5px_10px_rgba(255,45,136,0.25)] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-75 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Register Now
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>

          </form>

          {/* DIVIDER */}
          <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400 uppercase select-none">
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
            <span>or continue with</span>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
          </div>

          {/* SOCIAL LOGIN BUTTONS */}
          <div className="grid grid-cols-3 gap-3">
            {/* Google */}
            <button 
              type="button"
              className="flex items-center justify-center py-3 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 bg-white/50 dark:bg-zinc-950/20 active:scale-95 transition-all duration-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#ea4335"
                  d="M12 5.04c1.67 0 3.19.57 4.37 1.7l3.26-3.26C17.65 1.55 15.03.88 12 .88 7.37.88 3.42 3.52 1.48 7.34l3.87 3C6.31 7.34 8.93 5.04 12 5.04z"
                />
                <path
                  fill="#4285f4"
                  d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.52z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.35 14.34a7.16 7.16 0 0 1 0-4.68l-3.87-3a11.96 11.96 0 0 0 0 10.68l3.87-3z"
                />
                <path
                  fill="#34a853"
                  d="M12 23.12c3.24 0 5.95-1.08 7.94-2.91l-3.66-2.84c-1.01.68-2.3 1.08-4.28 1.08-3.07 0-5.69-2.3-6.62-5.3l-3.87 3A11.98 11.98 0 0 0 12 23.12z"
                />
              </svg>
            </button>

            {/* Facebook */}
            <button 
              type="button"
              className="flex items-center justify-center py-3 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 bg-white/50 dark:bg-zinc-950/20 active:scale-95 transition-all duration-200"
            >
              <svg className="h-5 w-5 text-[#1877f2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            {/* Apple */}
            <button 
              type="button"
              className="flex items-center justify-center py-3 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 bg-white/50 dark:bg-zinc-950/20 active:scale-95 transition-all duration-200"
            >
              <svg className="h-5 w-5 text-zinc-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
              </svg>
            </button>
          </div>

          {/* FOOTER */}
          <p className="text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none">
            Already have an account?{' '}
            <Link href="/login" className="text-[#ff2d88] font-black hover:underline transition-colors duration-200">
              Login
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}
