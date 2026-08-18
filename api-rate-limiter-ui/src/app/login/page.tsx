'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@rate-limiter.local');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Container Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Branding */}
        <div className="bg-slate-900 p-8 text-center border-b border-slate-800 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-900/50 mb-3">
            <Activity className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">LimitGuard Admin</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            API Rate Limiter Management System
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rate-limiter.local"
                className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                required
              />
            </div>
          </div>

          {/* Quick Demo Info Pill */}
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <p className="text-[11px] leading-tight">
              Pre-authenticated Admin session. Click Sign In to enter dashboard.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In to Dashboard
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
