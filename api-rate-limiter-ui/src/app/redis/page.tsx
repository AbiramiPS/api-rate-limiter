'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { RedisStatusCard } from '@/components/redis/RedisStatusCard';
import { RedisKeyTable } from '@/components/redis/RedisKeyTable';
import { SimulatorWidget } from '@/components/dashboard/SimulatorWidget';
import { ErrorState } from '@/components/ui/ErrorState';
import { RefreshCw } from 'lucide-react';
import {
  getRedisHealth,
  getRedisCounters,
  getRedisRules,
  resetRateLimitCounter,
  flushRedisKeys,
  RedisHealth,
  RedisKeyInfo,
} from '@/services/api';
import { UserPlanService } from '@/services/userPlanService';
import { RatePlanService } from '@/services/ratePlanService';
import { CustomRuleService } from '@/services/customRuleService';
import { UserPlanResponse, RatePlanResponse, UserCustomRuleResponse } from '@/types/api';
import { RedisStats, RedisKeyItem, WindowUnit } from '@/types';

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

export default function RedisPage() {
  const [loading, setLoading] = useState(true);
  const [redisStatus, setRedisStatus] = useState<'LOADING' | 'CONNECTED' | 'DISCONNECTED' | 'BACKEND_DOWN'>('LOADING');
  const [redisErrorMessage, setRedisErrorMessage] = useState<string | null>(null);

  // Raw data from APIs
  const [health, setHealth] = useState<RedisHealth | null>(null);
  const [counters, setCounters] = useState<RedisKeyInfo[]>([]);
  const [rules, setRules] = useState<RedisKeyInfo[]>([]);
  const [users, setUsers] = useState<UserPlanResponse[]>([]);
  const [plans, setPlans] = useState<RatePlanResponse[]>([]);
  const [customRules, setCustomRules] = useState<UserCustomRuleResponse[]>([]);

  // Function to load all data from backend using Promise.allSettled
  const refreshAll = useCallback(async () => {
    try {
      const [
        healthResult,
        countersResult,
        rulesResult,
        usersResult,
        plansResult,
        customRulesResult,
      ] = await Promise.allSettled([
        getRedisHealth(),
        getRedisCounters(),
        getRedisRules(),
        UserPlanService.getAllUsers(0, 1000),
        RatePlanService.getAllPlans(0, 100),
        CustomRuleService.searchCustomRules('', 0, 100),
      ]);

      // 1. Check if backend is unreachable
      const isBackendUnreachable = 
        (usersResult.status === 'rejected' && isNetworkError(usersResult.reason)) ||
        (plansResult.status === 'rejected' && isNetworkError(plansResult.reason));

      if (isBackendUnreachable) {
        setRedisStatus('BACKEND_DOWN');
        setRedisErrorMessage('Rate limiter backend is currently unreachable. Please check if the Spring Boot server is running.');
        setHealth(null);
        setCounters([]);
        setRules([]);
        setLoading(false);
        return;
      }

      // 2. Check if Redis is disconnected
      let isRedisDisconnected = false;
      let redisMsg = 'Redis is currently unavailable. Start Redis to enable live monitoring.';

      if (healthResult.status === 'rejected') {
        isRedisDisconnected = true;
        const msg = healthResult.reason?.message || '';
        if (msg) {
          if (msg.includes('command timed out') || msg.includes('timed out')) {
            redisMsg = 'Redis command timed out. Please check that Redis is running.';
          } else {
            redisMsg = `Redis is currently unavailable: ${msg}`;
          }
        }
      } else {
        const healthRes = healthResult.value;
        if (!healthRes.connected) {
          isRedisDisconnected = true;
        } else {
          setHealth(healthRes);
        }
      }

      if (isRedisDisconnected) {
        setRedisStatus('DISCONNECTED');
        setRedisErrorMessage(redisMsg);
        setHealth(null);
        setCounters([]);
        setRules([]);
        
        // Even when Redis is down, we keep layout, so load users and plans if available
        if (usersResult.status === 'fulfilled') {
          setUsers(usersResult.value.content);
        }
        if (plansResult.status === 'fulfilled') {
          setPlans(plansResult.value.content);
        }
        if (customRulesResult.status === 'fulfilled') {
          setCustomRules(customRulesResult.value.content);
        }
        setLoading(false);
        return;
      }

      // 3. Both are connected
      if (healthResult.status === 'fulfilled') {
        setHealth(healthResult.value);
      }
      if (countersResult.status === 'fulfilled') {
        setCounters(countersResult.value);
      } else {
        setCounters([]);
      }
      if (rulesResult.status === 'fulfilled') {
        setRules(rulesResult.value);
      } else {
        setRules([]);
      }
      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value.content);
      }
      if (plansResult.status === 'fulfilled') {
        setPlans(plansResult.value.content);
      }
      if (customRulesResult.status === 'fulfilled') {
        setCustomRules(customRulesResult.value.content);
      }

      setRedisStatus('CONNECTED');
      setRedisErrorMessage(null);
    } catch (err: any) {
      console.error('Unexpected failure in refreshAll:', err);
      setRedisStatus('DISCONNECTED');
      setRedisErrorMessage('Redis is currently unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Polling every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll().catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  // Actions
  const handleFlushSingle = async (keyName: string) => {
    const parts = keyName.split(':');
    const clientId = parts[1];
    if (clientId) {
      try {
        await resetRateLimitCounter(clientId);
        await refreshAll();
      } catch (err) {
        console.error('Failed to reset counter:', err);
      }
    }
  };

  const handleFlushAll = async () => {
    try {
      await flushRedisKeys();
      await refreshAll();
    } catch (err) {
      console.error('Failed to flush keys:', err);
    }
  };

  const handleResetCounter = async (clientId: string) => {
    try {
      await resetRateLimitCounter(clientId);
      await refreshAll();
    } catch (err) {
      console.error('Failed to reset counter:', err);
    }
  };

  // Convert raw API response stats into the format expected by RedisStatusCard
  const stats: RedisStats = {
    connected: redisStatus === 'CONNECTED',
    version: health?.redisVersion || 'Unknown',
    uptimeInSeconds: 0,
    usedMemoryHuman: health ? formatBytes(health.memoryUsed) : 'N/A',
    totalKeys: health?.totalKeys || 0,
    rateLimitKeysCount: counters.length,
    ruleCacheKeysCount: rules.length,
    cacheHitRatio: 0,
    totalEvaluations: 0,
    blockedRequestsCount: 0,
  };

  // Convert raw key responses into RedisKeyItem[] expected by RedisKeyTable
  const mappedKeys: RedisKeyItem[] = React.useMemo(() => {
    const list: RedisKeyItem[] = [];

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

      const user = users.find((u) => u.clientId.toUpperCase() === r.clientId.toUpperCase());
      const source = user?.customRuleEnabled && user?.planName?.toUpperCase() === 'ENTERPRISE'
        ? 'CUSTOM_RULE'
        : 'RATE_PLAN';

      list.push({
        key: r.key,
        type: 'rate_rule',
        clientId: r.clientId,
        ttlSeconds: r.ttl ?? -1,
        maxRequests,
        windowValue,
        windowUnit,
        source,
        lastUpdated: new Date().toISOString(),
      });
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

      const isAllowed = currentCount <= maxRequests;
      const status = isAllowed
        ? currentCount >= maxRequests * 0.8
          ? 'WARNING'
          : 'ALLOWED'
        : 'THROTTLED';

      list.push({
        key: c.key,
        type: 'rate_limit',
        clientId: c.clientId,
        ttlSeconds: c.ttl ?? -1,
        currentCount,
        maxRequests,
        windowValue,
        windowUnit,
        status,
        lastUpdated: new Date().toISOString(),
      });
    });

    return list;
  }, [counters, rules, users, plans, customRules]);

  return (
    <MainLayout>
      <PageHeader
        title="Redis Key Store & Live Monitor"
        description="Inspect rate limit counter keys (rate_limit:*), cached rule JSONs (rate_rule:*), and simulate incoming traffic."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Redis Monitor' }]}
      />

      <div className="space-y-8">
        {redisStatus === 'CONNECTED' && (
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200/80">
            <p className="text-xs text-emerald-800">
              <strong>Connected:</strong> Live Redis monitor is active and polling the rate limiter server.
            </p>
          </div>
        )}

        {redisStatus === 'DISCONNECTED' && (
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200/80 flex items-center justify-between">
            <p className="text-xs text-rose-800">
              <strong>Redis Disconnected:</strong> {redisErrorMessage || 'Redis is currently unavailable.'}
            </p>
            <button
              onClick={refreshAll}
              className="px-3 py-1.5 text-xs font-semibold text-rose-900 bg-white hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shrink-0 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        )}

        {redisStatus === 'BACKEND_DOWN' && (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 flex items-center justify-between">
            <p className="text-xs text-amber-800">
              <strong>Rate limiter backend unavailable:</strong> {redisErrorMessage || 'The Spring Boot server is unreachable.'}
            </p>
            <button
              onClick={refreshAll}
              className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors shrink-0 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        )}

        {loading && redisStatus === 'LOADING' ? (
          <div className="p-8 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200/80">
            Connecting to rate limiter server and querying Redis...
          </div>
        ) : redisStatus === 'BACKEND_DOWN' ? (
          <ErrorState
            title="Backend Service Unreachable"
            message={redisErrorMessage || 'Unable to connect to the rate limiter backend.'}
            onRetry={refreshAll}
          />
        ) : (
          <>
            <RedisStatusCard stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RedisKeyTable
                  keys={mappedKeys}
                  onRefresh={refreshAll}
                  onFlushSingle={handleFlushSingle}
                  onFlushAll={handleFlushAll}
                  redisConnected={redisStatus === 'CONNECTED'}
                />
              </div>
              <div>
                <SimulatorWidget
                  users={users}
                  plans={plans}
                  customRules={customRules}
                  onRefresh={refreshAll}
                  onResetCounter={handleResetCounter}
                  redisConnected={redisStatus === 'CONNECTED'}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
