import React from 'react';
import { cn } from '@/lib/utils';
import { ShieldAlert, ShieldCheck, Zap, Server, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface StatusBadgeProps {
  type: 'status' | 'custom_rule' | 'redis_status' | 'rule_source' | 'plan';
  value: string | boolean;
  className?: string;
}

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  if (type === 'custom_rule') {
    const enabled = Boolean(value);
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors',
          enabled
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-slate-50 text-slate-600 border-slate-200',
          className
        )}
      >
        {enabled ? <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" /> : <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        {enabled ? 'Custom Rule Active' : 'Default Plan Rule'}
      </span>
    );
  }

  if (type === 'status') {
    const val = String(value).toUpperCase();
    const styleMap: Record<string, string> = {
      ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      SUSPENDED: 'bg-rose-50 text-rose-800 border-rose-200',
      INACTIVE: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
          styleMap[val] || 'bg-slate-50 text-slate-600 border-slate-200',
          className
        )}
      >
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            val === 'ACTIVE' ? 'bg-emerald-500' : val === 'SUSPENDED' ? 'bg-rose-500' : 'bg-slate-400'
          )}
        />
        {val}
      </span>
    );
  }

  if (type === 'redis_status') {
    const val = String(value).toUpperCase();
    const styleMap: Record<string, { cls: string; icon: React.ReactNode }> = {
      ALLOWED: {
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      },
      WARNING: {
        cls: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
      },
      THROTTLED: {
        cls: 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse',
        icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />,
      },
    };

    const item = styleMap[val] || { cls: 'bg-slate-50 text-slate-600 border-slate-200', icon: null };

    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', item.cls, className)}>
        {item.icon}
        {val}
      </span>
    );
  }

  if (type === 'rule_source') {
    const isCustom = String(value) === 'CUSTOM_RULE';
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border',
          isCustom
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-indigo-50 text-indigo-800 border-indigo-200',
          className
        )}
      >
        {isCustom ? <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> : <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
        {isCustom ? 'User Custom Rule' : 'Rate Plan Rule'}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200', className)}>
      {String(value)}
    </span>
  );
}
