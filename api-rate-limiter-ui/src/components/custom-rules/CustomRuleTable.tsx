'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserCustomRuleResponse, Page, UserPlanResponse } from '@/types/api';
import { DataTable, Column } from '../ui/DataTable';
import { CustomRuleService, ApiError } from '@/services/customRuleService';
import { UserPlanService } from '@/services/userPlanService';
import { Zap, Server } from 'lucide-react';
import { formatRuleSpec, formatTimeAgo } from '@/lib/utils';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../providers/ToastProvider';
import { Eye, Edit3, Trash2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';

export function CustomRuleTable() {
  const router = useRouter();
  const { toast } = useToast();

  const [rules, setRules] = useState<UserCustomRuleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<UserCustomRuleResponse | null>(null);
  const [userMap, setUserMap] = useState<Record<string, UserPlanResponse>>({});

  const fetchRules = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      // Fetch custom rules
      const data: Page<UserCustomRuleResponse> = await CustomRuleService.searchCustomRules('', 0, 100);
      setRules(data.content);
      // Fetch all users to map plans
      const usersData: Page<UserPlanResponse> = await UserPlanService.getAllUsers(0, 1000);
      const map: Record<string, UserPlanResponse> = {};
      usersData.content.forEach((u) => {
        map[u.clientId] = u;
      });
      setUserMap(map);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Failed to load data');
      handleApiError(apiError, 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const refreshData = () => {
    fetchRules();
  };

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

  const handleDeleteConfirm = async () => {
    if (!ruleToDelete) return;
    try {
      await CustomRuleService.deleteCustomRule(ruleToDelete.clientId);
      toast('Custom Rule Removed', `Removed custom rule for '${ruleToDelete.clientName}' (${ruleToDelete.clientId}). User reverted to Plan rule.`, 'info');
      setRuleToDelete(null);
      refreshData();
    } catch (error) {
      const apiError = error as ApiError;
      handleApiError(apiError, 'Failed to delete custom rule');
    }
  };

  const columns: Column<UserCustomRuleResponse>[] = [
    {
      header: 'Client ID & Name',
      accessorKey: 'clientName',
      cell: (rule) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-xs text-amber-700 shrink-0">
            <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
          </div>
          <div>
            <Link
              href={`/custom-rules/${rule.clientId}`}
              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-sm block"
              onClick={(e) => e.stopPropagation()}
            >
              {rule.clientName}
            </Link>
            <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
              {rule.clientId}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Custom Limit Specification',
      cell: (rule) => (
        <div>
          <span className="font-mono font-extrabold text-slate-900 text-xs block">
            {formatRuleSpec(rule.maxRequests, rule.windowValue, rule.windowUnit as any)}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">
            Window TTL: {rule.windowValue} {rule.windowUnit}
          </span>
        </div>
      ),
    },
    {
      header: 'Price',
      accessorKey: 'price',
      cell: (rule) => (
        <span className="text-xs text-slate-600 font-medium">
          ${rule.price?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      header: 'Last Updated',
      accessorKey: 'updatedAt',
      cell: (rule) => (
        <span className="text-xs text-slate-500 font-medium">
          {formatTimeAgo(rule.updatedAt)}
        </span>
      ),
    },
    {
      header: 'Rule Status',
      accessorKey: 'active',
      cell: (rule) => {
        const user = userMap[rule.clientId];
        const isEnterprise = user?.planName?.toUpperCase() === 'ENTERPRISE';
        const effectiveActive = isEnterprise && user?.customRuleEnabled && rule.active;
        const enabled = effectiveActive;
        const statusText = enabled ? 'ACTIVE OVERRIDE' : 'DISABLED';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              enabled ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            {enabled ? <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" /> : <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            {statusText}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (rule) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/custom-rules/${rule.clientId}`}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit Custom Rule"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit3 className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRuleToDelete(rule);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Custom Rule"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading custom rules...</div>
      ) : error ? (
        <div className="p-6">
          <ErrorState title="Unable to load custom rules" message={error} />
        </div>
      ) : rules.length === 0 ? (
        <div className="p-6">
          <EmptyState title="No Custom Rules Configured" description="Custom rate limit rules are used for Enterprise clients to override default plan limits." />
        </div>
      ) : (
        <DataTable
          data={rules}
          columns={columns}
          searchKey="clientName"
          searchPlaceholder="Search custom rules..."
          emptyTitle="No Custom Rules Configured"
          emptyDescription="Custom rate limit rules are used for Enterprise clients to override default plan limits."
          onRowClick={(r) => router.push(`/custom-rules/${r.clientId}`)}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(ruleToDelete)}
        onClose={() => setRuleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Custom Override Rule"
        description={`Are you sure you want to remove the custom rule for '${ruleToDelete?.clientName}' (${ruleToDelete?.clientId})? This client will revert to their default Rate Plan rule.`}
        confirmText="Remove Rule"
        variant="warning"
      />
    </>
  );
}
