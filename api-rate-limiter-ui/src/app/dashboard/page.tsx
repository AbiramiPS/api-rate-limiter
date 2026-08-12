'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { TrafficChart } from '@/components/dashboard/TrafficChart';
import { SimulatorWidget } from '@/components/dashboard/SimulatorWidget';
import { RateLimiterStore } from '@/lib/services/store';
import { SystemStats, ActivityLog } from '@/types';
import { formatNumber, formatTimeAgo } from '@/lib/utils';
import {
  Users,
  Layers,
  Zap,
  Database,
  Activity,
  Plus,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<SystemStats>(RateLimiterStore.getRedisStats() as any);
  const [usersCount, setUsersCount] = useState(0);
  const [plansCount, setPlansCount] = useState(0);
  const [customRulesCount, setCustomRulesCount] = useState(0);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const users = RateLimiterStore.getUsers();
    const plans = RateLimiterStore.getPlans();
    const rules = RateLimiterStore.getCustomRules();
    const redisStats = RateLimiterStore.getRedisStats();

    setUsersCount(users.length);
    setPlansCount(plans.length);
    setCustomRulesCount(rules.filter((r) => r.enabled).length);
    setLogs(RateLimiterStore.getLogs().slice(0, 6));
  }, []);

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard Overview"
        description="Monitor active rate limiting rules, Redis cache status, and client request enforcement in real-time."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/users/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Client
            </Link>
            <Link
              href="/plans/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Plan
            </Link>
          </div>
        }
      />

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Registered Clients"
          value={usersCount}
          subtitle="100% active SLA status"
          change="+12% this week"
          changeType="positive"
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-sky-50 text-sky-600 border-sky-100"
        />
        <StatCard
          title="Active Rate Plans"
          value={plansCount}
          subtitle="Free, Basic, Pro & Enterprise"
          icon={<Layers className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600 border-indigo-100"
        />
        <StatCard
          title="Custom Rules Active"
          value={customRulesCount}
          subtitle="VIP Enterprise overrides"
          change="3 Overrides"
          changeType="positive"
          icon={<Zap className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600 border-amber-100"
        />
        <StatCard
          title="Redis Tracked Keys"
          value={RateLimiterStore.getRedisKeys().length}
          subtitle="Counters & Rule Caches"
          change="99.4% Hit Ratio"
          changeType="positive"
          icon={<Database className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
      </div>

      {/* Main Interactive Row: Traffic Chart & Rate Limiter Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TrafficChart />
        <SimulatorWidget />
      </div>

      {/* Bottom Section: Recent Enforcement Logs & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent System Activity Logs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Recent Rate Limiter Logs
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of rule evaluations, throttled HTTP 429s, and cache updates
              </p>
            </div>
            <Link
              href="/redis"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Redis Monitor <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      log.status === 'DANGER'
                        ? 'bg-rose-500'
                        : log.status === 'WARNING'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.clientName}</span>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {log.clientId}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 leading-snug">{log.details}</p>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-slate-400 shrink-0">
                  {formatTimeAgo(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Admin Navigation Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Quick Admin Workflows
          </h3>

          <div className="space-y-2 text-xs font-semibold">
            <Link
              href="/users/new"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Register New API Client User</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </Link>

            <Link
              href="/custom-rules/new"
              className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 text-amber-950 border border-amber-200/80 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Create Enterprise Custom Rule</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/plans/new"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>Define New Rate Limit Tier</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            </Link>

            <Link
              href="/redis"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Flush / Inspect Redis Counters</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
