'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCustomRuleRequest, UserCustomRuleResponse, UserPlanResponse, Page } from '@/types/api';
import { CustomRuleService, ApiError } from '@/services/customRuleService';
import { UserPlanService } from '@/services/userPlanService';
import { useToast } from '../providers/ToastProvider';
import { ArrowLeft, Save, Zap, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface CustomRuleFormProps {
  initialRule?: UserCustomRuleResponse;
  targetClientId?: string;
  isEdit?: boolean;
}

export function CustomRuleForm({ initialRule, targetClientId, isEdit = false }: CustomRuleFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserPlanResponse[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialRule?.clientId || targetClientId || ''
  );
  const [maxRequests, setMaxRequests] = useState<number>(initialRule?.maxRequests || 200);
  const [windowValue, setWindowValue] = useState<number>(initialRule?.windowValue || 1);
  const [windowUnit, setWindowUnit] = useState<string>(initialRule?.windowUnit || 'MINUTE');
  const [price, setPrice] = useState<number>(initialRule?.price || 0);
  const [active, setActive] = useState<boolean>(initialRule?.active ?? true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load users from backend
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data: Page<UserPlanResponse> = await UserPlanService.getAllUsers(0, 1000);
        // Filter to only show Enterprise users (they can have custom rules)
        const enterpriseUsers = data.content.filter(u => u.planName === 'ENTERPRISE');
        setUsers(enterpriseUsers);
        
        if (enterpriseUsers.length > 0 && !selectedClientId && !targetClientId) {
          setSelectedClientId(enterpriseUsers[0].clientId);
        }
      } catch (error) {
        const apiError = error as ApiError;
        handleApiError(apiError, 'Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, [selectedClientId, targetClientId]);

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

  const activeUser = users.find((u) => u.clientId === selectedClientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || maxRequests <= 0 || windowValue <= 0) {
      toast('Validation Error', 'Please specify valid custom rule parameters.', 'error');
      return;
    }

    // Only Enterprise users can have custom rules
    if (activeUser && activeUser.planName !== 'ENTERPRISE') {
      toast('Validation Error', 'Custom rules are only available for Enterprise clients.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const userPlan = await UserPlanService.getUserByClientId(selectedClientId);
      
      const request: UserCustomRuleRequest = {
        userPlanId: userPlan.id,
        maxRequests: Number(maxRequests),
        windowValue: Number(windowValue),
        windowUnit,
        price: Number(price),
        active,
      };

      if (isEdit && initialRule) {
        await CustomRuleService.updateCustomRule(selectedClientId, request);
        toast('Custom Rule Updated', `Updated rate limit override rule for '${activeUser?.clientName}'. Redis cache invalidated.`, 'success');
      } else {
        await CustomRuleService.createCustomRule(request);
        toast('Custom Rule Created', `Created rate limit override rule for '${activeUser?.clientName}'. Redis cache invalidated.`, 'success');
      }
      
      router.push('/custom-rules');
    } catch (error) {
      const apiError = error as ApiError;
      handleApiError(apiError, 'Failed to save custom rule');
      setIsSubmitting(false);
    }
  };

  if (loadingUsers) {
    return <div className="p-8 text-center text-slate-500 text-sm">Loading Enterprise users...</div>;
  }

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
            required
          >
            <option value="">Select a client...</option>
            {users.map((u) => (
              <option key={u.clientId} value={u.clientId}>
                {u.clientId} - {u.clientName} (Assigned Plan: {u.planName})
              </option>
            ))}
          </select>
          {activeUser && (
            <p className="text-xs text-slate-500 mt-1">
              Assigned Plan: <span className="font-semibold text-slate-800">{activeUser.planName}</span>
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
              onChange={(e) => setWindowUnit(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="SECOND">SECOND</option>
              <option value="MINUTE">MINUTE</option>
              <option value="HOUR">HOUR</option>
              <option value="DAY">DAY</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3 pt-4">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
            />
            <label htmlFor="active" className="text-xs font-semibold text-slate-700">
              Active
            </label>
            <p className="text-[10px] text-slate-400">When enabled, this custom rule will be used for rate limiting</p>
          </div>
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
