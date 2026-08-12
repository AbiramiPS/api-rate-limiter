'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserCustomRule } from '@/types';
import { DataTable, Column } from '../ui/DataTable';
import { StatusBadge } from '../ui/StatusBadge';
import { RateLimiterStore } from '@/lib/services/store';
import { formatRuleSpec, formatTimeAgo } from '@/lib/utils';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../providers/ToastProvider';
import { Eye, Edit3, Trash2, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function CustomRuleTable() {
  const router = useRouter();
  const { toast } = useToast();

  const [rules, setRules] = useState<UserCustomRule[]>(RateLimiterStore.getCustomRules());
  const [ruleToDelete, setRuleToDelete] = useState<UserCustomRule | null>(null);

  const refreshData = () => {
    setRules(RateLimiterStore.getCustomRules());
  };

  const handleDeleteConfirm = () => {
    if (!ruleToDelete) return;
    try {
      RateLimiterStore.deleteCustomRule(ruleToDelete.clientId);
      toast('Custom Rule Removed', `Removed custom rule for '${ruleToDelete.clientName}' (${ruleToDelete.clientId}). User reverted to Plan rule.`, 'info');
      setRuleToDelete(null);
      refreshData();
    } catch (err: any) {
      toast('Failed to Delete Rule', err.message || 'Error occurred', 'error');
    }
  };

  const columns: Column<UserCustomRule>[] = [
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
            {formatRuleSpec(rule.maxRequests, rule.windowValue, rule.windowUnit)}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">
            Window TTL: {rule.windowValue} {rule.windowUnit}
          </span>
        </div>
      ),
    },
    {
      header: 'Override Rationale',
      accessorKey: 'reason',
      cell: (rule) => (
        <span className="text-xs text-slate-600 max-w-xs truncate block italic">
          {rule.reason || 'No justification specified'}
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
      accessorKey: 'enabled',
      cell: (rule) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            rule.enabled
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              rule.enabled ? 'bg-amber-500' : 'bg-slate-400'
            }`}
          />
          {rule.enabled ? 'ACTIVE OVERRIDE' : 'INACTIVE'}
        </span>
      ),
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
          >
            <Edit3 className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setRuleToDelete(rule)}
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
      <DataTable
        data={rules}
        columns={columns}
        searchKey="clientName"
        searchPlaceholder="Search custom rules..."
        emptyTitle="No Custom Rules Configured"
        emptyDescription="Custom rate limit rules are used for Enterprise clients to override default plan limits."
        onRowClick={(r) => router.push(`/custom-rules/${r.clientId}`)}
      />

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
