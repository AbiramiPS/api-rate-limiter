'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { UserForm } from '@/components/users/UserForm';
import { UserPlanResponse, UserPlanRequest } from '@/types/api';
import { UserPlanService, ApiError } from '@/services/userPlanService';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/components/providers/ToastProvider';
import { RatePlanService } from '@/services/ratePlanService';

export default function EditUserPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = React.use(params);
  const [user, setUser] = useState<UserPlanResponse | null>(null);
  const [initialUser, setInitialUser] = useState<UserPlanRequest | undefined>();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await UserPlanService.getUserByClientId(clientId);
        setUser(userData);
        
        // Get plans to find the planId
        const plansData = await RatePlanService.getAllPlans(0, 100);
        const currentPlan = plansData.content.find(p => p.planName === userData.planName);
        
        if (currentPlan) {
          setInitialUser({
            clientId: userData.clientId,
            clientName: userData.clientName,
            planId: currentPlan.id,
            customRuleEnabled: userData.customRuleEnabled,
          });
        }
      } catch (error) {
        const apiError = error as ApiError;
        if (apiError.status === 404) {
          notFound();
        } else {
          let message = 'Failed to load client details';
          if (apiError.status === 500) message = 'Server error. Please try again later.';
          else if (apiError.status === 503) message = 'Service unavailable. Please try again later.';
          else if (apiError.message) message = apiError.message;
          toast('Error', message, 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [clientId, toast]);

  if (loading) {
    return (
      <MainLayout>
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Users', href: '/users' },
            { label: clientId },
            { label: 'Edit' },
          ]}
        />
        <div className="p-8 text-center text-slate-500 text-sm">Loading client details...</div>
      </MainLayout>
    );
  }

  if (!user || !initialUser) {
    return (
      <MainLayout>
        <PageHeader
          title="Client Not Found"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Users', href: '/users' },
            { label: clientId },
            { label: 'Edit' },
          ]}
        />
        <ErrorState
          title={`No Client found for ID '${clientId}'`}
          message="The requested client ID does not exist in the rate limiter registry or has been deleted."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title={`Edit Client: ${user.clientName}`}
        description={`Modify rate plan assignment and custom rule configuration for ${user.clientId}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users', href: '/users' },
          { label: user.clientId },
          { label: 'Edit' },
        ]}
      />

      <UserForm initialUser={initialUser} isEdit={true} />
    </MainLayout>
  );
}
