import { NavLink } from 'react-router-dom';
import { Grid2x2Plus, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appCatalog, navigationItems } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/rbac';

interface SidebarNavProps {
  open: boolean;
  onClose: () => void;
}

export function SidebarNav({ open, onClose }: SidebarNavProps) {
  const { can } = usePermissions();
  const visibleItems = navigationItems.filter((item) => can(item.permission));

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-4 right-4 z-50 flex w-[18rem] flex-col rounded-[32px] glass-sidebar p-4 transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : 'translate-x-[120%]'
        )}
      >
        <div className="flex items-center justify-between gap-3 rounded-[28px] border border-white/8 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="logo-glow flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/18 text-xl font-display text-primary">
              ر
            </div>
            <div>
              <p className="text-sm font-semibold text-white">روائس - الحل اللوجستي الذكي</p>
              <p className="text-xs text-muted-foreground">منصة تشغيل لوجستي عربية</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 space-y-2 overflow-y-auto pr-1 scrollbar-visible">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'glass-hover flex items-center gap-3 rounded-[24px] border border-transparent px-4 py-3 text-right',
                    isActive ? 'border-white/12 bg-white/10 shadow-panel' : 'bg-white/[0.02]'
                  )
                }
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{item.label}</div>
                  <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
                </div>
              </NavLink>
            );
          })}
        </div>

        <div className="surface-divider mt-5 pt-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Grid2x2Plus className="h-4 w-4 text-primary" />
            <span>التطبيقات</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {appCatalog.map((app) => (
              <NavLink
                key={app.slug}
                to={`/apps/${app.slug}`}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'rounded-[24px] border p-4 text-right transition-all duration-300',
                    'bg-gradient-to-br backdrop-blur-xl',
                    app.accentClass,
                    isActive ? 'border-white/16 bg-white/10 shadow-panel' : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.06]'
                  )
                }
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-xs font-semibold text-white">
                  {app.shortLabel}
                </div>
                <div className="text-sm font-semibold text-white">{app.label}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>tracking ready</span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
