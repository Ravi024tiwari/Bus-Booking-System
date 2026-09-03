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
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import { registerSchema } from '@/lib/validations';
import { authClient } from '@/lib/auth-client';

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
  const [googleLoading, setGoogleLoading] = useState(false);
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
    const pass = formData.password;
    if (!pass) {
      setPasswordStrength({ score: 0, label: 'Weak', color: 'bg-zinc-300 dark:bg-zinc-700', text: 'text-zinc-400' });
      return;
    }

    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) {
      setPasswordStrength({ score: 1, label: 'Weak', color: 'bg-red-500', text: 'text-red-500' });
    } else if (score === 2 || score === 3) {
      setPasswordStrength({ score: 2, label: 'Medium', color: 'bg-amber-500', text: 'text-amber-500' });
    } else {
      setPasswordStrength({ score: 3, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' });
    }
  }, [formData.password]);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));

    // Clear error for this field
    if (errors[name as keyof ClientRegisterInput]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle Role Change
  const handleRoleChange = (role: 'passenger' | 'operator') => {
    setFormData(prev => ({ ...prev, role }));
  };

  // Form Submission Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate using Zod schema
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
      toast.error('Please fix the highlighted errors before submitting.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });

      const data = response.data;

      if (data.success) {
        toast.success(data.message || 'Registration successful! Redirecting to login...');
        
        setTimeout(() => {
          router.replace('/login');
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

  // Google Sign-In with Better-Auth
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/customer/dashboard',
      });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'An error occurred during Google sign-in.');
    } finally {
      setGoogleLoading(false);
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
        <Link href="/" className="flex items-center gap-3 relative z-10 hover:opacity-90 transition-opacity cursor-pointer group w-fit">
          <div className="bg-white/10 p-2.5 rounded-2xl border border-white/15 backdrop-blur-md flex items-center justify-center group-hover:scale-105 transition-transform">
            <Bus className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-extrabold text-2xl text-white tracking-tight leading-none">Trip</span>
              <span className="font-extrabold text-2xl text-[#ff5666] tracking-tight leading-none">Go</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase mt-1 block">Bus Booking</span>
          </div>
        </Link>

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
          
          {/* Mobile Brand Logo */}
          <div className="flex lg:hidden justify-center mb-1">
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer hover:opacity-90 transition-opacity">
              <div className="bg-gradient-to-tr from-[#ff7c52] to-[#ff2d88] p-2 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform">
                <Bus className="h-5 w-5" />
              </div>
              <div className="flex items-center">
                <span className="font-extrabold text-xl text-zinc-900 dark:text-white tracking-tight leading-none">Trip</span>
                <span className="font-extrabold text-xl text-[#ff5666] tracking-tight leading-none">Go</span>
              </div>
            </Link>
          </div>

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
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
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
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
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
                  : 'border-zinc-200/80 dark:border-zinc-800 focus-within:border-[#ff7c52]'
              }`}>
                <User className="h-4 w-4 text-zinc-400 shrink-0" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading || googleLoading}
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
                />
              </div>
              {errors.name && (
                <span className="text-xs text-red-500 font-semibold mt-0.5 animate-in fade-in slide-in-from-top-1">
                  {errors.name}
                </span>
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
                  : 'border-zinc-200/80 dark:border-zinc-800 focus-within:border-[#ff7c52]'
              }`}>
                <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading || googleLoading}
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
                />
              </div>
              {errors.email && (
                <span className="text-xs text-red-500 font-semibold mt-0.5 animate-in fade-in slide-in-from-top-1">
                  {errors.email}
                </span>
              )}
            </div>

            {/* PHONE NUMBER INPUT */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Phone Number
              </label>
              <div className={`flex items-center gap-2 border bg-white/50 dark:bg-zinc-950/30 rounded-2xl px-4 py-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#ff7c52]/30 ${
                errors.phone 
                  ? 'border-red-500/50 focus-within:border-red-500' 
                  : 'border-zinc-200/80 dark:border-zinc-800 focus-within:border-[#ff7c52]'
              }`}>
                {/* Country Code Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryMenu(!showCountryMenu)}
                    className="flex items-center gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white pr-2 border-r border-zinc-200 dark:border-zinc-700 focus:outline-none cursor-pointer"
                  >
                    <span>{formData.countryCode}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {showCountryMenu && (
                    <div className="absolute top-full left-0 mt-2 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-50">
                      {countryCodes.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, countryCode: c.code }));
                            setShowCountryMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between cursor-pointer"
                        >
                          <span>{c.name}</span>
                          <span className="font-semibold text-zinc-400">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Phone className="h-4 w-4 text-zinc-400 shrink-0 ml-1" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading || googleLoading}
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
                />
              </div>
              {errors.phone && (
                <span className="text-xs text-red-500 font-semibold mt-0.5 animate-in fade-in slide-in-from-top-1">
                  {errors.phone}
                </span>
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
                  : 'border-zinc-200/80 dark:border-zinc-800 focus-within:border-[#ff7c52]'
              }`}>
                <Lock className="h-4 w-4 text-zinc-400 shrink-0" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create strong password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading || googleLoading}
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {formData.password && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`} />
                  </div>
                  <span className={`text-[10px] font-bold ${passwordStrength.text}`}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}

              {errors.password && (
                <span className="text-xs text-red-500 font-semibold mt-0.5 animate-in fade-in slide-in-from-top-1">
                  {errors.password}
                </span>
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
                  : 'border-zinc-200/80 dark:border-zinc-800 focus-within:border-[#ff7c52]'
              }`}>
                <Lock className="h-4 w-4 text-zinc-400 shrink-0" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading || googleLoading}
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-red-500 font-semibold mt-0.5 animate-in fade-in slide-in-from-top-1">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* TERMS AND CONDITIONS CHECKBOX */}
            <div className="flex flex-col gap-1 mt-1 select-none">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  disabled={loading || googleLoading}
                  className="w-4 h-4 mt-0.5 rounded-md border-zinc-300 dark:border-zinc-700 text-[#ff5666] focus:ring-[#ff7c52]/30 accent-[#ff5666]"
                />
                <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-[#ff5666] font-semibold hover:underline">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-[#ff5666] font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && (
                <span className="text-xs text-red-500 font-semibold ml-7">
                  {errors.agreeToTerms}
                </span>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] hover:from-[#ff6b3d] hover:to-[#e62277] text-white text-sm font-bold rounded-2xl shadow-[0_10px_25px_rgba(255,45,136,0.3)] hover:shadow-[0_12px_30px_rgba(255,45,136,0.45)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group"
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

          {/* EXCLUSIVE SOCIAL LOGIN - GOOGLE (Better-Auth) */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 bg-white/70 dark:bg-zinc-950/40 text-zinc-800 dark:text-zinc-100 font-bold text-xs sm:text-sm shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 group"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-[#ea4335] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5 shrink-0 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Privacy callout banner */}
          <div className="bg-violet-500/5 border border-violet-500/10 dark:border-violet-500/20 rounded-2xl p-3.5 flex gap-3 text-[11px] text-violet-700 dark:text-violet-300 leading-relaxed shadow-xs items-start select-none">
            <ShieldAlert className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-violet-800 dark:text-violet-200 mb-0.5">We never share your information</span>
              Your privacy and account security are our top priority.
            </div>
          </div>

          {/* FOOTER */}
          <p className="text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none">
            Already have an account?{' '}
            <Link href="/login" className="text-[#ff2d88] font-black hover:underline transition-colors duration-200">
              Sign In
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}
