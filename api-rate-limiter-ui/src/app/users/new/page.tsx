'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { UserForm } from '@/components/users/UserForm';

export default function NewUserPage() {
  return (
    <MainLayout>
      <PageHeader
        title="Register New API Client User"
        description="Add a new client ID and assign an initial rate plan or enterprise custom rule."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users', href: '/users' },
          { label: 'New Client' },
        ]}
      />

      <UserForm />
    </MainLayout>
  );
}
