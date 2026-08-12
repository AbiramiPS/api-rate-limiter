'use client';

import React from 'react';
import { Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function TrafficChart() {
  const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'];
  const allowedHits = [450, 320, 890, 1240, 1580, 1100, 980];
  const blockedHits = [12, 5, 28, 64, 92, 41, 35];

  const maxVal = 1800;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Live Request Enforcement Rate
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time HTTP 200 Allowed vs HTTP 429 Blocked requests across all client windows
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Allowed (99.7%)
          </div>
          <div className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            Blocked 429 (0.3%)
          </div>
        </div>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="space-y-2">
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2 border-b border-slate-100">
          {allowedHits.map((allowed, i) => {
            const blocked = blockedHits[i];
            const allowedHeight = (allowed / maxVal) * 100;
            const blockedHeight = Math.max(4, (blocked / maxVal) * 100);

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-20 whitespace-nowrap pointer-events-none">
                  <span className="font-bold text-slate-200">{hours[i]}</span>
                  <span className="text-emerald-400">Allowed: {allowed} req</span>
                  <span className="text-rose-400">Blocked 429: {blocked} req</span>
                </div>

                <div className="w-full max-w-[28px] flex flex-col gap-0.5 items-center justify-end h-full">
                  <div
                    style={{ height: `${blockedHeight}%` }}
                    className="w-full bg-rose-500 rounded-t-sm transition-all group-hover:bg-rose-600"
                  />
                  <div
                    style={{ height: `${allowedHeight}%` }}
                    className="w-full bg-indigo-500/90 rounded-b-sm transition-all group-hover:bg-indigo-600"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X Axis Labels */}
        <div className="flex justify-between px-2 text-[11px] font-semibold text-slate-400">
          {hours.map((h, i) => (
            <span key={i} className="w-1/7 text-center">
              {h}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[11px] text-slate-500 font-medium">Avg Evaluation Speed</p>
          <p className="text-lg font-extrabold text-slate-900 mt-0.5">1.8 ms</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[11px] text-slate-500 font-medium">Redis Rule Cache Hit</p>
          <p className="text-lg font-extrabold text-emerald-600 mt-0.5">99.4 %</p>
        </div>
      </div>
    </div>
  );
}
