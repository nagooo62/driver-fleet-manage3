import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  tone?: 'primary' | 'accent' | 'success' | 'danger';
}

const toneClasses: Record<NonNullable<MetricCardProps['tone']>, string> = {
  primary: 'bg-primary/15 text-primary',
  accent: 'bg-accent/15 text-accent',
  success: 'bg-status-ok/15 text-status-ok',
  danger: 'bg-destructive/15 text-destructive',
};

export function MetricCard({ title, value, subtitle, icon: Icon, tone = 'primary' }: MetricCardProps) {
  return (
    <article
      className="glass-panel section-enter p-5"
      aria-label={`${title}: ${value} — ${subtitle}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 min-w-0">
          <p className="text-xs font-medium text-muted-foreground leading-none">{title}</p>
          <div className="space-y-1">
            <h3 className="text-3xl font-semibold text-white tabular-nums">{value}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div
          className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', toneClasses[tone])}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}
