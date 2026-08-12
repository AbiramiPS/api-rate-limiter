'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RatePlan } from '@/types';
import { DataTable, Column } from '../ui/DataTable';
import { RateLimiterStore } from '@/lib/services/store';
import { formatRuleSpec } from '@/lib/utils';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../providers/ToastProvider';
import { Eye, Edit3, Trash2, Layers, CheckCircle2, Users } from 'lucide-react';

export function PlanTable() {
  const router = useRouter();
  const { toast } = useToast();

  const [plans, setPlans] = useState<RatePlan[]>(RateLimiterStore.getPlans());
  const [planToDelete, setPlanToDelete] = useState<RatePlan | null>(null);

  const refreshData = () => {
    setPlans(RateLimiterStore.getPlans());
  };

  const handleDeleteConfirm = () => {
    if (!planToDelete) return;
    try {
      RateLimiterStore.deletePlan(planToDelete.id);
      toast('Plan Deleted', `Removed rate plan '${planToDelete.name}'`, 'success');
      setPlanToDelete(null);
      refreshData();
    } catch (err: any) {
      toast('Cannot Delete Plan', err.message || 'Error occurred', 'error');
    }
  };

  const columns: Column<RatePlan>[] = [
    {
      header: 'Plan Name & Code',
      accessorKey: 'name',
      cell: (plan) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/plans/${plan.id}`}
                className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-sm"
              >
                {plan.name}
              </Link>
              {plan.isDefault && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  DEFAULT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{plan.code}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Rate Limit Rule Specification',
      cell: (plan) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">
            {formatRuleSpec(plan.maxRequests, plan.windowValue, plan.windowUnit)}
          </span>
          <span className="text-[11px] text-slate-400">
            Window TTL: {plan.windowValue} {plan.windowUnit.toLowerCase()}
          </span>
        </div>
      ),
    },
    {
      header: 'Assigned Clients',
      accessorKey: 'userCount',
      cell: (plan) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{plan.userCount} clients</span>
        </div>
      ),
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: (plan) => (
        <span className="text-xs text-slate-500 max-w-xs truncate block">{plan.description}</span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (plan) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/plans/${plan.id}`}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="View or Edit Plan"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setPlanToDelete(plan)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Plan"
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
        data={plans}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search plans..."
        emptyTitle="No Rate Plans"
        emptyDescription="Create a new rate plan to get started."
        onRowClick={(p) => router.push(`/plans/${p.id}`)}
      />

      <ConfirmDialog
        isOpen={Boolean(planToDelete)}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Rate Plan"
        description={`Are you sure you want to delete rate plan '${planToDelete?.name}'? Note that plans with active users cannot be deleted.`}
        confirmText="Delete Plan"
        variant="danger"
      />
    </>
  );
}
