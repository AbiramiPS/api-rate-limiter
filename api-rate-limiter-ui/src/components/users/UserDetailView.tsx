'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, RedisKeyItem } from '@/types';
import { RateLimiterStore } from '@/lib/services/store';
import { StatusBadge } from '../ui/StatusBadge';
import { formatRuleSpec, getWindowInSeconds } from '@/lib/utils';
import { useToast } from '../providers/ToastProvider';
import {
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  Edit3,
  Trash2,
  Database,
  Layers,
  Activity,
  ArrowLeft,
} from 'lucide-react';

interface UserDetailViewProps {
  user: User;
}

export function UserDetailView({ user }: UserDetailViewProps) {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User>(user);

  const resolved = RateLimiterStore.resolveRuleForClient(user.clientId);
  const redisKeys = RateLimiterStore.getRedisKeys();

  const counterKey = redisKeys.find((k) => k.key === `rate_limit:${user.clientId}`);
  const ruleCacheKey = redisKeys.find((k) => k.key === `rate_rule:${user.clientId}`);

  const [testResult, setTestResult] = useState<any>(null);

  const handleTestClient = () => {
    const res = RateLimiterStore.simulateApiRequest(user.clientId);
    setTestResult(res);
    if (res.allowed) {
      toast('Request Allowed', res.message, 'success');
    } else {
      toast('Request Blocked (429)', res.message, 'error');
    }
  };

  const handleFlushCounter = () => {
    RateLimiterStore.flushRedisKey(`rate_limit:${user.clientId}`);
    setTestResult(null);
    toast('Redis Key Flushed', `Flushed rate_limit:${user.clientId}`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            {user.clientId.slice(-3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user.clientName}</h2>
              <StatusBadge type="status" value={user.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                {user.clientId}
              </span>
              <span>&bull;</span>
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/custom-rules/${user.clientId}`}
            className="px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
            Configure Custom Rule
          </Link>
          <Link
            href="/users"
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Link>
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business Logic Resolution Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Rate Limiting Rule Resolution Engine
              </h3>
              <StatusBadge type="rule_source" value={resolved.source} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-xs font-semibold text-slate-500">Effective Rate Limit</p>
                <p className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
                  {formatRuleSpec(resolved.maxRequests, resolved.windowValue, resolved.windowUnit)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Evaluated source: <span className="font-semibold text-slate-700">{resolved.sourceName}</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-xs font-semibold text-slate-500">Assigned Rate Plan</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{user.planName}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Custom Override Status:{' '}
                  <span className="font-bold text-amber-700">
                    {user.customRuleEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </p>
              </div>
            </div>

            {/* Resolution Hierarchy Diagram */}
            <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Evaluation Chain Hierarchy
              </h4>
              <div className="space-y-2 text-xs">
                <div
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    user.customRuleEnabled
                      ? 'bg-amber-50 border-amber-200 text-amber-950 font-bold'
                      : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    Step 1: Check UserCustomRule (customRuleEnabled = {String(user.customRuleEnabled)})
                  </span>
                  <span>{user.customRuleEnabled ? 'MATCHED & ENFORCED' : 'SKIPPED'}</span>
                </div>

                <div
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    !user.customRuleEnabled
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold'
                      : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Step 2: Default RatePlanRule (Plan: {user.planName})
                  </span>
                  <span>{!user.customRuleEnabled ? 'MATCHED & ENFORCED' : 'OVERRIDDEN'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Redis Monitor & Simulator */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                Active Redis Counter
              </h3>
              <button
                onClick={handleFlushCounter}
                className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Flush
              </button>
            </div>

            {/* Redis Counter status gauge */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-[11px] text-slate-500 font-semibold font-mono">
                  rate_limit:{user.clientId}
                </p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {counterKey?.currentCount || testResult?.currentCount || 0}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Max: {resolved.maxRequests} req
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        (((counterKey?.currentCount || testResult?.currentCount || 0) /
                          resolved.maxRequests) *
                          100)
                      )}%`,
                    }}
                    className="bg-indigo-600 h-full transition-all"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">Redis Rule Cache key</span>
                <span className="font-mono font-semibold text-slate-800">
                  {ruleCacheKey ? 'rate_rule:' + user.clientId : 'Not Cached'}
                </span>
              </div>
            </div>

            {/* Live Test Trigger Button */}
            <button
              onClick={handleTestClient}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Simulate 1 Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
