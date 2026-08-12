'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCustomRule, WindowUnit } from '@/types';
import { RateLimiterStore } from '@/lib/services/store';
import { useToast } from '../providers/ToastProvider';
import { ArrowLeft, Save, Zap, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface CustomRuleFormProps {
  initialRule?: UserCustomRule;
  targetClientId?: string;
  isEdit?: boolean;
}

export function CustomRuleForm({ initialRule, targetClientId, isEdit = false }: CustomRuleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const users = RateLimiterStore.getUsers();

  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialRule?.clientId || targetClientId || users[0]?.clientId || 'C-001'
  );
  const [maxRequests, setMaxRequests] = useState<number>(initialRule?.maxRequests || 200);
  const [windowValue, setWindowValue] = useState<number>(initialRule?.windowValue || 1);
  const [windowUnit, setWindowUnit] = useState<WindowUnit>(initialRule?.windowUnit || 'MINUTE');
  const [enabled, setEnabled] = useState<boolean>(initialRule?.enabled ?? true);
  const [reason, setReason] = useState<string>(initialRule?.reason || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeUser = users.find((u) => u.clientId.toLowerCase() === selectedClientId.toLowerCase());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || maxRequests <= 0 || windowValue <= 0) {
      toast('Validation Error', 'Please specify valid custom rule parameters.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const clientName = activeUser ? activeUser.clientName : selectedClientId;

      RateLimiterStore.upsertCustomRule({
        clientId: selectedClientId,
        clientName,
        maxRequests: Number(maxRequests),
        windowValue: Number(windowValue),
        windowUnit,
        enabled,
        reason,
      });

      toast('Custom Rule Saved', `Updated rate limit override rule for '${clientName}'. Evicted Redis cache rate_rule:${selectedClientId}.`, 'success');
      router.push('/custom-rules');
    } catch (err: any) {
      toast('Failed to Save Rule', err.message || 'Error occurred', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
          Client Identification
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Client User <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            disabled={isEdit}
            className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900 disabled:opacity-60"
          >
            {users.map((u) => (
              <option key={u.clientId} value={u.clientId}>
                {u.clientId} - {u.clientName} (Assigned Plan: {u.planName})
              </option>
            ))}
          </select>
          {activeUser && (
            <p className="text-xs text-slate-500 mt-1">
              Default Plan Limit: <span className="font-semibold text-slate-800">{activeUser.planName}</span>
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Custom Rate Limit Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Max Requests Allowed <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={maxRequests}
              onChange={(e) => setMaxRequests(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Window Value <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={windowValue}
              onChange={(e) => setWindowValue(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Window Time Unit <span className="text-rose-500">*</span>
            </label>
            <select
              value={windowUnit}
              onChange={(e) => setWindowUnit(e.target.value as WindowUnit)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="SECOND">SECOND</option>
              <option value="MINUTE">MINUTE</option>
              <option value="HOUR">HOUR</option>
              <option value="DAY">DAY</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Override Justification / SLA Rationale
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Enterprise VIP contract extension Q1"
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Enable Override Rule</span>
            <span className="text-[11px] text-slate-500">
              When checked, sets customRuleEnabled = true for this user
            </span>
          </div>

          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/custom-rules"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Custom Rules
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs md:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : 'Save Custom Rule'}
        </button>
      </div>
    </form>
  );
}
