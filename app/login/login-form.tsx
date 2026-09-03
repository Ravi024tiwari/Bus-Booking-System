'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { loginSchema } from '@/lib/validations';
import { authClient } from '@/lib/auth-client';

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State variables
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));

    // Clear error for this field
    if (errors[name as keyof LoginInput]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Zod schema
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: any = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (path) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Please correct the highlighted validation errors.');
      return;
    }

    setLoading(true);

    try {
      // API call to the backend login endpoint using Axios
      const response = await axios.post('/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      const data = response.data;

      if (data.success) {
        toast.success(data.message || 'Login successful!');
        
        // Save profile in localStorage for instant synchronization
        if (typeof window !== 'undefined' && data.data) {
          localStorage.setItem('user_profile', JSON.stringify({
            id: data.data.id || data.data._id,
            name: data.data.name,
            email: data.data.email,
            role: data.data.role,
            avatar: data.data.profileImage || '/images/rohit-avatar.jpg'
          }));
        }

        // Redirect user based on role
        const role = data.data?.role;
        let destination = '/customer/dashboard';
        if (role === 'operator') {
          destination = '/operator/dashboard';
        } else if (role === 'admin') {
          destination = '/admin/dashboard';
        }

        const redirectParam = searchParams.get('redirect');
        if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
          if (role === 'admin' && redirectParam.startsWith('/admin')) {
            destination = redirectParam;
          } else if (role === 'operator' && redirectParam.startsWith('/operator')) {
            destination = redirectParam;
          } else if (role === 'passenger' && redirectParam.startsWith('/customer')) {
            destination = redirectParam;
          }
        }

        setTimeout(() => {
          router.replace(destination);
        }, 1200);
      } else {
        toast.error(data.message || 'Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Invalid email or password. Please try again.';
      toast.error(errorMessage);
      
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        setErrors(prev => ({ ...prev, email: 'Invalid email address' }));
      }
      if (errorMessage.includes('password') || errorMessage.includes('Password')) {
        setErrors(prev => ({ ...prev, password: 'Password is incorrect' }));
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
    <div className="w-full max-w-[460px] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] p-8 sm:p-10 flex flex-col gap-5 relative z-10 transition-shadow duration-300 hover:shadow-[0_20px_70px_rgba(0,0,0,0.06)]">
      
      {/* Header Graphic (Cute Bus Graphic) */}
      <Link href="/" className="flex flex-col items-center justify-center gap-1 select-none group cursor-pointer hover:opacity-90 transition-opacity">
        <div className="relative w-24 h-16 flex items-center justify-center group-hover:scale-105 transition-transform">
          <svg className="w-16 h-12 text-violet-500 fill-current" viewBox="0 0 64 48">
            {/* Bus Body */}
            <rect x="4" y="6" width="56" height="34" rx="6" />
            <rect x="2" y="16" width="2" height="16" rx="1" fill="#bbb" />
            <rect x="60" y="16" width="2" height="16" rx="1" fill="#bbb" />
            {/* Wheels */}
            <circle cx="16" cy="40" r="6" fill="#333" />
            <circle cx="16" cy="40" r="2.5" fill="#fff" />
            <circle cx="48" cy="40" r="6" fill="#333" />
            <circle cx="48" cy="40" r="2.5" fill="#fff" />
            {/* Windows */}
            <rect x="8" y="10" width="12" height="12" rx="2" fill="#fff" opacity="0.9" />
            <rect x="23" y="10" width="18" height="12" rx="2" fill="#fff" opacity="0.9" />
            <rect x="44" y="10" width="12" height="12" rx="2" fill="#fff" opacity="0.9" />
            {/* Lights */}
            <circle cx="8" cy="32" r="2" fill="#ffb703" />
            <circle cx="56" cy="32" r="2" fill="#e63946" />
          </svg>
          {/* Cute Trees behind */}
          <svg className="absolute left-[-10px] bottom-4 w-6 h-8 text-emerald-400 fill-current opacity-70" viewBox="0 0 24 32">
            <path d="M12,2 L22,18 L16,18 L20,24 L14,24 L18,28 L6,28 L10,24 L4,24 L8,18 L2,18 Z" />
            <rect x="11" y="28" width="2" height="4" fill="#8b5a2b" />
          </svg>
          <svg className="absolute right-[-10px] bottom-3 w-5 h-7 text-emerald-500 fill-current opacity-60" viewBox="0 0 24 32">
            <path d="M12,2 L22,18 L16,18 L20,24 L14,24 L18,28 L6,28 L10,24 L4,24 L8,18 L2,18 Z" />
            <rect x="11" y="28" width="2" height="4" fill="#8b5a2b" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5 mt-2">
          Login to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-[#ff2d88] font-black">TripGo</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
          Glad to see you again! 👋
        </p>
      </Link>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
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

        {/* PASSWORD INPUT */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Password
            </label>
            <Link 
              href="/forgot-password" 
              className="text-xs text-[#ff5666] font-semibold hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
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
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={loading || googleLoading}
              className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs text-red-500 font-semibold mt-0.5 animate-in fade-in slide-in-from-top-1">
              {errors.password}
            </span>
          )}
        </div>

        {/* REMEMBER ME CHECKBOX */}
        <div className="flex items-center justify-between mt-1 select-none">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={loading || googleLoading}
              className="w-4 h-4 rounded-md border-zinc-300 dark:border-zinc-700 text-[#ff5666] focus:ring-[#ff7c52]/30 accent-[#ff5666]"
            />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Remember me
            </span>
          </label>
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
              Sign In
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
        Don't have an account?{' '}
        <Link href="/register" className="text-[#ff2d88] font-black hover:underline transition-colors duration-200">
          Register Now
        </Link>
      </p>

    </div>
  );
}
