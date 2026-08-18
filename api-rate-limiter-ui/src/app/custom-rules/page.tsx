'use client';

import React from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { CustomRuleTable } from '@/components/custom-rules/CustomRuleTable';
import { Plus, Zap } from 'lucide-react';

export default function CustomRulesPage() {
  return (
    <MainLayout>
      <PageHeader
        title="Enterprise Custom Rules"
        description="Configure client-specific rate limit overrides that bypass standard plan defaults when customRuleEnabled is active."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Custom Rules' }]}
        actions={
          <Link
            href="/custom-rules/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-semibold text-amber-900 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Custom Rule
          </Link>
        }
      />

      <CustomRuleTable />
    </MainLayout>
  );
}
