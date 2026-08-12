'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { SettingsForm } from '@/components/settings/SettingsForm';

export default function SettingsPage() {
  return (
    <MainLayout>
      <PageHeader
        title="System Settings"
        description="Configure Spring Boot backend connection endpoints, Redis TTL defaults, and admin preferences."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
      />

      <SettingsForm />
    </MainLayout>
  );
}
