import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  iconBgColor?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changeType = 'positive',
  icon,
  iconBgColor = 'bg-indigo-50 text-indigo-600 border-indigo-100',
}: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={cn('p-3 rounded-2xl border shrink-0 transition-transform group-hover:scale-110', iconBgColor)}>
          {icon}
        </div>
      </div>

      {(subtitle || change) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {change && (
            <span
              className={cn(
                'font-bold px-2 py-0.5 rounded-md text-[11px]',
                changeType === 'positive'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : changeType === 'negative'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-slate-50 text-slate-700 border border-slate-200'
              )}
            >
              {change}
            </span>
          )}
          {subtitle && <span className="text-slate-400 font-medium truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
