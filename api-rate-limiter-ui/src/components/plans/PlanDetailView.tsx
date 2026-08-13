'use client';

import React from 'react';
import Link from 'next/link';
import { RatePlanResponse } from '@/types/api';
import { Layers, ArrowLeft } from 'lucide-react';

interface PlanDetailViewProps {
  plan: RatePlanResponse;
}

export function PlanDetailView({ plan }: PlanDetailViewProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{plan.planName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Rate Plan ID: {plan.id}</p>
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
          Plan Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Plan Name</p>
            <p className="text-sm font-bold text-slate-900">{plan.planName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Status</p>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                plan.active
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${plan.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {plan.active ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        <p className="text-xs text-slate-600">
          <strong>Note:</strong> Rate limit rules (maxRequests, windowValue, windowUnit) for this plan are configured through the Rules management interface. This page shows plan metadata only.
        </p>
      </div>
    </div>
  );
}
