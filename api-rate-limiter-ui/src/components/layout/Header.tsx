'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  Search,
  Database,
  Play,
  CheckCircle2,
  User as UserIcon,
  LogOut,
  Settings,
  X,
  ExternalLink,
} from 'lucide-react';
import { RateLimiterStore } from '@/lib/services/store';
import { formatTimeAgo } from '@/lib/utils';
import { useToast } from '../providers/ToastProvider';
import { getRedisHealth, getRateLimitEvents, executeRedisTest, RedisRateLimitEvent } from '@/services/api';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<RedisRateLimitEvent[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [redisActive, setRedisActive] = useState<boolean | null>(null);

  // Check Redis Connection health
  useEffect(() => {
    const checkRedis = async () => {
      try {
        const res = await getRedisHealth();
        setRedisActive(res.connected);
      } catch {
        setRedisActive(false);
      }
    };
    checkRedis();
    const interval = setInterval(checkRedis, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll real-time rate limit events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await getRateLimitEvents();
        setEvents(res.slice(0, 10)); // Display the latest 10 events
      } catch (err) {
        console.error('Failed to fetch events:', err);
      }
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000); // 3 seconds interval
    return () => clearInterval(interval);
  }, []);

  const handleQuickTest = async () => {
    try {
      const res = await executeRedisTest('C-001');
      const messageText = `Request count: ${res.currentCount}/${res.maxRequests} in ${res.windowValue} ${res.windowUnit}`;
      if (res.allowed) {
        toast('Simulated Request Allowed (C-001)', messageText, 'success');
      } else {
        toast('Simulated Request Blocked (C-001)', messageText, 'error');
      }
      // Immediately fetch events to refresh panel
      const resEvents = await getRateLimitEvents();
      setEvents(resEvents.slice(0, 10));
    } catch (err) {
      toast('Test Error', 'Failed to execute rate limit test.', 'error');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const term = searchQuery.trim();
    // Check if client exists
    const user = RateLimiterStore.getUserByClientId(term);
    if (user) {
      router.push(`/users/${user.clientId}`);
    } else {
      router.push(`/users?search=${encodeURIComponent(term)}`);
    }
    setSearchQuery('');
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between">
      {/* Left side: Mobile menu toggle + Context indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Redis Connection Badge */}
        {redisActive !== false ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Redis Active</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <Database className="w-3.5 h-3.5 text-rose-600" />
            <span>Redis Disconnected</span>
          </div>
        )}
      </div>

      {/* Center Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs md:max-w-md mx-4 hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search by Client ID (e.g. C-001, C-002)..."
            className="w-full pl-10 pr-4 py-1.5 text-xs md:text-sm bg-slate-100/80 border border-slate-200/80 rounded-full focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
      </form>

      {/* Right side controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Simulator Trigger Button */}
        <button
          onClick={handleQuickTest}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-2xs"
          title="Simulate 1 Request for C-001"
        >
          <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
          <span className="hidden sm:inline">Test Limiter</span>
        </button>

        {/* Notifications Popover Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="System Activity Logs"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Limiter Events
                </h4>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500 text-center">No recent rate-limit events</p>
                ) : (
                  events.map((event, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 transition-colors text-xs flex items-start gap-2.5">
                      <span className="mt-1 flex h-2 w-2 relative shrink-0">
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${event.allowed ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                          <span className="font-bold text-slate-700 truncate mr-2">{event.clientName}</span>
                          <span className="shrink-0">{formatTimeAgo(event.timestamp)}</span>
                        </div>
                        <p className="text-slate-800 font-semibold leading-snug">
                          HTTP {event.statusCode}: {event.message} ({event.currentCount}/{event.maxRequests} req in {event.windowValue} {event.windowUnit})
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                <Link
                  href="/redis"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  View Full Redis Log Monitor <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
              AD
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900">System Admin</p>
                <p className="text-xs text-slate-500">admin@rate-limiter.local</p>
              </div>

              <div className="py-1">
                <Link
                  href="/redis"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <Database className="w-4 h-4 text-slate-400" />
                  Redis Keys Monitor
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <Link
                  href="/login"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
