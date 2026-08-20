import React from 'react';
import Link from 'next/link';
import { ShieldAlert, RefreshCw, LogOut, User, Clock, Lock } from 'lucide-react';
import { handleLogoutAction } from './actions';

interface UnverifiedOperatorProps {
  operatorName: string;
  status?: 'PENDING' | 'REJECTED' | string;
}

export default function UnverifiedOperator({ operatorName, status = 'PENDING' }: UnverifiedOperatorProps) {
  const isRejected = status === 'REJECTED';
  
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6 select-none bg-zinc-50 dark:bg-zinc-950">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }

        @keyframes blink-cursor {
          from, to { border-color: transparent }
          50% { border-color: #ff7c52 }
        }

        .typewriter-box {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 2.5px solid transparent;
          width: 0;
          animation: 
            typing 2s steps(30, end) 0.5s forwards,
            blink-cursor 0.75s step-end infinite;
        }
      `}} />

      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
        
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88]" />

        <div className="relative z-10 flex flex-col gap-8">
          
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-[#ff7c52]/10 text-[#ff7c52] flex items-center justify-center shadow-inner">
              <ShieldAlert className="h-8 w-8 animate-pulse" />
            </div>
            
            <div className="h-8 flex items-center justify-center w-full">
              <span className="typewriter-box text-sm sm:text-base md:text-lg font-black tracking-wider uppercase text-zinc-900 dark:text-white">
                {isRejected ? "STATUS: REJECTED BY ADMIN" : "STATUS: PENDING ADMIN APPROVAL"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="h-8 w-8 rounded-lg bg-[#ff7c52]/10 text-[#ff7c52] flex items-center justify-center shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Account Owner</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">{operatorName}</span>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Status</span>
                <span className={`text-xs font-bold mt-0.5 ${isRejected ? 'text-rose-500' : 'text-amber-500'}`}>{status}</span>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Lock className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Portal Access</span>
                <span className="text-xs font-bold text-rose-500 mt-0.5">RESTRICTED</span>
              </div>
            </div>

          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/60 flex flex-col gap-2">
            <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Verification Required</span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
              {isRejected 
                ? "Your operator verification request has been declined. Please contact our administrative support desk to review compliance requirements or submit an appeal."
                : "Your operator account details are currently undergoing verification. Once the administrators approve your registration, you will receive full clearance to manage fleets, routes, schedules, and payouts."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link 
              href="/operator/dashboard" 
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white hover:opacity-90 shadow-md shadow-[#ff2d88]/20 transition-all duration-200 text-xs font-extrabold flex items-center justify-center gap-2 select-none"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Link>
            
            <form action={handleLogoutAction} className="w-full sm:w-auto">
              <button 
                type="submit" 
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-extrabold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
