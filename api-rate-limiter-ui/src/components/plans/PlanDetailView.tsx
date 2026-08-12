'use client';

import React from 'react';
import Link from 'next/link';
import { RatePlan } from '@/types';
import { RateLimiterStore } from '@/lib/services/store';
import { formatRuleSpec } from '@/lib/utils';
import { Layers, Users, ArrowLeft, Edit3, Shield } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

interface PlanDetailViewProps {
  plan: RatePlan;
}

export function PlanDetailView({ plan }: PlanDetailViewProps) {
  const usersOnPlan = RateLimiterStore.getUsers().filter(
    (u) => u.planId === plan.id || u.planName === plan.name
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
              {plan.isDefault && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  DEFAULT PLAN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{plan.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/plans"
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Plans
          </Link>
        </div>
      </div>

      {/* Plan Details Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Rate Limit Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-500">Max Allowed Requests</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
              {plan.maxRequests} req
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-500">Window Window</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
              {plan.windowValue} {plan.windowUnit}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-500">Assigned Clients</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{usersOnPlan.length}</p>
          </div>
        </div>

        {plan.description && (
          <div className="pt-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-900 block mb-1">Description:</span>
            <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              {plan.description}
            </p>
          </div>
        )}
      </div>

      {/* Assigned Users List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            Clients Currently Assigned To Plan
          </span>
          <span className="text-xs font-semibold text-slate-500">{usersOnPlan.length} clients</span>
        </h3>

        {usersOnPlan.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">
            No clients are currently assigned to this rate plan.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {usersOnPlan.map((u) => (
              <div key={u.clientId} className="py-3 flex items-center justify-between">
                <div>
                  <Link
                    href={`/users/${u.clientId}`}
                    className="font-bold text-xs md:text-sm text-slate-900 hover:text-indigo-600 transition-colors"
                  >
                    {u.clientName}
                  </Link>
                  <span className="text-[11px] text-slate-500 font-mono ml-2 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                    {u.clientId}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge type="custom_rule" value={u.customRuleEnabled} />
                  <StatusBadge type="status" value={u.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
