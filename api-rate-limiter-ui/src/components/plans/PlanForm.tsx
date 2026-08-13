'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RatePlanRequest, RatePlanResponse } from '@/types/api';
import { RatePlanService, ApiError } from '@/services/ratePlanService';
import { useToast } from '../providers/ToastProvider';
import { ArrowLeft, Save, Layers } from 'lucide-react';
import Link from 'next/link';

interface PlanFormProps {
  initialPlan?: RatePlanResponse;
  isEdit?: boolean;
}

export function PlanForm({ initialPlan, isEdit = false }: PlanFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [planName, setPlanName] = useState(initialPlan?.planName || '');
  const [active, setActive] = useState(initialPlan?.active ?? true);

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    try {
      const request: RatePlanRequest = {
        planName: planName.trim(),
        active,
      };

      if (isEdit && initialPlan) {
        await RatePlanService.updatePlan(initialPlan.planName, request);
        toast('Plan Updated', `Rate plan '${planName}' has been updated.`, 'success');
        router.push(`/plans/${planName}`);
      } else {
        const newPlan = await RatePlanService.createPlan(request);
        toast('Plan Created', `Successfully created rate plan '${planName}'.`, 'success');
        router.push(`/plans/${newPlan.planName}`);
      }
    } catch (error) {
      const apiError = error as ApiError;
      handleApiError(apiError, 'Failed to save plan');
      setIsSubmitting(false);
    }
  };

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

      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80">
        <p className="text-xs text-amber-800">
          <strong>Note:</strong> Rate limit rules (maxRequests, windowValue, windowUnit) are configured separately through the Rules management interface.
        </p>
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
