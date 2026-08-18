'use client';

import React from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { UserTable } from '@/components/users/UserTable';
import { Plus } from 'lucide-react';

export default function UsersPage() {
  return (
    <MainLayout>
      <PageHeader
        title="Client Users Management"
        description="Manage API client users, assigned rate plans, and custom rule overrides."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Users' }]}
        actions={
          <Link
            href="/users/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Client
          </Link>
        }
      />

      <UserTable />
    </MainLayout>
  );
}
