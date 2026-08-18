'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RatePlanResponse, Page } from '@/types/api';
import { DataTable, Column } from '../ui/DataTable';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { RatePlanService, ApiError } from '@/services/ratePlanService';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../providers/ToastProvider';
import { Eye, Edit3, Trash2, Layers, CheckCircle2, Users } from 'lucide-react';
import { PlanForm } from '@/components/plans/PlanForm';

export function PlanTable() {
  const router = useRouter();
  const { toast } = useToast();

  const [plans, setPlans] = useState<RatePlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<RatePlanResponse | null>(null);
  const [editingPlan, setEditingPlan] = useState<RatePlanResponse | null>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 100,
    totalElements: 0,
    totalPages: 0,
  });

  const fetchPlans = useCallback(async (page: number = 0) => {
    try {
      setError(null);
      setLoading(true);
      const data: Page<RatePlanResponse> = await RatePlanService.getAllPlans(page, pagination.size);
      setPlans(data.content);
      setPagination({
        page: data.number,
        size: data.size,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
      });
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Failed to load plans');
      handleApiError(apiError, 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, [pagination.size]);

  useEffect(() => {
    fetchPlans(0);
  }, [fetchPlans]);

  const refreshData = () => {
    fetchPlans(pagination.page);
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
    if (!planToDelete) return;
    try {
      await RatePlanService.deletePlan(planToDelete.planName);
      toast('Plan Deleted', `Removed rate plan '${planToDelete.planName}'`, 'success');
      setPlanToDelete(null);
      refreshData();
    } catch (error) {
      const apiError = error as ApiError;
      handleApiError(apiError, 'Failed to delete plan');
    }
  };

  const columns: Column<RatePlanResponse>[] = [
    {
      header: 'Plan Name',
      accessorKey: 'planName',
      cell: (plan) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <Link
              href={`/plans/${plan.planName}`}
              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-sm"
            >
              {plan.planName}
            </Link>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'active',
      cell: (plan) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            plan.active
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${plan.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {plan.active ? 'ACTIVE' : 'INACTIVE'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (plan) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/plans/${plan.planName}`}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="View Plan"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPlanToDelete(plan);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Plan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingPlan(plan);
            }}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Plan"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading rate plans...</div>
      ) : error ? (
        <div className="p-6">
          <ErrorState title="Unable to load rate plans" description={error} />
        </div>
      ) : plans.length === 0 ? (
        <div className="p-6">
          <EmptyState title="No Rate Plans" description="Create a new rate plan to get started." />
        </div>
      ) : (
        <DataTable
          data={plans}
          columns={columns}
          searchKey="planName"
          searchPlaceholder="Search plans..."
          emptyTitle="No Rate Plans"
          emptyDescription="Create a new rate plan to get started."
          onRowClick={(p) => router.push(`/plans/${p.planName}`)}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(planToDelete)}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Rate Plan"
        description={`Are you sure you want to delete rate plan '${planToDelete?.planName}'?`}
        confirmText="Delete Plan"
        variant="danger"
      />

      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-2xl w-full shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Edit Rate Plan: {editingPlan.planName}</h2>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <PlanForm
              initialPlan={editingPlan}
              isEdit
              onSuccess={() => {
                setEditingPlan(null);
                refreshData();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
