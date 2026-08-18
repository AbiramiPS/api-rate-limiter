'use client';

import React from 'react';
import Link from 'next/link';
import { UserPlanResponse } from '@/types/api';
import { CustomRuleService } from '@/services/customRuleService';
import { Zap, ArrowLeft, Edit3 } from 'lucide-react';

interface UserDetailViewProps {
  user: UserPlanResponse;
}

export function UserDetailView({ user }: UserDetailViewProps) {
  const [customRule, setCustomRule] = React.useState<any>(null);
  const [loadingRule, setLoadingRule] = React.useState(false);

  const isEnterprise = user.planName?.toUpperCase() === 'ENTERPRISE';
  const showCustomRule = isEnterprise && user.customRuleEnabled;

  React.useEffect(() => {
    if (showCustomRule) {
      const loadRule = async () => {
        setLoadingRule(true);
        try {
          const rule = await CustomRuleService.getCustomRuleByClientId(user.clientId);
          setCustomRule(rule);
        } catch (e) {
          console.error('Failed to load custom rule details:', e);
        } finally {
          setLoadingRule(false);
        }
      };
      loadRule();
    }
  }, [showCustomRule, user.clientId]);

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
        </div>
      </div>

      {/* Rate Limiting Configuration Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Rate Limiting Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Assigned Plan</p>
            <p className="text-sm font-bold text-slate-900 uppercase">{user.planName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Custom Rule Status</p>
            <p className="text-sm font-bold">
              {showCustomRule ? (
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  ACTIVE
                </span>
              ) : (
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  DISABLED
                </span>
              )}
            </p>
          </div>
        </div>

        {showCustomRule && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-4">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              Custom Override Rule Parameters
            </h4>
            {loadingRule ? (
              <p className="text-xs text-slate-500">Loading custom rule details...</p>
            ) : customRule ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
                <div>
                  <span className="text-slate-500 font-medium block">Max Requests</span>
                  <span className="text-sm font-bold text-slate-900">{customRule.maxRequests} req</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Window Value</span>
                  <span className="text-sm font-bold text-slate-900">{customRule.windowValue}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Window Unit</span>
                  <span className="text-sm font-bold text-slate-900 uppercase">{customRule.windowUnit}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Rule Price</span>
                  <span className="text-sm font-bold text-slate-900">${customRule.price} / mo</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-rose-600">Failed to load custom rule properties from backend.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
