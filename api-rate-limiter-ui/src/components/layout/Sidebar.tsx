'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Layers,
  Zap,
  Database,
  Settings,
  Shield,
  LogOut,
  X,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Rate Plans', href: '/plans', icon: Layers },
  { label: 'Custom Rules', href: '/custom-rules', icon: Zap },
  { label: 'Redis Monitor', href: '/redis', icon: Database, badge: 'Live' },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl text-white shadow-md shadow-indigo-900/40 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight leading-tight block">
              LimitGuard
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">
              Rate Limit Admin
            </span>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation items */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Management
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all group',
                isActive
                  ? 'bg-indigo-600/90 text-white shadow-sm shadow-indigo-900/50'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />
                <span>{item.label}</span>
              </div>

              {item.badge ? (
                <span
                  className={cn(
                    'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full',
                    isActive ? 'bg-indigo-500 text-white' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  )}
                >
                  {item.badge}
                </span>
              ) : (
                <ChevronRight
                  className={cn(
                    'w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity',
                    isActive ? 'opacity-100 text-white' : 'text-slate-500'
                  )}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-900/80">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-white text-xs shadow-inner">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">System Admin</p>
            <p className="text-[10px] text-slate-400 truncate">admin@rate-limiter.local</p>
          </div>
          <Link
            href="/login"
            title="Logout visually"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:block h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Mobile drawer sidebar */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 md:hidden transition-transform duration-300 transform',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
