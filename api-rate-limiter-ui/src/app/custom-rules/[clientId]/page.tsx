'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { CustomRuleForm } from '@/components/custom-rules/CustomRuleForm';
import { UserCustomRuleResponse } from '@/types/api';
import { CustomRuleService, ApiError } from '@/services/customRuleService';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/components/providers/ToastProvider';

export default function EditCustomRulePage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = React.use(params);
  const [existingRule, setExistingRule] = useState<UserCustomRuleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadRule = async () => {
      try {
        const ruleData = await CustomRuleService.getCustomRuleByClientId(clientId);
        setExistingRule(ruleData);
      } catch (error) {
        const apiError = error as ApiError;
        if (apiError.status === 404) {
          // If no existing rule, we'll create a new one for this client
          setExistingRule(null);
        } else {
          let message = 'Failed to load custom rule';
          if (apiError.status === 500) message = 'Server error. Please try again later.';
          else if (apiError.status === 503) message = 'Service unavailable. Please try again later.';
          else if (apiError.message) message = apiError.message;
          toast('Error', message, 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    loadRule();
  }, [clientId, toast]);

  if (loading) {
    return (
      <MainLayout>
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Custom Rules', href: '/custom-rules' },
            { label: clientId },
          ]}
        />
        <div className="p-8 text-center text-slate-500 text-sm">Loading custom rule details...</div>
      </MainLayout>
    );
  }

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

      <CustomRuleForm initialRule={existingRule || undefined} targetClientId={clientId} isEdit={Boolean(existingRule)} />
    </MainLayout>
  );
}
