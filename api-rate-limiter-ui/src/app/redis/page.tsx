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
        description="Inspect rate limit counter keys (rate_limit:*), cached rule JSONs (rate_rule:*), and simulate incoming traffic."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Redis Monitor' }]}
      />

      <div className="space-y-8">
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
