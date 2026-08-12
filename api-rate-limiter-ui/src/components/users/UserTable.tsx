'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { DataTable, Column } from '../ui/DataTable';
import { StatusBadge } from '../ui/StatusBadge';
import { RateLimiterStore } from '@/lib/services/store';
import { formatRuleSpec } from '@/lib/utils';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../providers/ToastProvider';
import { Eye, Edit3, Trash2, Zap, Shield, Plus, SlidersHorizontal } from 'lucide-react';

interface UserTableProps {
  initialUsers?: User[];
}

export function UserTable({ initialUsers }: UserTableProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>(initialUsers || RateLimiterStore.getUsers());
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('ALL');
  const [ruleTypeFilter, setRuleTypeFilter] = useState<string>('ALL');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const refreshData = () => {
    setUsers(RateLimiterStore.getUsers());
  };

  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      if (selectedPlanFilter !== 'ALL' && user.planName !== selectedPlanFilter) {
        return false;
      }
      if (ruleTypeFilter === 'CUSTOM' && !user.customRuleEnabled) {
        return false;
      }
      if (ruleTypeFilter === 'PLAN' && user.customRuleEnabled) {
        return false;
      }
      return true;
    });
  }, [users, selectedPlanFilter, ruleTypeFilter]);

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;
    try {
      RateLimiterStore.deleteUser(userToDelete.clientId);
      toast('User Deleted', `Removed client '${userToDelete.clientName}' (${userToDelete.clientId})`, 'success');
      setUserToDelete(null);
      refreshData();
    } catch (err: any) {
      toast('Failed to Delete User', err.message || 'Error occurred', 'error');
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'Client ID & Name',
      accessorKey: 'clientName',
      cell: (user) => {
        const resolved = RateLimiterStore.resolveRuleForClient(user.clientId);
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800 shrink-0">
              {user.clientId.slice(-3)}
            </div>
            <div>
              <Link
                href={`/users/${user.clientId}`}
                className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block text-sm"
              >
                {user.clientName}
              </Link>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  {user.clientId}
                </span>
                <span>&bull;</span>
                <span className="truncate max-w-[140px]">{user.email}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Assigned Plan',
      accessorKey: 'planName',
      cell: (user) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{user.planName}</span>
          <span className="text-[11px] text-slate-400">Default rate plan</span>
        </div>
      ),
    },
    {
      header: 'Rule Mode',
      accessorKey: 'customRuleEnabled',
      cell: (user) => <StatusBadge type="custom_rule" value={user.customRuleEnabled} />,
    },
    {
      header: 'Effective Limit',
      cell: (user) => {
        const resolved = RateLimiterStore.resolveRuleForClient(user.clientId);
        return (
          <div>
            <span className="font-mono font-bold text-slate-900 text-xs block">
              {formatRuleSpec(resolved.maxRequests, resolved.windowValue, resolved.windowUnit)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Source: {resolved.source === 'CUSTOM_RULE' ? 'Custom Override' : 'Plan Rule'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (user) => <StatusBadge type="status" value={user.status} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (user) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/users/${user.clientId}`}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/custom-rules/${user.clientId}`}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Configure Custom Rule"
          >
            <Zap className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setUserToDelete(user)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete user"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const plans = RateLimiterStore.getPlans();

  const filterComponent = (
    <div className="flex items-center gap-2 w-full flex-wrap sm:flex-nowrap">
      {/* Plan filter */}
      <select
        value={selectedPlanFilter}
        onChange={(e) => setSelectedPlanFilter(e.target.value)}
        className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 text-slate-700 font-medium"
      >
        <option value="ALL">All Plans</option>
        {plans.map((p) => (
          <option key={p.id} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Rule Type Filter */}
      <select
        value={ruleTypeFilter}
        onChange={(e) => setRuleTypeFilter(e.target.value)}
        className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 text-slate-700 font-medium"
      >
        <option value="ALL">All Rule Types</option>
        <option value="CUSTOM">Custom Rules Only</option>
        <option value="PLAN">Plan Rules Only</option>
      </select>
    </div>
  );

  return (
    <>
      <DataTable
        data={filteredUsers}
        columns={columns}
        searchKey="clientName"
        searchPlaceholder="Search users by Client ID, Name or Email..."
        filterComponent={filterComponent}
        emptyTitle="No Clients Found"
        emptyDescription="No clients match your filter criteria. Click below to add a client."
        onRowClick={(u) => router.push(`/users/${u.clientId}`)}
      />

      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Client User"
        description={`Are you sure you want to delete client '${userToDelete?.clientName}' (${userToDelete?.clientId})? This will permanently erase their custom rate rules and flush active Redis counters.`}
        confirmText="Delete Client"
        variant="danger"
      />
    </>
  );
}
