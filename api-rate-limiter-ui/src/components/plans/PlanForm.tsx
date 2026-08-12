'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RatePlan, WindowUnit } from '@/types';
import { RateLimiterStore } from '@/lib/services/store';
import { useToast } from '../providers/ToastProvider';
import { ArrowLeft, Save, Layers } from 'lucide-react';
import Link from 'next/link';

interface PlanFormProps {
  initialPlan?: RatePlan;
  isEdit?: boolean;
}

export function PlanForm({ initialPlan, isEdit = false }: PlanFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(initialPlan?.name || '');
  const [code, setCode] = useState(initialPlan?.code || '');
  const [description, setDescription] = useState(initialPlan?.description || '');
  const [maxRequests, setMaxRequests] = useState(initialPlan?.maxRequests || 20);
  const [windowValue, setWindowValue] = useState(initialPlan?.windowValue || 1);
  const [windowUnit, setWindowUnit] = useState<WindowUnit>(initialPlan?.windowUnit || 'MINUTE');
  const [isDefault, setIsDefault] = useState(initialPlan?.isDefault || false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || maxRequests <= 0 || windowValue <= 0) {
      toast('Validation Error', 'Please check all required rate limit parameters.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && initialPlan) {
        RateLimiterStore.updatePlan(initialPlan.id, {
          name,
          code: code.toUpperCase(),
          description,
          maxRequests: Number(maxRequests),
          windowValue: Number(windowValue),
          windowUnit,
          isDefault,
        });
        toast('Rate Plan Saved', `Updated rate plan '${name}'.`, 'success');
        router.push(`/plans/${initialPlan.id}`);
      } else {
        const newPlan = RateLimiterStore.createPlan({
          name,
          code: code.toUpperCase(),
          description,
          maxRequests: Number(maxRequests),
          windowValue: Number(windowValue),
          windowUnit,
          isDefault,
        });
        toast('Rate Plan Created', `Added new rate plan '${name}'.`, 'success');
        router.push(`/plans/${newPlan.id}`);
      }
    } catch (err: any) {
      toast('Failed to Save Plan', err.message || 'Error occurred', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          Plan Identity & Metadata
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Plan Display Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Professional Tier"
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Plan Code Symbol <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. PRO_SCALE"
              className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Intended Purpose
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Designed for production workloads requiring up to 50 req/min..."
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Rate Limit Rule Specification
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
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="SECOND">SECOND</option>
              <option value="MINUTE">MINUTE</option>
              <option value="HOUR">HOUR</option>
              <option value="DAY">DAY</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="isDefault"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <label htmlFor="isDefault" className="text-xs font-semibold text-slate-700">
            Set as Default Plan for new registered users
          </label>
        </div>
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
