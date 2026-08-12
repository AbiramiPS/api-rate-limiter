import React from 'react';

interface LoadingStateProps {
  rows?: number;
  type?: 'table' | 'cards' | 'page';
}

export function LoadingState({ rows = 5, type = 'table' }: LoadingStateProps) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
        ))}
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-12 bg-slate-200/70 rounded-lg w-1/3" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-50 border-b border-slate-200 px-6 flex items-center gap-4">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-200 rounded w-1/4" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-1/6" />
            <div className="h-4 bg-slate-100 rounded w-1/12 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
