'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { CustomRuleForm } from '@/components/custom-rules/CustomRuleForm';

export default function NewCustomRulePage() {
  return (
    <MainLayout>
      <PageHeader
        title="Create Custom Rate Limit Rule"
        description="Set custom limit parameters (maxRequests, windowValue, windowUnit) for a specific client user."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Custom Rules', href: '/custom-rules' },
          { label: 'New Rule' },
        ]}
      />

      <CustomRuleForm />
    </MainLayout>
  );
}
