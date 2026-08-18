'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlanResponse, Page } from '@/types/api';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { useToast } from '../providers/ToastProvider';
import { UserPlanService, ApiError } from '@/services/userPlanService';
import { Eye, Edit3, Trash2, Shield, Plus, SlidersHorizontal, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface UserTableProps {
  initialUsers?: UserPlanResponse[];
}

export function UserTable({ initialUsers }: UserTableProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserPlanResponse[]>(initialUsers || []);
  const [loading, setLoading] = useState<boolean>(!initialUsers);
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('ALL');
  const [ruleTypeFilter, setRuleTypeFilter] = useState<string>('ALL');
  const [userToDelete, setUserToDelete] = useState<UserPlanResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });

  const fetchUsers = useCallback(async (page: number = 0, search?: string) => {
    try {
      setError(null);
      if (search) {
        setSearching(true);
        const data: Page<UserPlanResponse> = await UserPlanService.searchUsers(search, page, pagination.size);
        setUsers(data.content);
        setPagination({
          page: data.number,
          size: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages,
        });
      } else {
        setLoading(true);
        const data: Page<UserPlanResponse> = await UserPlanService.getAllUsers(page, pagination.size);
        setUsers(data.content);
        setPagination({
          page: data.number,
          size: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages,
        });
      }
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Failed to load users');
      handleApiError(apiError, 'Failed to load users');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [pagination.size]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users when debounced search changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      fetchUsers(0, debouncedSearchQuery);
    } else if (searchQuery === '') {
      fetchUsers(0);
    }
  }, [debouncedSearchQuery, fetchUsers]);

  useEffect(() => {
    if (!initialUsers) {
      fetchUsers(0);
    }
  }, [initialUsers, fetchUsers]);

  const refreshData = () => {
    fetchUsers(pagination.page, searchQuery);
  };

  const handleApiError = (error: ApiError, defaultMessage: string) => {
    let message = defaultMessage;
    if (error.status === 400) {
      message = 'Invalid request. Please check your input.';
    } else if (error.status === 404) {
      message = 'Resource not found.';
    } else if (error.status === 409) {
      message = 'Resource already exists.';
    } else if (error.status === 429) {
      message = 'Too many requests. Please try again later.';
    } else if (error.status === 500) {
      message = 'Server error. Please try again later.';
    } else if (error.status === 503) {
      message = 'Service unavailable. Please try again later.';
    } else if (error.message) {
      message = error.message;
    }
    toast('Error', message, 'error');
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

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await UserPlanService.deleteUser(userToDelete.clientId);
      toast('Client Deleted', `Removed client '${userToDelete.clientName}' (${userToDelete.clientId})`, 'success');
      setUserToDelete(null);
      refreshData();
    } catch (error) {
      const apiError = error as ApiError;
      handleApiError(apiError, 'Failed to delete client');
    }
  };

  const columns: Column<UserPlanResponse>[] = [
    {
      header: 'Client ID & Name',
      accessorKey: 'clientName',
      cell: (user: UserPlanResponse) => (
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
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Plan',
      accessorKey: 'planName',
      cell: (user: UserPlanResponse) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{user.planName}</span>
          <span className="text-[11px] text-slate-400">Default rate plan</span>
        </div>
      ),
    },
    {
      header: 'Custom Rule',
      accessorKey: 'customRuleEnabled',
      cell: (user: UserPlanResponse) => {
        const enabled = user.planName === 'ENTERPRISE' && user.customRuleEnabled;
        return <StatusBadge type="custom_rule" value={enabled} />;
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (user: UserPlanResponse) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/users/${user.clientId}`}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="View details"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/users/${user.clientId}/edit`}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit user"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit3 className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setUserToDelete(user);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete user"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Get unique plan names from current data for filter
  const uniquePlans = React.useMemo(() => {
    const plans = new Set(users.map((u) => u.planName));
    return Array.from(plans);
  }, [users]);

  const filterComponent = (
    <div className="flex items-center gap-2 w-full flex-wrap sm:flex-nowrap">
      {/* Plan filter */}
      <select
        value={selectedPlanFilter}
        onChange={(e) => setSelectedPlanFilter(e.target.value)}
        className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 text-slate-700 font-medium"
      >
        <option value="ALL">All Plans</option>
        {uniquePlans.map((plan) => (
          <option key={plan} value={plan}>
            {plan}
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

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchUsers(newPage, searchQuery);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search users by client name..."
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all placeholder:text-slate-400"
            />
            {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">Searching...</span>}
          </div>
          {filterComponent}
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading clients...</div>
        ) : error ? (
          <div className="p-6">
            <ErrorState title="Unable to load clients" description={error} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No Clients Found" description="No clients match your filter criteria. Click below to add a client." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold tracking-wide uppercase text-[11px]">
                    {columns.map((col, idx) => (
                      <th key={idx} className={cn('px-6 py-3.5', col.className)}>
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((user, rowIdx) => (
                    <tr
                      key={user.id || rowIdx}
                      onClick={() => router.push(`/users/${user.clientId}`)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      {columns.map((col, colIdx) => (
                        <td key={colIdx} className={cn('px-6 py-4 font-normal', col.className)}>
                          {col.cell ? col.cell(user) : col.accessorKey ? String(user[col.accessorKey as keyof UserPlanResponse] ?? '') : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Server-side Pagination */}
            <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-800">{pagination.page * pagination.size + 1}</span> to{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)}
                </span>{' '}
                of <span className="font-semibold text-slate-800">{pagination.totalElements}</span> results
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 0}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium text-slate-700">
                  Page {pagination.page + 1} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages - 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Client"
        description={`This will permanently remove this client and its configuration. Are you sure you want to delete '${userToDelete?.clientName}' (${userToDelete?.clientId})?`}
        confirmText="Delete Client"
        variant="danger"
      />
    </>
  );
}
