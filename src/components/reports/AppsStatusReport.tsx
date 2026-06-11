import { useMemo } from 'react';
import { AlertTriangle, Archive as ArchiveIcon, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDrivers } from '@/hooks/useDrivers';
import { listReports } from '@/lib/reportsArchive';
import type { Driver } from '@/types';

/**
 * تقرير حالة التطبيقات:
 * لكل تطبيق — عدد الشغالين فعلياً / المتعطلين / الانتظار / الأرشيف،
 * وتنبيهات: يوزر فعال باسم شخص (مالك) لكن بدون طلبات في آخر تقرير محفوظ.
 */

const APPS: Array<{ key: string; label: string; cls: string; ring: string }> = [
  { key: 'toyou',         label: 'ToYou',     cls: 'text-amber-400',   ring: 'border-amber-500/25' },
  { key: 'hungerstation', label: 'هنقرستيشن', cls: 'text-orange-400',  ring: 'border-orange-500/25' },
  { key: 'jahez',         label: 'جاهز',       cls: 'text-emerald-400', ring: 'border-emerald-500/25' },
  { key: 'chefz',         label: 'The Chefz', cls: 'text-purple-400',  ring: 'border-purple-500/25' },
];

interface AppAlert {
  driver: Driver;
  reason: string;
}

export function AppsStatusReport() {
  // كل المناديب (بما فيهم الأرشيف) — صفحة واحدة كبيرة
  const { data } = useDrivers({ page: 1, pageSize: 1000, search: '', status: 'all' });
  const drivers = useMemo(() => data?.items ?? [], [data?.items]);

  const report = useMemo(() => {
    const savedReports = listReports();

    return APPS.map((app) => {
      const appDrivers = drivers.filter((d) => d.app_name === app.key);
      const working  = appDrivers.filter((d) => d.status === 'sponsored' || d.status === 'accepted');
      const waiting  = appDrivers.filter((d) => d.status === 'new');
      const disabled = appDrivers.filter((d) => d.status === 'stopped' || d.status === 'frozen');
      const archived = appDrivers.filter((d) => d.status === 'archived');

      // آخر تقرير محفوظ لهذا التطبيق — لكشف اليوزرات الفعالة بدون طلبات
      const latestReport = savedReports.find((r) => r.app === app.key);
      const alerts: AppAlert[] = [];
      if (latestReport) {
        const ordersById = new Map(latestReport.rows.map((row) => [row.repId, row.orders]));
        for (const d of working) {
          if (!d.app_id) continue;
          const orders = ordersById.get(d.app_id);
          const hasPersonOwner = d.manager && d.manager !== 'روائس';
          if (orders === undefined || orders === 0) {
            alerts.push({
              driver: d,
              reason: orders === 0
                ? `يوزر فعال${hasPersonOwner ? ` باسم ${d.manager}` : ''} — صفر طلبات في تقرير ${latestReport.reportDate}`
                : `يوزر فعال${hasPersonOwner ? ` باسم ${d.manager}` : ''} — لم يظهر في تقرير ${latestReport.reportDate}`,
            });
          }
        }
      }

      return { app, working, waiting, disabled, archived, alerts, latestReport };
    });
  }, [drivers]);

  return (
    <section className="glass-panel space-y-5 p-6">
      <div>
        <h2 className="text-xl font-semibold text-white">تقرير حالة التطبيقات</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          أعداد المناديب من دليل التشغيل — التنبيهات تُحسب بمطابقة آخر تقرير أداء محفوظ لكل تطبيق
        </p>
      </div>

      {/* بطاقات الأعداد لكل تطبيق */}
      <div className="stagger-children grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {report.map(({ app, working, waiting, disabled, archived }) => (
          <div key={app.key} className={cn('card-premium rounded-[20px] border bg-white/[0.03] p-4', app.ring)}>
            <div className={cn('mb-3 text-sm font-bold', app.cls)}>{app.label}</div>
            <div className="grid grid-cols-2 gap-2 text-right">
              <div className="rounded-[12px] bg-white/[0.04] p-2.5">
                <div className="flex items-center justify-between">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="text-lg font-bold text-white tabular-nums">{working.length}</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">شغالين فعلياً</div>
              </div>
              <div className="rounded-[12px] bg-white/[0.04] p-2.5">
                <div className="flex items-center justify-between">
                  <Clock className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                  <span className="text-lg font-bold text-white tabular-nums">{waiting.length}</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">انتظار</div>
              </div>
              <div className="rounded-[12px] bg-white/[0.04] p-2.5">
                <div className="flex items-center justify-between">
                  <XCircle className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
                  <span className="text-lg font-bold text-white tabular-nums">{disabled.length}</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">يوزرات متعطلة</div>
              </div>
              <div className="rounded-[12px] bg-white/[0.04] p-2.5">
                <div className="flex items-center justify-between">
                  <ArchiveIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span className="text-lg font-bold text-white tabular-nums">{archived.length}</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">أرشيف</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* التنبيهات: يوزر فعال بدون طلبات */}
      {report.some((r) => r.alerts.length > 0) ? (
        <div className="rounded-[20px] border border-red-500/20 bg-red-500/[0.04] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-red-300">
            <AlertTriangle className="h-4 w-4" />
            تنبيهات: يوزرات فعالة بدون طلبات
          </h3>
          <div className="space-y-2">
            {report.flatMap(({ app, alerts }) =>
              alerts.map(({ driver, reason }) => (
                <div key={driver.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2.5">
                  <div className="text-right">
                    <span className="text-sm font-semibold text-white">{driver.full_name}</span>
                    {driver.app_id && <span className="mr-2 text-xs text-muted-foreground tabular-nums" dir="ltr">#{driver.app_id}</span>}
                    <div className="mt-0.5 text-xs text-red-300/90">{reason}</div>
                  </div>
                  <span className={cn('rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-bold', APPS.find((a) => a.key === app.key)?.cls)}>
                    {app.label}
                  </span>
                </div>
              )),
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-[16px] border border-white/8 bg-white/[0.02] px-4 py-3 text-xs text-muted-foreground">
          💡 التنبيهات تظهر هنا بعد حفظ تقرير أداء بالأرشيف — يُقارن كل يوزر فعال بطلباته في آخر تقرير،
          ومن كان فعالاً باسم شخص لكن بدون طلبات يُكتب فيه تنبيه وملاحظة
        </p>
      )}
    </section>
  );
}
