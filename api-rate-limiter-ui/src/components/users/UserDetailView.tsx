'use client';

import React from 'react';
import Link from 'next/link';
import { UserPlanResponse } from '@/types/api';
import { StatusBadge } from '../ui/StatusBadge';
import { Zap, ArrowLeft, Edit3 } from 'lucide-react';

interface UserDetailViewProps {
  user: UserPlanResponse;
}

export function UserDetailView({ user }: UserDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Banner Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            {user.clientId.slice(-3)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user.clientName}</h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                {user.clientId}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/users/${user.clientId}/edit`}
            className="px-4 py-2 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Edit3 className="w-4 h-4 text-indigo-600" />
            Edit Client
          </Link>
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

      {/* Client Details Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Client Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Client ID</p>
            <p className="font-mono text-sm font-bold text-slate-900">{user.clientId}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Client Name</p>
            <p className="text-sm font-bold text-slate-900">{user.clientName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Assigned Plan</p>
            <p className="text-sm font-bold text-slate-900">{user.planName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Custom Rule Enabled</p>
            <StatusBadge type="custom_rule" value={user.customRuleEnabled} />
          </div>
        </div>
      </div>
    </div>
  );
}
