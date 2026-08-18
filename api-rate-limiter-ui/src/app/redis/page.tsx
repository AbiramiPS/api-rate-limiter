'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { RedisStatusCard } from '@/components/redis/RedisStatusCard';
import { RedisKeyTable } from '@/components/redis/RedisKeyTable';
import { SimulatorWidget } from '@/components/dashboard/SimulatorWidget';
import { RateLimiterStore } from '@/lib/services/store';
import { RedisStats } from '@/types';

export default function RedisPage() {
  const [stats, setStats] = useState<RedisStats>(RateLimiterStore.getRedisStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(RateLimiterStore.getRedisStats());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MainLayout>
      <PageHeader
        title="Redis Key Store & Live Monitor"
        description="Inspect rate limit counter keys (rate_limit:*), cached rule JSONs (rate_rule:*), and simulate incoming traffic. Note: This page uses simulated data for demonstration."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Redis Monitor' }]}
      />

      <div className="space-y-8">
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> Redis monitoring uses simulated data for demonstration. Backend endpoints for real-time Redis monitoring are limited. Use the backend logs and Redis CLI for actual monitoring.
          </p>
        </div>

        <RedisStatusCard stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RedisKeyTable />
          </div>
          <div>
            <SimulatorWidget />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
