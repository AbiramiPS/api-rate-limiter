'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { UserDetailView } from '@/components/users/UserDetailView';
import { UserPlanResponse } from '@/types/api';
import { UserPlanService, ApiError } from '@/services/userPlanService';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/components/providers/ToastProvider';

export default function UserDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = React.use(params);
  const [user, setUser] = useState<UserPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await UserPlanService.getUserByClientId(clientId);
        setUser(userData);
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
          ]}
        />
        <div className="p-8 text-center text-slate-500 text-sm">Loading client details...</div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <PageHeader
          title="Client Not Found"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Users', href: '/users' },
            { label: clientId },
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
        title={`Client Details: ${user.clientName}`}
        description={`View active rate limit rules, assigned plan, and live Redis status for ${user.clientId}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users', href: '/users' },
          { label: user.clientId },
        ]}
      />

      <UserDetailView user={user} />
    </MainLayout>
  );
}
