import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while fetching information from the system.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 rounded-2xl border border-rose-200">
      <div className="p-3 bg-rose-100 text-rose-600 rounded-full mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-950">{title}</h3>
      <p className="mt-1 text-sm text-rose-700/90 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-900 bg-white border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}
