'use client';

import React, { use } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { PlanDetailView } from '@/components/plans/PlanDetailView';
import { RateLimiterStore } from '@/lib/services/store';
import { ErrorState } from '@/components/ui/ErrorState';

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const plan = RateLimiterStore.getPlanById(id);

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
        title={`Rate Plan: ${plan.name}`}
        description={`View plan rule details and clients currently assigned to ${plan.code}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Rate Plans', href: '/plans' },
          { label: plan.name },
        ]}
      />

      <PlanDetailView plan={plan} />
    </MainLayout>
  );
}
