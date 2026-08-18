'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { PlanForm } from '@/components/plans/PlanForm';
import { RatePlanResponse, RatePlanRequest } from '@/types/api';
import { RatePlanService, ApiError } from '@/services/ratePlanService';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/components/providers/ToastProvider';

export default function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { toast } = useToast();

  const [plan, setPlan] = useState<RatePlanResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const data = await RatePlanService.getPlanByName(id);
        setPlan(data);
      } catch (e) {
        const err = e as ApiError;
        toast('Error', err.message || 'Failed to load plan', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [id, toast]);

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="Loading..." description="Loading plan data..." />
        <div className="p-8 text-center text-slate-500">Loading...</div>
      </MainLayout>
    );
  }

  if (!plan) {
    return (
      <MainLayout>
        <ErrorState title="Plan Not Found" message="Unable to retrieve the requested plan." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title={`Edit Rate Plan: ${plan.planName}`}
        description="Modify the rate plan and its rule settings."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Rate Plans', href: '/plans' },
          { label: plan.planName, href: `/plans/${plan.planName}` },
          { label: 'Edit' },
        ]}
      />
      <PlanForm initialPlan={plan} isEdit />
    </MainLayout>
  );
}
