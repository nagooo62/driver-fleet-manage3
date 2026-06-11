import { cn } from '@/lib/utils';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { box: 'h-10 w-10', text: 'text-base', name: 'text-sm' },
  md: { box: 'h-12 w-12', text: 'text-lg', name: 'text-base' },
  lg: { box: 'h-20 w-20', text: 'text-3xl', name: 'text-2xl' },
};

/**
 * شعار روائس المتحرك — حلقة مدارية تدور + توهج نابض + اسم متدرج اللون.
 * يتوقف تلقائياً مع prefers-reduced-motion.
 */
export function AnimatedLogo({ size = 'md', showName = false, className }: AnimatedLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('logo-orbit relative shrink-0', s.box)} aria-hidden="true">
        {/* الحلقة المدارية الدوارة */}
        <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full logo-ring">
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(192 83% 60%)" />
              <stop offset="60%" stopColor="hsl(192 83% 60% / 0.1)" />
              <stop offset="100%" stopColor="hsl(38 89% 63%)" />
            </linearGradient>
          </defs>
          <circle
            cx="24" cy="24" r="21"
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="80 52"
          />
        </svg>

        {/* الجسم الزجاجي بالحرف */}
        <div className={cn(
          'absolute inset-[5px] flex items-center justify-center rounded-full',
          'bg-primary/15 backdrop-blur-sm logo-core font-display text-primary',
          s.text,
        )}>
          ر
        </div>
      </div>

      {showName && (
        <div className="text-right">
          <div className={cn('text-gradient font-display font-bold leading-tight', s.name)}>
            روائس اللوجستية
          </div>
          <div className="text-[11px] text-muted-foreground">الحل اللوجستي الذكي</div>
        </div>
      )}
    </div>
  );
}
