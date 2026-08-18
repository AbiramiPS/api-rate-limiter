'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, Zap, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { useToast } from '../providers/ToastProvider';
import { UserPlanResponse, RatePlanResponse, UserCustomRuleResponse } from '@/types/api';
import { executeRedisTest, resetRateLimitCounter } from '@/services/api';
import { UserPlanService } from '@/services/userPlanService';
import { RatePlanService } from '@/services/ratePlanService';
import { CustomRuleService } from '@/services/customRuleService';

interface SimulatorWidgetProps {
  users?: UserPlanResponse[];
  plans?: RatePlanResponse[];
  customRules?: UserCustomRuleResponse[];
  onRefresh?: () => void;
  onResetCounter?: (clientId: string) => Promise<void>;
  redisConnected?: boolean;
}

export function SimulatorWidget({
  users: propUsers,
  plans: propPlans,
  customRules: propCustomRules,
  onRefresh,
  onResetCounter,
  redisConnected = true,
}: SimulatorWidgetProps) {
  const { toast } = useToast();

  const [localUsers, setLocalUsers] = useState<UserPlanResponse[]>([]);
  const [localPlans, setLocalPlans] = useState<RatePlanResponse[]>([]);
  const [localCustomRules, setLocalCustomRules] = useState<UserCustomRuleResponse[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(false);

  const users = propUsers || localUsers;
  const plans = propPlans || localPlans;
  const customRules = propCustomRules || localCustomRules;

  // Load data internally if not provided by props
  React.useEffect(() => {
    if (!propUsers || !propPlans || !propCustomRules) {
      const loadLocalData = async () => {
        setLoadingLocal(true);
        try {
          const [uRes, pRes, crRes] = await Promise.all([
            UserPlanService.getAllUsers(0, 1000),
            RatePlanService.getAllPlans(0, 100),
            CustomRuleService.searchCustomRules('', 0, 100),
          ]);
          setLocalUsers(uRes.content);
          setLocalPlans(pRes.content);
          setLocalCustomRules(crRes.content);
        } catch (err) {
          console.error('Failed to load local simulator data', err);
        } finally {
          setLoadingLocal(false);
        }
      };
      loadLocalData();
    }
  }, [propUsers, propPlans, propCustomRules]);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [burstCount, setBurstCount] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [logs, setLogs] = useState<{
    id: number;
    status: number;
    allowed: boolean;
  }[]>([]);
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

  React.useEffect(() => {
    if (users.length > 0 && !selectedClientId) {
      setSelectedClientId(users[0].clientId);
    }
  }, [users, selectedClientId]);

  const activeUser = users.find((u) => u.clientId === selectedClientId) || users[0];

  const resolvedRule = React.useMemo(() => {
    if (!selectedClientId || !activeUser) {
      return {
        maxRequests: 0,
        windowValue: 1,
        windowUnit: 'MINUTE',
        source: 'RATE_PLAN',
        sourceName: 'No Client Selected',
      };
    }

    const isEnterprise = activeUser.planName?.toUpperCase() === 'ENTERPRISE';
    if (isEnterprise && activeUser.customRuleEnabled) {
      const customRule = customRules.find(
        (r) => r.clientId.toUpperCase() === selectedClientId.toUpperCase()
      );
      if (customRule) {
        return {
          maxRequests: customRule.maxRequests,
          windowValue: customRule.windowValue,
          windowUnit: customRule.windowUnit,
          source: 'CUSTOM_RULE',
          sourceName: 'Custom Rule',
        };
      }
    }

    const plan = plans.find(
      (p) => p.planName?.toUpperCase() === activeUser.planName?.toUpperCase()
    );
    return {
      maxRequests: plan?.maxRequests || 0,
      windowValue: plan?.windowValue || 1,
      windowUnit: plan?.windowUnit || 'MINUTE',
      source: 'RATE_PLAN',
      sourceName: `Plan: ${activeUser.planName}`,
    };
  }, [selectedClientId, activeUser, plans, customRules]);

  const handleSimulate = async () => {
    if (!selectedClientId) return;
    setIsSimulating(true);
    setLogs([]);
    setLastResult(null);

    let latestResult = null;
    const tempLogs = [];

    for (let i = 0; i < burstCount; i++) {
      try {
        const res = await executeRedisTest(selectedClientId);
        latestResult = res;
        tempLogs.push({
          id: i + 1,
          status: res.status,
          allowed: res.allowed,
        });
        setLogs([...tempLogs]);
        setLastResult({
          ...res,
          windowValue: resolvedRule.windowValue,
          windowUnit: resolvedRule.windowUnit,
          source: resolvedRule.sourceName,
        });
      } catch (error: any) {
        tempLogs.push({
          id: i + 1,
          status: error.status || 500,
          allowed: false,
        });
        setLogs([...tempLogs]);
        toast('Simulation Error', error.message || 'Request failed', 'error');
      }
    }

    if (latestResult) {
      if (latestResult.allowed) {
        toast('Request Allowed', latestResult.message, 'success');
      } else {
        toast('Request Throttled', latestResult.message, 'error');
      }
    }

    setIsSimulating(false);
    if (onRefresh) onRefresh();
  };

  const handleResetCounter = async () => {
    if (!selectedClientId) return;
    try {
      if (onResetCounter) {
        await onResetCounter(selectedClientId);
      } else {
        await resetRateLimitCounter(selectedClientId);
      }
      setLastResult(null);
      setLogs([]);
      toast('Counter Reset', `Flushed counter rate_limit:${selectedClientId} from Redis`, 'info');
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast('Error', e.message || 'Failed to reset counter', 'error');
    }
  };

  if (loadingLocal && users.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <p className="text-xs text-slate-500 text-center">Loading simulator...</p>
      </div>
    );
  }

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
            disabled={isSimulating || !redisConnected}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                setLogs([]);
              }}
              disabled={isSimulating || !redisConnected}
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {users.map((u) => {
                const isEnterprise = u.planName?.toUpperCase() === 'ENTERPRISE';
                const hasCustomRule = isEnterprise && u.customRuleEnabled;
                return (
                  <option key={u.clientId} value={u.clientId}>
                    {u.clientId} - {u.clientName} ({u.planName}
                    {hasCustomRule ? ' | Custom Rule Active' : ''})
                  </option>
                );
              })}
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

          {!redisConnected && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold">
              Simulator unavailable while Redis is disconnected.
            </div>
          )}

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
                    disabled={isSimulating || !redisConnected}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
              disabled={isSimulating || !selectedClientId || !redisConnected}
              className="mt-5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl font-semibold text-xs md:text-sm shadow-md shadow-indigo-200 flex items-center gap-2 shrink-0 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-white" />
              {isSimulating ? 'Sending...' : 'Simulate Request'}
            </button>
          </div>

          {/* Logs List */}
          {logs.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px]">
              <div className="font-bold text-slate-500 uppercase tracking-wider mb-1 text-[10px] pb-1 border-b border-slate-200">
                Simulation Request Log
              </div>
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">#{log.id}</span>
                  <span className="font-bold">HTTP {log.status}</span>
                  <span
                    className={`font-bold uppercase px-1.5 py-0.5 rounded text-[9px] ${
                      log.allowed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {log.allowed ? 'Allowed' : 'Blocked'}
                  </span>
                </div>
              ))}
            </div>
          )}

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
