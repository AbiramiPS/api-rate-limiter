'use client';

import React, { use } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { CustomRuleForm } from '@/components/custom-rules/CustomRuleForm';
import { RateLimiterStore } from '@/lib/services/store';

export default function EditCustomRulePage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const existingRule = RateLimiterStore.getCustomRuleByClientId(clientId);

  return (
    <MainLayout>
      <PageHeader
        title={`Custom Rule: ${clientId}`}
        description={`Configure rate limit override parameters for client ${clientId}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Custom Rules', href: '/custom-rules' },
          { label: clientId },
        ]}
      />

      <CustomRuleForm initialRule={existingRule} targetClientId={clientId} isEdit={Boolean(existingRule)} />
    </MainLayout>
  );
}
