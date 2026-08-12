'use client';

import React from 'react';
import { Database, Cpu, HardDrive, Key, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { RedisStats } from '@/types';

interface RedisStatusCardProps {
  stats: RedisStats;
}

export function RedisStatusCard({ stats }: RedisStatusCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Connection State */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Redis Health</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-lg font-bold text-slate-900">Connected</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">{stats.version}</p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
          <Database className="w-6 h-6" />
        </div>
      </div>

      {/* Memory Usage */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Used Memory</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.usedMemoryHuman}</h3>
          <p className="text-[11px] text-slate-400 mt-1">In-Memory Key Store</p>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
          <HardDrive className="w-6 h-6" />
        </div>
      </div>

      {/* Rate Limit Counters Key Count */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate Limit Counters</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
            {stats.rateLimitKeysCount}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Pattern: rate_limit:C-*</p>
        </div>
        <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
          <Activity className="w-6 h-6" />
        </div>
      </div>

      {/* Rule Cache Keys Count */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cached Rule Keys</p>
          <h3 className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">
            {stats.ruleCacheKeysCount}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Pattern: rate_rule:C-*</p>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
          <Key className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
