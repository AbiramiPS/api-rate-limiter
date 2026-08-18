'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlanRequest, RatePlanResponse } from '@/types/api';
import { RatePlanService } from '@/services/ratePlanService';
import { UserPlanService, ApiError } from '@/services/userPlanService';
import { useToast } from '../providers/ToastProvider';
import { ArrowLeft, Save, Zap, Info } from 'lucide-react';
import Link from 'next/link';

interface UserFormProps {
  initialUser?: UserPlanRequest;
  isEdit?: boolean;
}

export function UserForm({ initialUser, isEdit = false }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [plans, setPlans] = useState<RatePlanResponse[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [clientId, setClientId] = useState(initialUser?.clientId || '');
  const [clientName, setClientName] = useState(initialUser?.clientName || '');
  const [planId, setPlanId] = useState<number>(initialUser?.planId || 1);
  const [customRuleEnabled, setCustomRuleEnabled] = useState(initialUser?.customRuleEnabled || false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load plans from backend
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await RatePlanService.getAllPlans(0, 100);
        setPlans(data.content);
        if (data.content.length > 0 && !initialUser) {
          setPlanId(data.content[0].id);
        }
      } catch (error) {
        const apiError = error as ApiError;
        handleApiError(apiError, 'Failed to load plans');
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, [initialUser]);

  const handleApiError = (error: ApiError, defaultMessage: string) => {
    let message = defaultMessage;
    if (error.status === 400) {
      message = 'Invalid request. Please check your input.';
    } else if (error.status === 404) {
      message = 'Resource not found.';
    } else if (error.status === 409) {
      message = 'Resource already exists.';
    } else if (error.status === 429) {
      message = 'Too many requests. Please try again later.';
    } else if (error.status === 500) {
      message = 'Server error. Please try again later.';
    } else if (error.status === 503) {
      message = 'Service unavailable. Please try again later.';
    } else if (error.message) {
      message = error.message;
    }
    toast('Error', message, 'error');
  };

  // Check if selected plan is Enterprise
  const selectedPlan = plans.find((p) => p.id === planId);
  const isEnterprisePlan = selectedPlan?.planName?.toUpperCase() === 'ENTERPRISE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientId.trim()) {
      toast('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    // Business rule: Custom rule only applicable to Enterprise
    if (customRuleEnabled && !isEnterprisePlan) {
      toast('Validation Error', 'Custom rules are available only for Enterprise clients.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const request: UserPlanRequest = {
        clientId: clientId.trim(),
        clientName: clientName.trim(),
        planId,
        customRuleEnabled,
      };

      if (isEdit && initialUser) {
        // Check if plan is changing
        const planChanged = initialUser.planId !== planId;
        
        await UserPlanService.patchUser(initialUser.clientId, {
          planId,
          customRuleEnabled
        });
        
        if (planChanged) {
          toast('Client Updated', `Client '${clientName}' configuration saved. Rate plan changed and Redis cache invalidated.`, 'success');
        } else {
          toast('Client Updated', `Client '${clientName}' configuration saved.`, 'success');
        }
        
        router.push(`/users/${clientId}`);
      } else {
        await UserPlanService.createUser(request);
        toast('Client Created', `Successfully registered client '${clientName}' (${clientId}).`, 'success');
        router.push(`/users`);
      }
    } catch (error) {
      const apiError = error as ApiError;
      handleApiError(apiError, 'Failed to save client');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {loadingPlans ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading plans...</div>
      ) : (
        <>
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
                  placeholder="e.g. C-001"
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
                  placeholder="e.g. ABC Technologies"
                  className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
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
                onChange={(e) => setPlanId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.planName}
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
                    <h4 className="text-xs font-bold text-amber-950">Enable Custom Rule</h4>
                    <p className="text-[11px] text-amber-800/90">
                      When enabled, allows custom rate limit configuration for this client.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customRuleEnabled}
                    onChange={(e) => setCustomRuleEnabled(e.target.checked)}
                    disabled={!isEnterprisePlan}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-amber-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 disabled:opacity-50" />
                </label>
              </div>

              {!isEnterprisePlan && customRuleEnabled && (
                <p className="text-[11px] text-amber-700 font-medium">
                  Custom rules are available only for Enterprise clients.
                </p>
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
        </>
      )}
    </form>
  );
}
