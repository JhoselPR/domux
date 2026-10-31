import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-medium leading-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex w-full gap-2 sm:w-auto sm:justify-end">{actions}</div>}
    </div>
  );
}

interface SectionTitleProps {
  children: ReactNode;
  count?: number;
}

export function SectionTitle({ children, count }: SectionTitleProps) {
  return (
    <h2 className="mb-2 flex items-baseline gap-2 text-sm font-medium text-ink-2">
      {children}
      {count !== undefined && <span className="font-mono text-xs font-normal tabular-nums text-ink-3">{count}</span>}
    </h2>
  );
}
