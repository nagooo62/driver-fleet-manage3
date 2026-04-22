import { Activity, Bell, CarFront, Sparkles, TriangleAlert, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { useApplications } from '@/hooks/useApplications';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useExpiringDocuments } from '@/hooks/useDrivers';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDateArabic, formatRelativeTimeArabic, translateNotificationType } from '@/lib/dateUtils';

export default function DashboardPage() {
  const { data: stats, isLoading, refetch } = useDashboardStats();
  const { data: expiringDocuments = [] } = useExpiringDocuments(7);
  const { data: notifications } = useNotifications(1, 5);
  const { data: applications = [] } = useApplications();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="روائس - الحل اللوجستي الذكي"
        title="أداء المناديب اليومي"
        description="لوحة قيادة تشغيلية بزجاجيات هادئة، جاهزة لتتبّع المناديب والسيارات والتنبيهات والتحليلات المستقبلية من نقطة واحدة."
        aside={<div className="glass-pill">عرض تقديمي تفاعلي - روائس</div>}
        actions={<Button variant="outline" onClick={() => refetch()}>تحديث المؤشرات</Button>}
      />

      {isLoading || !stats ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-[28px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="إحصائيات المناديب" value={stats.totalDrivers} subtitle={`${stats.activeDrivers} نشط`} icon={Users} tone="primary" />
          <MetricCard title="إحصائيات السيارات" value={stats.totalCars} subtitle={`${stats.delegatedCars} مفوّضة`} icon={CarFront} tone="accent" />
          <MetricCard title="وثائق منتهية قريباً" value={stats.expiringDocuments} subtitle="إقامة / رخصة / طبي" icon={TriangleAlert} tone="danger" />
          <MetricCard title="تنبيهات فورية" value={stats.realtimeAlerts} subtitle="تنبيهات غير مقروءة" icon={Bell} tone="danger" />
          <MetricCard title="مؤشر الأداء" value={`${stats.performanceScore}%`} subtitle={`استفادة ${stats.utilizationRate}%`} icon={Activity} tone="success" />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="glass-panel table-enter p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-white">الوثائق الأكثر قربًا للانتهاء</h2>
              <p className="mt-1 text-sm text-muted-foreground">تركيز سريع على المستندات الحرجة خلال الأيام السبعة القادمة.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/drivers">فتح المناديب</Link>
            </Button>
          </div>

          <div className="space-y-3">
            {expiringDocuments.slice(0, 6).map((item) => (
              <Link key={`${item.driverId}-${item.document}`} to={`/drivers/${item.driverId}`} className="glass-hover flex items-center justify-between rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{item.driverName}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.document === 'iqama' ? 'إقامة' : item.document === 'license' ? 'رخصة' : 'فحص طبي'} • {formatDateArabic(item.expiresAt)}
                  </div>
                </div>
                <div className="rounded-full px-3 py-1 text-xs font-semibold text-white bg-destructive/15">
                  {item.daysLeft <= 0 ? 'منتهي' : `${item.daysLeft} يوم`}
                </div>
              </Link>
            ))}

            {!expiringDocuments.length ? (
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-center text-sm text-muted-foreground">
                لا توجد وثائق حرجة في نافذة السبعة أيام الحالية.
              </div>
            ) : null}
          </div>
        </section>

        <section className="glass-panel table-enter p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-white">تحديثات فورية للمناديب</h2>
            <p className="mt-1 text-sm text-muted-foreground">آخر الإشعارات التشغيلية الواردة من النظام.</p>
          </div>

          <div className="space-y-3">
            {(notifications?.items ?? []).slice(0, 5).map((notification) => (
              <div key={notification.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-right">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">{translateNotificationType(notification.type)}</span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTimeArabic(notification.created_at)}</span>
                </div>
                <div className="mt-3 text-sm font-semibold text-white">{notification.title}</div>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">{notification.message}</p>
              </div>
            ))}

            {!notifications?.items?.length ? (
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-center text-sm text-muted-foreground">
                لا توجد إشعارات آنية لعرضها الآن.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel table-enter p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-white">مؤشرات الأداء التشغيلي</h2>
            <p className="mt-1 text-sm text-muted-foreground">طبقة تشغيلية جاهزة للربط مع AI analytics وGPS عند توفر الجداول القادمة.</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm text-muted-foreground">جاهزية الذكاء التحليلي</div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-2xl font-semibold text-white">جاهز للبيانات</div>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm text-muted-foreground">مؤشر الأداء اليومي</div>
              <div className="mt-2 text-2xl font-semibold text-white">{stats ? `${stats.performanceScore}` : '—'}</div>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm text-muted-foreground">نسبة الاستفادة التشغيلية</div>
              <div className="mt-2 text-2xl font-semibold text-white">{stats ? `${stats.utilizationRate}%` : '—'}</div>
            </div>
          </div>
        </section>

        <section className="glass-panel table-enter p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-white">تتبع التطبيقات المتعددة</h2>
              <p className="mt-1 text-sm text-muted-foreground">روابط جاهزة لتتبع الأداء عبر التطبيقات النشطة.</p>
            </div>
            <div className="glass-pill">{applications.length} تطبيقات</div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {applications.map((application) => (
              <Link key={application.id} to={`/apps/${application.name}`} className="glass-hover rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-right">
                <div className="text-sm font-semibold text-white">{application.display_name}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {application.is_active ? 'نشط وجاهز للمتابعة' : 'موقوف مؤقتًا'}
                </div>
              </Link>
            ))}

            {!applications.length ? (
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-center text-sm text-muted-foreground md:col-span-2">
                لا توجد تطبيقات مهيأة حاليًا في قاعدة البيانات.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
