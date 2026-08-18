'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlanRequest, RatePlanResponse, UserCustomRuleRequest } from '@/types/api';
import { RatePlanService } from '@/services/ratePlanService';
import { UserPlanService, ApiError } from '@/services/userPlanService';
import { CustomRuleService } from '@/services/customRuleService';
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

  // Custom rule configuration state
  const [maxRequests, setMaxRequests] = useState<number | ''>('');
  const [windowValue, setWindowValue] = useState<number | ''>('');
  const [windowUnit, setWindowUnit] = useState<string>('MINUTE');
  const [price, setPrice] = useState<number | ''>('');
  const [customRuleActive, setCustomRuleActive] = useState<boolean>(true);
  const [hasExistingRule, setHasExistingRule] = useState<boolean>(false);

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

  // Load custom rule details if in edit mode and custom rule is enabled
  useEffect(() => {
    if (isEdit && initialUser?.clientId && initialUser?.customRuleEnabled) {
      const loadCustomRule = async () => {
        try {
          const rule = await CustomRuleService.getCustomRuleByClientId(initialUser.clientId);
          setMaxRequests(rule.maxRequests);
          setWindowValue(rule.windowValue);
          setWindowUnit(rule.windowUnit);
          setPrice(rule.price);
          setCustomRuleActive(rule.active);
          setHasExistingRule(true);
        } catch (error) {
          console.error('Failed to load custom rule:', error);
          setHasExistingRule(false);
        }
      };
      loadCustomRule();
    }
  }, [isEdit, initialUser]);

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

  // Handle plan change and apply Enterprise business rules
  const handlePlanChange = (selectedPlanId: number) => {
    setPlanId(selectedPlanId);
    const selPlan = plans.find((p) => p.id === selectedPlanId);
    const isEnterprise = selPlan?.planName?.toUpperCase() === 'ENTERPRISE';
    if (!isEnterprise) {
      setCustomRuleEnabled(false);
      // Clear custom rule state
      setMaxRequests('');
      setWindowValue('');
      setWindowUnit('MINUTE');
      setPrice('');
      setCustomRuleActive(true);
    }
  };

  const showCustomRule = isEnterprisePlan && customRuleEnabled;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientId.trim()) {
      toast('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    // Custom rule input validations
    if (showCustomRule) {
      if (maxRequests === '' || Number(maxRequests) <= 0) {
        toast('Validation Error', 'Max Requests is required and must be greater than 0.', 'error');
        return;
      }
      if (windowValue === '' || Number(windowValue) <= 0) {
        toast('Validation Error', 'Window Value is required and must be greater than 0.', 'error');
        return;
      }
      if (windowUnit === '') {
        toast('Validation Error', 'Window Unit is required.', 'error');
        return;
      }
      if (price !== '' && Number(price) < 0) {
        toast('Validation Error', 'Price must be greater than or equal to 0.', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Ensure custom rule is only sent if Enterprise plan
      const effectiveCustomRuleEnabled = customRuleEnabled && isEnterprisePlan;
      const request: UserPlanRequest = {
        clientId: clientId.trim(),
        clientName: clientName.trim(),
        planId,
        customRuleEnabled: effectiveCustomRuleEnabled,
      };

      let savedUser;
      if (isEdit && initialUser) {
        savedUser = await UserPlanService.updateUser(initialUser.clientId, request);
      } else {
        savedUser = await UserPlanService.createUser(request);
      }

      // Handle custom rule save/update/delete flow
      if (effectiveCustomRuleEnabled) {
        const customRuleRequest: UserCustomRuleRequest = {
          userPlanId: savedUser.id,
          maxRequests: Number(maxRequests),
          windowValue: Number(windowValue),
          windowUnit,
          price: price !== '' ? Number(price) : 0,
          active: customRuleActive,
        };

        if (isEdit && hasExistingRule) {
          await CustomRuleService.updateCustomRule(clientId.trim(), customRuleRequest);
          toast('Client & Custom Rule Saved', `Updated client details and custom rule. Redis cache invalidated.`, 'success');
        } else {
          await CustomRuleService.createCustomRule(customRuleRequest);
          toast('Client & Custom Rule Saved', `Registered client and created rate limit custom rule. Redis cache invalidated.`, 'success');
        }
      } else {
        // Downgraded or switched OFF: clean up any existing custom rule
        if (isEdit && hasExistingRule) {
          try {
            await CustomRuleService.deleteCustomRule(clientId.trim());
          } catch (err) {
            console.warn('Custom rule cleanup skipped or not found:', err);
          }
        }
        toast('Client Saved', `Successfully saved client details.`, 'success');
      }

      if (isEdit) {
        router.push(`/users/${clientId}`);
      } else {
        router.push(`/users`);
      }
    } catch (error) {
      const apiError = error as ApiError;
      handleApiError(apiError, 'Failed to save client');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {loadingPlans ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading plans...</div>
      ) : (
        <div className="space-y-6">
          <div className={showCustomRule ? "grid grid-cols-1 lg:grid-cols-2 gap-6 items-start" : "max-w-2xl space-y-6"}>
            
            {/* Left Column: Client & Rate Limit Profile */}
            <div className="space-y-6">
              
              {/* Client Identification Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Client Identification
                </h3>

                <div className="space-y-4">
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
                    <p className="text-[10px] text-slate-400 mt-1">Unique identifier used in request headers (X-clientId)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Client Name <span className="text-rose-500">*</span>
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

              {/* Rate Limiting Configuration Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Rate Limiting Configuration
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Rate Plan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={planId}
                      onChange={(e) => handlePlanChange(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.planName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Rule Enable Switch (Enterprise Feature) */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                        <div>
                          <h4 className="text-xs font-bold text-amber-950">Enable Custom Rule</h4>
                          <p className="text-[11px] text-amber-800/90">
                            Apply rate limit custom override configuration.
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

                    {!isEnterprisePlan && (
                      <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        Custom rules are available only for Enterprise clients.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Custom Rule Configuration (Render only when Enterprise + toggle ON) */}
            {showCustomRule && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                    Custom Rate Limit Configuration
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This rule overrides the Enterprise plan's default rate limit for this client.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Max Requests Allowed <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={maxRequests}
                        onChange={(e) => setMaxRequests(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 200"
                        className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
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
                        onChange={(e) => setWindowValue(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 1"
                        className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Window Time Unit <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={windowUnit}
                        onChange={(e) => setWindowUnit(e.target.value)}
                        className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                        required
                      >
                        <option value="SECOND">Second</option>
                        <option value="MINUTE">Minute</option>
                        <option value="HOUR">Hour</option>
                        <option value="DAY">Day</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Rule Cost Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 500"
                        className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="customRuleActive"
                      checked={customRuleActive}
                      onChange={(e) => setCustomRuleActive(e.target.checked)}
                      className="w-4 h-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="customRuleActive" className="text-xs font-semibold text-slate-700 select-none">
                      Active Override (Enable immediately)
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 max-w-6xl">
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
        </div>
      )}
    </form>
  );
}
