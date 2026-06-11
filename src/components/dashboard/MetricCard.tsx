import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

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

const toneGlow: Record<NonNullable<MetricCardProps['tone']>, string> = {
  primary: 'group-hover:shadow-[0_0_24px_hsl(192_83%_60%/0.25)]',
  accent: 'group-hover:shadow-[0_0_24px_hsl(38_89%_63%/0.25)]',
  success: 'group-hover:shadow-[0_0_24px_hsl(155_66%_47%/0.25)]',
  danger: 'group-hover:shadow-[0_0_24px_hsl(0_82%_63%/0.25)]',
};

/** يحلل القيمة: رقم خام أو نص مثل "72%" — يستخرج الرقم واللاحقة */
function parseValue(value: string | number): { num: number; suffix: string } {
  if (typeof value === 'number') return { num: value, suffix: '' };
  const match = value.match(/^(\d+)(.*)$/);
  if (match) return { num: parseInt(match[1], 10), suffix: match[2] };
  return { num: 0, suffix: value };
}

export function MetricCard({ title, value, subtitle, icon: Icon, tone = 'primary' }: MetricCardProps) {
  const { num, suffix } = parseValue(value);
  const animated = useCountUp(num);
  const display = typeof value === 'number' || /^\d/.test(String(value))
    ? `${animated}${suffix}`
    : value;

  return (
    <article
      className="card-premium glass-panel group p-5"
      aria-label={`${title}: ${value} — ${subtitle}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 min-w-0">
          <p className="text-xs font-medium text-muted-foreground leading-none">{title}</p>
          <div className="space-y-1">
            <h3 className="text-3xl font-semibold text-white tabular-nums">{display}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-shadow duration-300',
            toneClasses[tone],
            toneGlow[tone],
          )}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}
