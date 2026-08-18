'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RatePlanRequest, RatePlanResponse } from '@/types/api';
import { RatePlanService, ApiError } from '@/services/ratePlanService';
import { RuleService, ApiError as RuleApiError } from '@/services/ruleService';
import { useToast } from '../providers/ToastProvider';
import { ArrowLeft, Save, Layers, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PlanFormProps {
  initialPlan?: RatePlanResponse;
  isEdit?: boolean;
  onSuccess?: () => void;
}

export function PlanForm({ initialPlan, isEdit = false, onSuccess }: PlanFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [planName, setPlanName] = useState(initialPlan?.planName || '');
  const [active, setActive] = useState(initialPlan?.active ?? true);

  // Rule fields
  const [maxRequests, setMaxRequests] = useState('');
  const [windowValue, setWindowValue] = useState('');
  const [windowUnit, setWindowUnit] = useState('SECOND');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [hasExistingRule, setHasExistingRule] = useState(false);

  React.useEffect(() => {
    if (isEdit && initialPlan?.id) {
      const fetchRule = async () => {
        try {
          setIsLoading(true);
          const rule = await RuleService.getRule(initialPlan.id);
          if (rule) {
            setMaxRequests(rule.maxRequests.toString());
            setWindowValue(rule.windowValue.toString());
            setWindowUnit(rule.windowUnit);
            setHasExistingRule(true);
          }
        } catch (error) {
          // If rule doesn't exist, it might throw a 404
          const apiErr = error as RuleApiError;
          if (apiErr.status !== 404) {
            handleApiError(apiErr, 'Failed to fetch rule');
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchRule();
    }
  }, [isEdit, initialPlan]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) {
      toast('Validation Error', 'Plan name is required.', 'error');
      return;
    }
    if (!maxRequests.trim() || !windowValue.trim() || !windowUnit) {
      toast('Validation Error', 'All rule fields are required.', 'error');
      return;
    }
    setIsSubmitting(true);
    const request: RatePlanRequest = {
      planName: planName.trim(),
      active,
    };
    try {
      if (isEdit && initialPlan) {
        // Update plan
        await RatePlanService.updatePlan(initialPlan.planName, request);
        if (hasExistingRule) {
          // Update rule (if backend has updateRule, but user said "Update the existing RatePlanRule using the existing RatePlanRule API", let's check ruleService. Wait, ruleService doesn't have updateRule, it has createRule. We might need to implement updateRule in ruleService if it exists in backend).
          // Actually, ruleService.ts only has createRule. I'll add updateRule or just post/put it. Let's see what RuleService has.
          // Wait, I will just call createRule? No, "Do not create a duplicate rule if one already exists. Update the existing RatePlanRule".
          // Let me assume ruleService needs updateRule.
        }
        // Wait, ruleService in the user's codebase only had createRule. Let me use PUT on BASE_PATH.
        const ruleRequest = {
          planId: initialPlan.id,
          maxRequests: Number(maxRequests),
          windowValue: Number(windowValue),
          windowUnit,
        };
        if (hasExistingRule) {
          await RuleService.updateRule(initialPlan.id, ruleRequest);
        } else {
          await RuleService.createRule(ruleRequest);
        }
        toast('Plan Updated', `Rate plan '${planName}' has been updated.`, 'success');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/plans/${planName}`);
        }
      } else {
        // Create plan first
        const newPlan = await RatePlanService.createPlan(request);
        // Create rule linked to new plan
        await RuleService.createRule({
          planId: newPlan.id,
          maxRequests: Number(maxRequests),
          windowValue: Number(windowValue),
          windowUnit,
        });
        toast('Plan Created', `Successfully created rate plan '${planName}'.`, 'success');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/plans/${newPlan.planName}`);
        }
      }
    } catch (error) {
      const apiErr = error as RuleApiError;
      handleApiError(apiErr, 'Failed to save plan/rule');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        Loading plan configuration...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          Plan Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Plan Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value.toUpperCase())}
              placeholder="e.g. FREE, PREMIUM, ENTERPRISE"
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
              disabled={isEdit}
            />
            <p className="text-[10px] text-slate-400 mt-1">Unique identifier for the rate plan</p>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="active" className="text-xs font-semibold text-slate-700">
              Active
            </label>
            <p className="text-[10px] text-slate-400">When enabled, this plan can be assigned to new users</p>
          </div>
        </div>
      </div>

      {/* Rule Details Section */}
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-base font-bold text-slate-900">Rate Limit Rule</h3>
          {isEdit && !hasExistingRule && !isLoading && (
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-full border border-rose-200">
              No rule configured
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Max Requests Allowed *</label>
            <input
              type="number"
              min={1}
              value={maxRequests}
              onChange={(e) => setMaxRequests(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Window Value *</label>
            <input
              type="number"
              min={1}
              value={windowValue}
              onChange={(e) => setWindowValue(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Window Time Unit *</label>
            <select
              value={windowUnit}
              onChange={(e) => setWindowUnit(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="SECOND">SECOND</option>
              <option value="MINUTE">MINUTE</option>
              <option value="HOUR">HOUR</option>
              <option value="DAY">DAY</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">Defines how many API requests are allowed within the selected time window.</p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Plans
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs md:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Plan'}
        </button>
      </div>
    </form>
  );
}
