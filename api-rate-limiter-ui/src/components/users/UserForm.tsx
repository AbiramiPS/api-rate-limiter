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
  const [rateLimitMode, setRateLimitMode] = useState<'PLAN_DEFAULT' | 'CUSTOM'>('PLAN_DEFAULT');

  // Custom rule configuration state
  const [maxRequests, setMaxRequests] = useState<number | ''>('');
  const [windowValue, setWindowValue] = useState<number | ''>('');
  const [windowUnit, setWindowUnit] = useState<string>('MINUTE');
  const [price, setPrice] = useState<number | ''>('');
  const [customRuleActive, setCustomRuleActive] = useState<boolean>(true);

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
          setRateLimitMode('CUSTOM');
        } catch (error) {
          console.error('Failed to load custom rule:', error);
          setRateLimitMode('PLAN_DEFAULT');
        }
      };
      loadCustomRule();
    } else {
      setRateLimitMode('PLAN_DEFAULT');
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

  const planDefaultLimitText = selectedPlan
    ? `${selectedPlan.maxRequests} requests / ${selectedPlan.windowValue} ${selectedPlan.windowUnit}`
    : '';

  // Handle plan change and apply Enterprise business rules
  const handlePlanChange = (selectedPlanId: number) => {
    setPlanId(selectedPlanId);
    const selPlan = plans.find((p) => p.id === selectedPlanId);
    const isEnterprise = selPlan?.planName?.toUpperCase() === 'ENTERPRISE';
    if (!isEnterprise) {
      setRateLimitMode('PLAN_DEFAULT');
      // Clear custom rule state
      setMaxRequests('');
      setWindowValue('');
      setWindowUnit('MINUTE');
      setPrice('');
      setCustomRuleActive(true);
    }
  };

  const showCustomRule = isEnterprisePlan && rateLimitMode === 'CUSTOM';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientId.trim()) {
      toast('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    // Custom rule input validations
    if (showCustomRule) {
      if (maxRequests === '' || Number(maxRequests) <= 0) {
        toast('Validation Error', 'Requests value must be greater than 0.', 'error');
        return;
      }
      if (windowValue === '' || Number(windowValue) <= 0) {
        toast('Validation Error', 'Window value must be greater than 0.', 'error');
        return;
      }
      if (windowUnit === '') {
        toast('Validation Error', 'Window unit is required.', 'error');
        return;
      }
      if (price !== '' && Number(price) < 0) {
        toast('Validation Error', 'Price must be greater than or equal to 0.', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const customRulePayload: UserCustomRuleRequest | undefined = showCustomRule ? {
        userPlanId: 0, // Backend sets this automatically inside transaction
        maxRequests: Number(maxRequests),
        windowValue: Number(windowValue),
        windowUnit,
        price: price !== '' ? Number(price) : 0,
        active: customRuleActive,
      } : undefined;

      const request: UserPlanRequest = {
        clientId: clientId.trim(),
        clientName: clientName.trim(),
        planId,
        customRuleEnabled: showCustomRule,
        rateLimitMode,
        customRule: customRulePayload,
      };

      if (isEdit && initialUser) {
        await UserPlanService.updateUser(initialUser.clientId, request);
        toast('Client Saved', `Successfully saved client details.`, 'success');
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

              {/* Rate Limit Configuration Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Rate Limit Configuration
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rate Limit Plan <span className="text-rose-500">*</span>
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Rate Limit Mode
                    </label>
                    <div className="space-y-3">
                      {/* Option 1: Use Plan Default */}
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="rateLimitMode"
                          value="PLAN_DEFAULT"
                          checked={rateLimitMode === 'PLAN_DEFAULT'}
                          onChange={() => setRateLimitMode('PLAN_DEFAULT')}
                          className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-0.5"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900">Use Plan Default</span>
                          {rateLimitMode === 'PLAN_DEFAULT' 
                          // && (
                          //   <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                          //     Inherited Plan Limit: {planDefaultLimitText}
                          //   </p>
                          // )
                          }
                        </div>
                      </label>

                      {/* Option 2: Custom Limit */}
                      <label className={`flex items-start gap-3 select-none ${isEnterprisePlan ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                        <input
                          type="radio"
                          name="rateLimitMode"
                          value="CUSTOM"
                          checked={rateLimitMode === 'CUSTOM'}
                          onChange={() => {
                            if (isEnterprisePlan) setRateLimitMode('CUSTOM');
                          }}
                          disabled={!isEnterprisePlan}
                          className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-0.5"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900">Custom Limit</span>
                        </div>
                      </label>
                    </div>

                    {!isEnterprisePlan && (
                      <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 mt-3">
                        <Info className="w-3.5 h-3.5" />
                        Custom rules are available only for Enterprise clients.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Custom Rate Limit (Render only when rateLimitMode === CUSTOM) */}
            {showCustomRule && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                    Custom Rate Limit
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This custom limit overrides the selected plan's default rate limit.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Requests <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={maxRequests}
                        onChange={(e) => setMaxRequests(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 10"
                        className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Window <span className="text-rose-500">*</span>
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
                        Window Unit <span className="text-rose-500">*</span>
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
                        Price ($)
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={customRuleActive ? 'ACTIVE' : 'INACTIVE'}
                      onChange={(e) => setCustomRuleActive(e.target.value === 'ACTIVE')}
                      className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
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
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
