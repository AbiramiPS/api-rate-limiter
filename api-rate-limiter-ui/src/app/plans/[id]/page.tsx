'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { PlanDetailView } from '@/components/plans/PlanDetailView';
import { RatePlanResponse } from '@/types/api';
import { RatePlanService, ApiError } from '@/services/ratePlanService';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/components/providers/ToastProvider';

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [plan, setPlan] = useState<RatePlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const planData = await RatePlanService.getPlanByName(id);
        setPlan(planData);
      } catch (error) {
        const apiError = error as ApiError;
        if (apiError.status === 404) {
          notFound();
        } else {
          let message = 'Failed to load plan details';
          if (apiError.status === 500) message = 'Server error. Please try again later.';
          else if (apiError.status === 503) message = 'Service unavailable. Please try again later.';
          else if (apiError.message) message = apiError.message;
          toast('Error', message, 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    loadPlan();
  }, [id, toast]);

  if (loading) {
    return (
      <MainLayout>
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Rate Plans', href: '/plans' },
            { label: id },
          ]}
        />
        <div className="p-8 text-center text-slate-500 text-sm">Loading plan details...</div>
      </MainLayout>
    );
  }

  if (!plan) {
    return (
      <MainLayout>
        <PageHeader
          title="Rate Plan Not Found"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Rate Plans', href: '/plans' },
            { label: id },
          ]}
        />
        <ErrorState
          title={`No Rate Plan found for ID '${id}'`}
          message="The requested plan does not exist or has been deleted."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title={`Rate Plan: ${plan.planName}`}
        description={`View plan details for ${plan.planName}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Rate Plans', href: '/plans' },
          { label: plan.planName },
        ]}
      />

      <PlanDetailView plan={plan} />
    </MainLayout>
  );
}
