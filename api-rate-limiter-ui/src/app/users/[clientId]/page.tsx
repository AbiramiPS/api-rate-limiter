'use client';

import React, { use } from 'react';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { UserDetailView } from '@/components/users/UserDetailView';
import { RateLimiterStore } from '@/lib/services/store';
import { ErrorState } from '@/components/ui/ErrorState';

export default function UserDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const user = RateLimiterStore.getUserByClientId(clientId);

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
