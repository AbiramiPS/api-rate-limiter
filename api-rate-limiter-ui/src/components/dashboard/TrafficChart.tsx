'use client';

import React from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

interface ClientUsageData {
  clientId: string;
  clientName: string;
  currentCount: number;
  maxRequests: number;
  planName: string;
}

interface TrafficChartProps {
  clientUsage: ClientUsageData[];
  redisConnected: boolean;
  selectedPlanFilter: string;
  setSelectedPlanFilter: (plan: string) => void;
}

export function TrafficChart({
  clientUsage,
  redisConnected,
  selectedPlanFilter,
  setSelectedPlanFilter,
}: TrafficChartProps) {
  const maxRequestsLimit = clientUsage.length > 0 
    ? Math.max(...clientUsage.map((c) => c.maxRequests)) 
    : 100;

  // Filter clients by selected plan
  const filteredClients = React.useMemo(() => {
    return clientUsage.filter((c) => {
      if (selectedPlanFilter !== 'ALL' && c.planName?.toUpperCase() !== selectedPlanFilter.toUpperCase()) {
        return false;
      }
      return true;
    });
  }, [clientUsage, selectedPlanFilter]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[350px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Active Client Request Usage
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Current active request window count in Redis compared to plan limits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Filter:
          </label>
          <select
            value={selectedPlanFilter}
            onChange={(e) => setSelectedPlanFilter(e.target.value)}
            disabled={!redisConnected}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Plans</option>
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="PREMIUM">Premium</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </div>
      </div>

      {!redisConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-rose-50/20 border border-dashed border-rose-200 rounded-2xl min-h-[200px]">
          <ShieldAlert className="w-8 h-8 text-rose-500 mb-2" />
          <h4 className="text-sm font-bold text-rose-950">Redis Monitor Unavailable</h4>
          <p className="text-xs text-rose-700/90 max-w-sm mt-1">
            Redis is currently disconnected. Start Redis to enable live traffic monitoring.
          </p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-2xl min-h-[200px]">
          <p className="text-xs text-slate-500">
            No active client traffic found in Redis matching selected plan filter.
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Simulate requests to clients to populate live counter keys.
          </p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col justify-end">
          {/* SVG Bar Chart Visualization */}
          <div className="h-44 flex items-end justify-between gap-4 pt-4 px-2 border-b border-slate-100">
            {filteredClients.map((client, i) => {
              const usagePct = Math.min(100, (client.currentCount / client.maxRequests) * 100);

              return (
                <div key={client.clientId} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-20 whitespace-nowrap pointer-events-none">
                    <span className="font-bold text-slate-200">{client.clientName}</span>
                    <span className="font-mono text-slate-400">ID: {client.clientId}</span>
                    <span className="font-semibold text-indigo-400 mt-1">
                      {client.currentCount} / {client.maxRequests} req
                    </span>
                  </div>

                  {/* Dynamic Bar */}
                  <div className="w-full max-w-[32px] bg-slate-100 rounded-t-lg h-full flex flex-col justify-end overflow-hidden">
                    <div
                      style={{ height: `${usagePct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        usagePct >= 90
                          ? 'bg-rose-500'
                          : usagePct >= 70
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between px-2 text-[10px] font-mono font-bold text-slate-400">
            {filteredClients.map((client) => (
              <span key={client.clientId} className="flex-1 text-center truncate px-1" title={client.clientId}>
                {client.clientId}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Evaluation Mode</p>
          <p className="text-base font-extrabold text-slate-900 mt-0.5">Redis Rate Limiter</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cache Status</p>
          <p className={`text-base font-extrabold mt-0.5 ${redisConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
            {redisConnected ? 'Active' : 'Offline'}
          </p>
        </div>
      </div>
    </div>
  );
}
