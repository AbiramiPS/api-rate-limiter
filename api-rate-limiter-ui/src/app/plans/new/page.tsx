'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { PlanForm } from '@/components/plans/PlanForm';

export default function NewPlanPage() {
  return (
    <MainLayout>
      <PageHeader
        title="Create Rate Limit Plan"
        description="Define rule parameters (maxRequests per window) for a new user plan."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Rate Plans', href: '/plans' },
          { label: 'New Plan' },
        ]}
      />

      <PlanForm />
    </MainLayout>
  );
}
