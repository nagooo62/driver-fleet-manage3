import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  aside,
  className,
}: PageHeaderProps) {
  return (
    <section className={cn('glass-panel section-enter p-6 sm:p-7', className)}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3 min-w-0">
          {eyebrow ? (
            <span className="glass-pill text-xs text-muted-foreground" aria-label={eyebrow}>
              {eyebrow}
            </span>
          ) : null}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 sm:items-center">
          {aside}
          {actions}
        </div>
      </div>
    </section>
  );
}
