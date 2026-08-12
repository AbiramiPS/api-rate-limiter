'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastProvider } from '../providers/ToastProvider';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
        <Sidebar isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          <Header onOpenMobileMenu={() => setIsMobileOpen(true)} />

          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
            {children}
          </main>

          <footer className="py-4 px-8 border-t border-slate-200/80 bg-white/50 text-center text-xs text-slate-400">
            API Rate Limiter Management System &bull; Spring Boot + Redis + Next.js Admin UI
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}
