'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, Zap, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { RateLimiterStore } from '@/lib/services/store';
import { StatusBadge } from '../ui/StatusBadge';
import { useToast } from '../providers/ToastProvider';

export function SimulatorWidget() {
  const { toast } = useToast();
  const users = RateLimiterStore.getUsers();

  const [selectedClientId, setSelectedClientId] = useState<string>('C-001');
  const [burstCount, setBurstCount] = useState<number>(1);
  const [lastResult, setLastResult] = useState<{
    allowed: boolean;
    status: number;
    currentCount: number;
    maxRequests: number;
    windowValue: number;
    windowUnit: string;
    source: string;
    message: string;
    ttlSeconds: number;
  } | null>(null);

  const activeUser = users.find((u) => u.clientId === selectedClientId) || users[0];
  const resolvedRule = RateLimiterStore.resolveRuleForClient(selectedClientId);

  const handleSimulate = () => {
    let result = null;
    for (let i = 0; i < burstCount; i++) {
      result = RateLimiterStore.simulateApiRequest(selectedClientId);
    }
    if (result) {
      setLastResult(result);
      if (result.allowed) {
        toast('Request Allowed', result.message, 'success');
      } else {
        toast('Request Throttled', result.message, 'error');
      }
    }
  };

  const handleResetCounter = () => {
    RateLimiterStore.flushRedisKey(`rate_limit:${selectedClientId}`);
    setLastResult(null);
    toast('Counter Reset', `Flushed counter rate_limit:${selectedClientId} from Redis`, 'info');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              Live Rate Limiter Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate real API traffic and test Redis counter enforcement
            </p>
          </div>
          <button
            onClick={handleResetCounter}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
            title="Reset counter for selected client"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Counter
          </button>
        </div>

        {/* Client Selection & Rule resolution info */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Client ID to Test
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setLastResult(null);
              }}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            >
              {users.map((u) => (
                <option key={u.clientId} value={u.clientId}>
                  {u.clientId} - {u.clientName} ({u.planName}
                  {u.customRuleEnabled ? ' | Custom Rule Active' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Active Rule resolution pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-medium block text-[11px]">Enforced Limit</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {resolvedRule.maxRequests} req / {resolvedRule.windowValue} {resolvedRule.windowUnit}
              </span>
            </div>
            <StatusBadge type="rule_source" value={resolvedRule.source} />
          </div>

          {/* Simulation Burst Controls */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Batch Burst Size
              </label>
              <div className="flex items-center gap-1">
                {[1, 5, 10, 25].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setBurstCount(cnt)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      burstCount === cnt
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    +{cnt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSimulate}
              className="mt-5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl font-semibold text-xs md:text-sm shadow-md shadow-indigo-200 flex items-center gap-2 shrink-0 transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              Simulate Request
            </button>
          </div>

          {/* Simulation Result Output */}
          {lastResult && (
            <div
              className={`p-4 rounded-xl border animate-in fade-in zoom-in-95 duration-150 ${
                lastResult.allowed
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/90 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-sm">
                <div className="flex items-center gap-2">
                  {lastResult.allowed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                  )}
                  <span>HTTP {lastResult.status}</span>
                </div>
                <span className="text-xs font-semibold opacity-80">
                  TTL: {lastResult.ttlSeconds}s remaining
                </span>
              </div>
              <p className="text-xs mt-1 font-medium">{lastResult.message}</p>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span>Current Window Usage</span>
                  <span>
                    {lastResult.currentCount} / {lastResult.maxRequests}
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        (lastResult.currentCount / lastResult.maxRequests) * 100
                      )}%`,
                    }}
                    className={`h-full transition-all duration-300 ${
                      lastResult.allowed
                        ? lastResult.currentCount / lastResult.maxRequests >= 0.8
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
