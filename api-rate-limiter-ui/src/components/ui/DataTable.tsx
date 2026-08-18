'use client';

import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: keyof T;
  searchPlaceholder?: string;
  filterComponent?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  keyExtractor?: (item: T, index: number) => string | number;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Search records...',
  filterComponent,
  emptyTitle,
  emptyDescription,
  pageSize = 8,
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Search filtering
  const filteredData = React.useMemo(() => {
    if (!searchTerm || !searchKey) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((item) => {
      const val = item[searchKey];
      return val ? String(val).toLowerCase().includes(lower) : false;
    });
  }, [data, searchTerm, searchKey]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const getItemKey = (item: T, idx: number): string | number => {
    if (keyExtractor) return keyExtractor(item, idx);
    if (item.id !== undefined) return String(item.id);
    if (item.key !== undefined) return String(item.key);
    return idx;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {(searchKey || filterComponent) && (
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50">
          {searchKey ? (
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          ) : (
            <div />
          )}

          {filterComponent && <div className="flex items-center gap-2 w-full sm:w-auto">{filterComponent}</div>}
        </div>
      )}

      {filteredData.length === 0 ? (
        <div className="p-6">
          <EmptyState title={emptyTitle} description={emptyDescription} />
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
                {paginatedData.map((item, rowIdx) => {
                  const rowKey = getItemKey(item, rowIdx);
                  return (
                    <tr
                      key={rowKey}
                      onClick={() => onRowClick?.(item)}
                      className={cn(
                        'hover:bg-slate-50/70 transition-colors',
                        onRowClick ? 'cursor-pointer' : ''
                      )}
                    >
                      {columns.map((col, colIdx) => (
                        <td key={colIdx} className={cn('px-6 py-4 font-normal', col.className)}>
                          {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey] ?? '') : ''}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{filteredData.length === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(startIndex + pageSize, filteredData.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{filteredData.length}</span> results
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-slate-700">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
