'use client';

import React from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { PlanTable } from '@/components/plans/PlanTable';
import { Plus } from 'lucide-react';

export default function PlansPage() {
  return (
    <MainLayout>
      <PageHeader
        title="Rate Limit Plans Management"
        description="Configure tier-based rate limit rules (maxRequests, windowValue, windowUnit) for default user plans."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Rate Plans' }]}
        actions={
          <Link
            href="/plans/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Rate Plan
          </Link>
        }
      />

      <PlanTable />
    </MainLayout>
  );
}
