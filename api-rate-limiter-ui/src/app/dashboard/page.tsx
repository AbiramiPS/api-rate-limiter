'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { TrafficChart } from '@/components/dashboard/TrafficChart';
import { SimulatorWidget } from '@/components/dashboard/SimulatorWidget';
import { UserPlanService } from '@/services/userPlanService';
import { RatePlanService } from '@/services/ratePlanService';
import { CustomRuleService } from '@/services/customRuleService';
import {
  getRedisHealth,
  getRedisCounters,
  getRedisRules,
  resetRateLimitCounter,
  RedisHealth,
  RedisKeyInfo,
} from '@/services/api';
import { Page, UserPlanResponse, RatePlanResponse, UserCustomRuleResponse } from '@/types/api';
import { RedisStats, RedisKeyItem, WindowUnit } from '@/types';
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
  RefreshCw,
  HardDrive,
  Cpu,
  Clock,
  ExternalLink,
} from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isNetworkError(reason: any): boolean {
  if (!reason) return false;
  const message = (reason.message || '').toLowerCase();
  return (
    reason instanceof TypeError ||
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('networkerror') ||
    message.includes('fetch failed') ||
    reason.status === undefined ||
    reason.status === 0
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'UP' | 'DOWN'>('UP');
  const [redisStatus, setRedisStatus] = useState<'UP' | 'DOWN'>('UP');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mapped metrics
  const [usersCount, setUsersCount] = useState(0);
  const [plansCount, setPlansCount] = useState(0);
  const [customRulesCount, setCustomRulesCount] = useState(0);
  const [redisKeysCount, setRedisKeysCount] = useState(0);

  // Raw collections
  const [users, setUsers] = useState<UserPlanResponse[]>([]);
  const [plans, setPlans] = useState<RatePlanResponse[]>([]);
  const [customRules, setCustomRules] = useState<UserCustomRuleResponse[]>([]);
  const [health, setHealth] = useState<RedisHealth | null>(null);
  const [counters, setCounters] = useState<RedisKeyInfo[]>([]);
  const [rules, setRules] = useState<RedisKeyInfo[]>([]);

  // Filtering on active client requests chart
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('ALL');

  const loadDashboardData = useCallback(async () => {
    try {
      const [
        usersResult,
        plansResult,
        customRulesResult,
        healthResult,
        countersResult,
        rulesResult,
      ] = await Promise.allSettled([
        UserPlanService.getAllUsers(0, 1000),
        RatePlanService.getAllPlans(0, 100),
        CustomRuleService.searchCustomRules('', 0, 100),
        getRedisHealth(),
        getRedisCounters(),
        getRedisRules(),
      ]);

      // 1. Verify if Spring Boot backend is unreachable
      const isBackendUnreachable = 
        (usersResult.status === 'rejected' && isNetworkError(usersResult.reason)) ||
        (plansResult.status === 'rejected' && isNetworkError(plansResult.reason));

      if (isBackendUnreachable) {
        setBackendStatus('DOWN');
        setErrorMessage('Rate limiter backend is currently unreachable. Start the Spring Boot server.');
        setLoading(false);
        return;
      }

      setBackendStatus('UP');

      // 2. Set backend counts
      if (usersResult.status === 'fulfilled') {
        const uData = usersResult.value.content;
        setUsers(uData);
        setUsersCount(usersResult.value.totalElements);
      }
      if (plansResult.status === 'fulfilled') {
        const pData = plansResult.value.content;
        setPlans(pData);
        setPlansCount(plansResult.value.totalElements);
      }

      // 3. Set active rules and custom rules
      if (customRulesResult.status === 'fulfilled') {
        const crData = customRulesResult.value.content;
        setCustomRules(crData);

        // Count rules that are active for ENTERPRISE users
        if (usersResult.status === 'fulfilled') {
          const uData = usersResult.value.content;
          const enterpriseUsers = uData.filter(
            (u) => u.planName?.toUpperCase() === 'ENTERPRISE' && u.customRuleEnabled
          );
          const customRuleClientIds = new Set(crData.map((r) => r.clientId.toUpperCase()));
          let activeRules = 0;
          enterpriseUsers.forEach((u) => {
            if (customRuleClientIds.has(u.clientId.toUpperCase())) {
              activeRules++;
            }
          });
          setCustomRulesCount(activeRules);
        }
      }

      // 4. Verify Redis status
      let isRedisDisconnected = false;
      if (healthResult.status === 'rejected') {
        isRedisDisconnected = true;
      } else {
        const hData = healthResult.value;
        if (!hData.connected) {
          isRedisDisconnected = true;
        } else {
          setHealth(hData);
        }
      }

      if (isRedisDisconnected) {
        setRedisStatus('DOWN');
        setRedisKeysCount(0);
        setCounters([]);
        setRules([]);
      } else {
        setRedisStatus('UP');
        if (healthResult.status === 'fulfilled') {
          setHealth(healthResult.value);
        }
        
        let counterCount = 0;
        let ruleCount = 0;

        if (countersResult.status === 'fulfilled') {
          setCounters(countersResult.value);
          counterCount = countersResult.value.length;
        } else {
          setCounters([]);
        }

        if (rulesResult.status === 'fulfilled') {
          setRules(rulesResult.value);
          ruleCount = rulesResult.value.length;
        } else {
          setRules([]);
        }

        setRedisKeysCount(counterCount + ruleCount);
      }

      setErrorMessage(null);
    } catch (err: any) {
      console.error('Unexpected error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Polling every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData().catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleResetCounter = async (clientId: string) => {
    try {
      await resetRateLimitCounter(clientId);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to reset counter:', err);
    }
  };

  // Map Redis counters to live client usage rows
  const clientUsageList = React.useMemo(() => {
    const list: {
      clientId: string;
      clientName: string;
      planName: string;
      currentCount: number;
      maxRequests: number;
      windowValue: number;
      windowUnit: WindowUnit;
      ttlSeconds: number;
      status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'BLOCKED';
    }[] = [];

    // Parse rule limits
    const ruleConfigs: Record<string, { maxRequests: number; windowValue: number; windowUnit: WindowUnit }> = {};
    rules.forEach((r) => {
      let maxRequests = 0;
      let windowValue = 1;
      let windowUnit: WindowUnit = 'MINUTE';
      try {
        if (r.value) {
          const parsed = JSON.parse(r.value);
          maxRequests = parsed.maxRequests || 0;
          windowValue = parsed.windowValue || 1;
          windowUnit = (parsed.windowUnit || 'MINUTE') as WindowUnit;
        }
      } catch {}
      ruleConfigs[r.clientId] = { maxRequests, windowValue, windowUnit };
    });

    counters.forEach((c) => {
      const currentCount = parseInt(c.value || '0', 10);
      let maxRequests = 0;
      let windowValue = 1;
      let windowUnit: WindowUnit = 'MINUTE';

      if (ruleConfigs[c.clientId]) {
        maxRequests = ruleConfigs[c.clientId].maxRequests;
        windowValue = ruleConfigs[c.clientId].windowValue;
        windowUnit = ruleConfigs[c.clientId].windowUnit;
      } else {
        const user = users.find((u) => u.clientId.toUpperCase() === c.clientId.toUpperCase());
        if (user) {
          const isEnterprise = user.planName?.toUpperCase() === 'ENTERPRISE';
          if (isEnterprise && user.customRuleEnabled) {
            const customRule = customRules.find((cr) => cr.clientId.toUpperCase() === c.clientId.toUpperCase());
            if (customRule) {
              maxRequests = customRule.maxRequests;
              windowValue = customRule.windowValue;
              windowUnit = customRule.windowUnit as WindowUnit;
            }
          } else {
            const plan = plans.find((p) => p.planName?.toUpperCase() === user.planName?.toUpperCase());
            if (plan) {
              maxRequests = plan.maxRequests || 0;
              windowValue = plan.windowValue || 1;
              windowUnit = (plan.windowUnit || 'MINUTE') as WindowUnit;
            }
          }
        }
      }

      if (maxRequests === 0) return;

      const usagePct = (currentCount / maxRequests) * 100;
      let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'BLOCKED' = 'HEALTHY';
      if (usagePct >= 100) {
        status = 'BLOCKED';
      } else if (usagePct >= 90) {
        status = 'CRITICAL';
      } else if (usagePct >= 70) {
        status = 'WARNING';
      }

      // Find client name
      const user = users.find((u) => u.clientId.toUpperCase() === c.clientId.toUpperCase());
      const clientName = user ? user.clientName : c.clientId;

      list.push({
        clientId: c.clientId,
        clientName,
        planName: user ? user.planName : 'Unknown',
        currentCount,
        maxRequests,
        windowValue,
        windowUnit,
        ttlSeconds: c.ttl ?? -1,
        status,
      });
    });

    return list;
  }, [counters, rules, users, plans, customRules]);

  return (
    <MainLayout>
      <PageHeader
        title="API Rate Limiter Dashboard"
        description="Monitor API traffic, rate-limit enforcement, client usage, and Redis health in real time."
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
              New Rate Plan
            </Link>
            <button
              onClick={loadDashboardData}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              title="Refresh Dashboard metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Connection status warnings */}
        {backendStatus === 'DOWN' && (
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200/80 flex items-center gap-2 text-xs font-semibold text-rose-800 animate-in fade-in duration-200">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Rate Limiter Backend Unavailable. Please verify that the Spring Boot server is running.</span>
          </div>
        )}

        {backendStatus === 'UP' && redisStatus === 'DOWN' && (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 flex items-center gap-2 text-xs font-semibold text-amber-800 animate-in fade-in duration-200">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Redis Disconnected. Redis is currently unavailable. Start Redis to enable live rate limiting.</span>
          </div>
        )}

        {loading && backendStatus === 'UP' && users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200/80">
            Loading dashboard data...
          </div>
        ) : (
          <>
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="REGISTERED CLIENTS"
                value={usersCount}
                subtitle="Total API clients registered"
                icon={<Users className="w-5 h-5" />}
                iconBgColor="bg-sky-50 text-sky-600 border-sky-100"
              />
              <StatCard
                title="ACTIVE RATE PLANS"
                value={plansCount}
                subtitle="Currently active plans configured"
                icon={<Layers className="w-5 h-5" />}
                iconBgColor="bg-indigo-50 text-indigo-600 border-indigo-100"
              />
              <StatCard
                title="ACTIVE CUSTOM RULES"
                value={customRulesCount}
                subtitle="Enterprise custom override rules"
                icon={<Zap className="w-5 h-5" />}
                iconBgColor="bg-amber-50 text-amber-600 border-amber-100"
              />
              <StatCard
                title="REDIS KEYS"
                value={redisStatus === 'UP' ? redisKeysCount : 'N/A'}
                subtitle={redisStatus === 'UP' ? "Counters + rule cache keys" : "Redis disconnected"}
                icon={<Database className="w-5 h-5" />}
                iconBgColor={redisStatus === 'UP' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}
              />
            </div>

            {/* Traffic chart & Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TrafficChart
                  clientUsage={clientUsageList}
                  redisConnected={redisStatus === 'UP'}
                  selectedPlanFilter={selectedPlanFilter}
                  setSelectedPlanFilter={setSelectedPlanFilter}
                />
              </div>
              <div>
                <SimulatorWidget
                  users={users}
                  plans={plans}
                  customRules={customRules}
                  onRefresh={loadDashboardData}
                  onResetCounter={handleResetCounter}
                  redisConnected={redisStatus === 'UP'}
                />
              </div>
            </div>

            {/* Operational row: Client Usage & Redis Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Client Usage */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Client Rate-Limit Usage
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live usage metrics of top clients active in Redis
                    </p>
                  </div>
                  <Link
                    href="/users"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    All Clients <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  {redisStatus === 'DOWN' ? (
                    <p className="p-4 text-xs text-slate-500 text-center">
                      Client usage details unavailable while Redis is offline.
                    </p>
                  ) : clientUsageList.length === 0 ? (
                    <p className="p-4 text-xs text-slate-500 text-center">
                      No active client counts found in Redis. Start simulating traffic!
                    </p>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold tracking-wide uppercase text-[10px]">
                          <th className="px-4 py-2">Client ID</th>
                          <th className="px-4 py-2">Client Name</th>
                          <th className="px-4 py-2">Plan</th>
                          <th className="px-4 py-2">Usage</th>
                          <th className="px-4 py-2">Remaining</th>
                          <th className="px-4 py-2">TTL</th>
                          <th className="px-4 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {clientUsageList.map((row) => (
                          <tr key={row.clientId} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900">{row.clientId}</td>
                            <td className="px-4 py-3 font-medium">{row.clientName}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border text-slate-700 uppercase">
                                {row.planName}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {row.currentCount} / {row.maxRequests}
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {Math.max(0, row.maxRequests - row.currentCount)}
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {row.ttlSeconds === -1 ? 'No expiry' : `${row.ttlSeconds}s`}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  row.status === 'HEALTHY'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : row.status === 'WARNING'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : row.status === 'CRITICAL'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                    : 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold'
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Redis Health Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    Redis Cache Health
                  </h3>
                  <Link
                    href="/redis"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Redis Monitor <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Connection Status</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        redisStatus === 'UP'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {redisStatus === 'UP' ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Redis Version</span>
                    <span className="text-slate-800 font-mono">
                      {redisStatus === 'UP' && health ? health.redisVersion : 'Unavailable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Memory Usage</span>
                    <span className="text-slate-800 font-mono">
                      {redisStatus === 'UP' && health ? formatBytes(health.memoryUsed) : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Total Tracked Keys</span>
                    <span className="text-slate-800 font-mono">
                      {redisStatus === 'UP' && health ? health.totalKeys : '0'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Cache Efficiency
                    </p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Cache hit statistics are not tracked by the backend rate limiter server.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent System Activity & Quick Workflows */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent System Activity */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Recent System Activity
                  </h3>
                </div>
                <div className="flex items-center justify-center p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                  No recent system activity is tracked by the backend.
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Quick Admin Workflows
                </h3>
                <div className="space-y-2 text-xs font-semibold">
                  <Link
                    href="/users/new"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80 transition-colors group animate-in fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Register New API Client User</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </Link>

                  <Link
                    href="/custom-rules/new"
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 text-amber-950 border border-amber-200/80 transition-colors group animate-in fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>Create Enterprise Custom Rule</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/plans/new"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80 transition-colors group animate-in fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-sky-600" />
                      <span>Create New Rate Limit Tier</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
                  </Link>

                  <Link
                    href="/redis"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80 transition-colors group animate-in fade-in"
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
          </>
        )}
      </div>
    </MainLayout>
  );
}
