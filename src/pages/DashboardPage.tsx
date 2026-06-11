import { Activity, Bell, CarFront, Sparkles, TriangleAlert, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { useApplications } from '@/hooks/useApplications';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useAppDistribution, useDocStatusSummary } from '@/hooks/useDashboardCharts';
import { useExpiringDocuments } from '@/hooks/useDrivers';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDateArabic, formatRelativeTimeArabic, translateNotificationType } from '@/lib/dateUtils';

const DOC_STATUS_COLORS: Record<string, string> = {
  valid: '#10b981',
  expiring_soon: '#f59e0b',
  expired: '#ef4444',
  missing: '#6b7280',
};

const DOC_STATUS_LABELS: Record<string, string> = {
  valid: 'سارية',
  expiring_soon: 'تنتهي قريبًا',
  expired: 'منتهية',
  missing: 'غير مرفوعة',
};

const APP_CARD_STYLE: Record<string, string> = {
  toyou: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  hungerstation: 'border-orange-500/30 bg-orange-500/5 text-orange-400',
  jahez: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
  keeta: 'border-sky-500/30 bg-sky-500/5 text-sky-400',
  chefz: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
};

interface CustomBarTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
}

const CustomBarTooltip = ({ active, payload, label }: CustomBarTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[12px] border border-white/10 bg-slate-900/90 px-3 py-2 text-right text-sm">
      <div className="font-semibold text-white">{label}</div>
      <div className="text-muted-foreground">{payload[0].value} مندوب</div>
    </div>
  );
};

export default function DashboardPage() {
  const { data: stats, isLoading, refetch } = useDashboardStats();
  const { data: expiringDocuments = [] } = useExpiringDocuments(7);
  const { data: notifications } = useNotifications(1, 5);
  const { data: applications = [] } = useApplications();
  const { data: appDist = [] } = useAppDistribution();
  const { data: docStatus } = useDocStatusSummary();

  const docPieData = docStatus
    ? Object.entries(docStatus)
        .map(([key, value]) => ({
          name: DOC_STATUS_LABELS[key] ?? key,
          value,
          color: DOC_STATUS_COLORS[key] ?? '#6b7280',
        }))
        .filter((item) => item.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="روائس - الحل اللوجستي الذكي"
        title="أداء المناديب اليومي"
        description="لوحة قيادة تشغيلية بزجاجيات هادئة، جاهزة لتتبع المناديب والسيارات والتنبيهات والتحليلات المستقبلية من نقطة واحدة."
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
        <div className="stagger-children grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="إجمالي المناديب" value={stats.totalDrivers} subtitle={`${stats.activeDrivers} نشط`} icon={Users} tone="primary" />
          <MetricCard title="إجمالي السيارات" value={stats.totalCars} subtitle={`${stats.delegatedCars} مفوّضة`} icon={CarFront} tone="accent" />
          <MetricCard title="وثائق تنتهي قريبًا" value={stats.expiringDocuments} subtitle="إقامة / رخصة / طبي" icon={TriangleAlert} tone="danger" />
          <MetricCard title="تنبيهات غير مقروءة" value={stats.realtimeAlerts} subtitle="تنبيهات فورية" icon={Bell} tone="danger" />
          <MetricCard title="مؤشر الأداء" value={`${stats.performanceScore}%`} subtitle={`استفادة ${stats.utilizationRate}%`} icon={Activity} tone="success" />
        </div>
      )}

      {/* ─── بطاقات التطبيقات ─── */}
      <div className="stagger-children grid grid-cols-2 gap-4 md:grid-cols-5" role="list" aria-label="عدد المناديب بكل تطبيق">
        {appDist.map((app) => (
          <Link
            key={app.app}
            to={`/drivers?app=${app.app}`}
            role="listitem"
            aria-label={`${app.label}: ${app.count} مندوب`}
            className={`card-premium press-effect rounded-[24px] border p-4 text-right ${APP_CARD_STYLE[app.app] ?? 'border-white/10 bg-white/5 text-white'}`}
          >
            <div className="text-2xl font-bold tabular-nums">{app.count}</div>
            <div className="mt-1 text-sm font-semibold">{app.label}</div>
            <div className="mt-0.5 text-xs opacity-70">مندوب</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-panel p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">توزيع المناديب بالتطبيق</h2>
            <p className="mt-1 text-sm text-muted-foreground">عدد المناديب المسجلين في كل تطبيق توصيل</p>
          </div>

          {appDist.every((a) => a.count === 0) ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              لا توجد بيانات — أضف تطبيقاً للمناديب أولاً
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220} aria-label="مخطط عدد المناديب بكل تطبيق">
              <BarChart data={appDist} margin={{ top: 5, right: 4, left: -10, bottom: 5 }} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  label={{ value: 'مندوب', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, dx: 12 }}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {appDist.map((entry) => (
                    <Cell key={entry.app} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="glass-panel p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">حالة وثائق المناديب</h2>
            <p className="mt-1 text-sm text-muted-foreground">توزيع حالات الوثائق المرفوعة في النظام</p>
          </div>

          {docPieData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={docPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48}>
                  {docPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              لا توجد وثائق مرفوعة بعد
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="glass-panel table-enter p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-white">الوثائق الأقرب للانتهاء</h2>
              <p className="mt-1 text-sm text-muted-foreground">مستندات حرجة خلال السبعة أيام القادمة</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/drivers">كل المناديب</Link>
            </Button>
          </div>

          <div className="space-y-3">
            {expiringDocuments.slice(0, 6).map((item) => (
              <Link
                key={`${item.driverId}-${item.document}`}
                to={`/drivers/${item.driverId}`}
                className="glass-hover flex items-center justify-between rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4"
              >
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{item.driverName}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.document === 'iqama' ? 'إقامة' : item.document === 'license' ? 'رخصة' : 'فحص طبي'}
                    {' • '}
                    {formatDateArabic(item.expiresAt)}
                  </div>
                </div>
                <div className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-semibold text-white">
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
            <h2 className="text-2xl font-semibold text-white">تحديثات فورية</h2>
            <p className="mt-1 text-sm text-muted-foreground">آخر الإشعارات التشغيلية الواردة</p>
          </div>

          <div className="space-y-3">
            {(notifications?.items ?? []).slice(0, 5).map((notification) => (
              <div key={notification.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-right">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">
                    {translateNotificationType(notification.type)}
                  </span>
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
            <h2 className="text-2xl font-semibold text-white">مؤشرات الأداء</h2>
            <p className="mt-1 text-sm text-muted-foreground">مؤشرات تشغيلية للنظام</p>
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
              <h2 className="text-2xl font-semibold text-white">تتبع التطبيقات</h2>
              <p className="mt-1 text-sm text-muted-foreground">روابط لتتبع الأداء عبر التطبيقات النشطة</p>
            </div>
            <div className="glass-pill">{applications.length} تطبيقات</div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {applications.map((application) => (
              <Link
                key={application.id}
                to={`/apps/${application.name}`}
                className="glass-hover rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-right"
              >
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
