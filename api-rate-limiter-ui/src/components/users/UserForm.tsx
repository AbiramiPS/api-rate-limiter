'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, WindowUnit } from '@/types';
import { RateLimiterStore } from '@/lib/services/store';
import { useToast } from '../providers/ToastProvider';
import { ArrowLeft, Save, Zap, Info } from 'lucide-react';
import Link from 'next/link';

interface UserFormProps {
  initialUser?: User;
  isEdit?: boolean;
}

export function UserForm({ initialUser, isEdit = false }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const plans = RateLimiterStore.getPlans();

  const [clientId, setClientId] = useState(initialUser?.clientId || `C-00${Math.floor(Math.random() * 90) + 10}`);
  const [clientName, setClientName] = useState(initialUser?.clientName || '');
  const [email, setEmail] = useState(initialUser?.email || '');
  const [planId, setPlanId] = useState(initialUser?.planId || plans[0]?.id || 'plan-1');
  const [status, setStatus] = useState<User['status']>(initialUser?.status || 'ACTIVE');

  // Custom rule options
  const existingCustomRule = initialUser ? RateLimiterStore.getCustomRuleByClientId(initialUser.clientId) : null;
  const [customRuleEnabled, setCustomRuleEnabled] = useState(initialUser?.customRuleEnabled || false);
  const [maxRequests, setMaxRequests] = useState(existingCustomRule?.maxRequests || 100);
  const [windowValue, setWindowValue] = useState(existingCustomRule?.windowValue || 1);
  const [windowUnit, setWindowUnit] = useState<WindowUnit>(existingCustomRule?.windowUnit || 'MINUTE');
  const [reason, setReason] = useState(existingCustomRule?.reason || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !email.trim() || !clientId.trim()) {
      toast('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedPlan = plans.find((p) => p.id === planId) || plans[0];

      if (isEdit && initialUser) {
        RateLimiterStore.updateUser(initialUser.clientId, {
          clientName,
          email,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          customRuleEnabled,
          status,
        });

        if (customRuleEnabled) {
          RateLimiterStore.upsertCustomRule({
            clientId,
            clientName,
            maxRequests: Number(maxRequests),
            windowValue: Number(windowValue),
            windowUnit,
            enabled: true,
            reason,
          });
        }

        toast('Client Updated', `Client '${clientName}' configuration saved.`, 'success');
        router.push(`/users/${clientId}`);
      } else {
        const newUser = RateLimiterStore.createUser({
          clientId,
          clientName,
          email,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          customRuleEnabled,
          status,
        });

        if (customRuleEnabled) {
          RateLimiterStore.upsertCustomRule({
            clientId,
            clientName,
            maxRequests: Number(maxRequests),
            windowValue: Number(windowValue),
            windowUnit,
            enabled: true,
            reason,
          });
        }

        toast('Client Created', `Successfully registered client '${clientName}' (${clientId}).`, 'success');
        router.push(`/users/${newUser.clientId}`);
      }
    } catch (err: any) {
      toast('Operation Failed', err.message || 'An error occurred', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Primary Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Client Identification & Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value.toUpperCase())}
              disabled={isEdit}
              placeholder="e.g. C-009"
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">Unique identifier used in API headers (X-Client-ID)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client Organization Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Alpha Systems Inc."
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Admin Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@alphasystems.io"
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as User['status'])}
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ACTIVE">ACTIVE (Enforcing Rate Limits)</option>
              <option value="SUSPENDED">SUSPENDED (Block All Traffic)</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rate Plan & Custom Rule Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Rate Limiting Configuration
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Assigned Rate Plan <span className="text-rose-500">*</span>
          </label>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.maxRequests} req / {p.windowValue} {p.windowUnit}) - {p.description}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Rule Toggle (Enterprise Feature) */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
              <div>
                <h4 className="text-xs font-bold text-amber-950">Enable User Custom Override Rule</h4>
                <p className="text-[11px] text-amber-800/90">
                  When enabled, overrides default Rate Plan Rule with client-specific rate limit parameters.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={customRuleEnabled}
                onChange={(e) => setCustomRuleEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-amber-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
            </label>
          </div>

          {customRuleEnabled && (
            <div className="pt-3 border-t border-amber-200/60 grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Max Requests</label>
                <input
                  type="number"
                  min="1"
                  value={maxRequests}
                  onChange={(e) => setMaxRequests(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
                  required={customRuleEnabled}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Window Value</label>
                <input
                  type="number"
                  min="1"
                  value={windowValue}
                  onChange={(e) => setWindowValue(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
                  required={customRuleEnabled}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Window Unit</label>
                <select
                  value={windowUnit}
                  onChange={(e) => setWindowUnit(e.target.value as WindowUnit)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
                >
                  <option value="SECOND">SECOND</option>
                  <option value="MINUTE">MINUTE</option>
                  <option value="HOUR">HOUR</option>
                  <option value="DAY">DAY</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Override Justification / Rationale
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Enterprise SLA Agreement Q1"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs md:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Client'}
        </button>
      </div>
    </form>
  );
}
