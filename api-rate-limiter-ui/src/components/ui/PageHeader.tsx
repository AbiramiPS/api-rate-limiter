import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-slate-500 mb-2">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                {b.href ? (
                  <Link href={b.href} className="hover:text-slate-900 transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-700">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>

      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
