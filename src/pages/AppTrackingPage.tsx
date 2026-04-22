import { useState } from 'react';
import { Route, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PaginationControls } from '@/components/layout/PaginationControls';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAppTracking } from '@/hooks/useApplications';

export default function AppTrackingPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAppTracking(slug, page, 12);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Multi-App Tracking"
        title={data?.application ? `متابعة تطبيق ${data.application.display_name}` : 'التطبيق غير موجود'}
        description="رؤية تشغيلية لكل تطبيق: عدد المناديب، التحقق، حجم الطلبات، وأيام العمل مع pagination خادمي."
        aside={<div className="glass-pill">{slug}</div>}
      />

      {data?.application ? (
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Drivers" value={data.summary.totalDrivers} subtitle="إجمالي السجلات" icon={Users} tone="primary" />
          <MetricCard title="Verified" value={data.summary.verifiedDrivers} subtitle="مطابقات موثقة" icon={ShieldCheck} tone="success" />
          <MetricCard title="Orders" value={data.summary.totalOrders} subtitle="إجمالي الطلبات" icon={TrendingUp} tone="accent" />
          <MetricCard title="Days" value={data.summary.totalWorkingDays} subtitle="أيام العمل" icon={Route} tone="primary" />
        </div>
      ) : null}

      <section className="glass-panel p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-right">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-4 py-3">المندوب</th>
                <th className="px-4 py-3">الرقم الوظيفي</th>
                <th className="px-4 py-3">الطلبات</th>
                <th className="px-4 py-3">أيام العمل</th>
                <th className="px-4 py-3">التحقق</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">جارٍ تحميل بيانات التطبيق...</td>
                </tr>
              ) : data?.records.items.length ? (
                data.records.items.map((record) => (
                  <tr key={record.id} className="border-b border-white/6">
                    <td className="px-4 py-4 text-sm font-semibold text-white">{record.driverName}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{record.employee_id ?? '—'}</td>
                    <td className="px-4 py-4 text-sm text-white">{record.orders_count ?? 0}</td>
                    <td className="px-4 py-4 text-sm text-white">{record.working_days ?? 0}</td>
                    <td className="px-4 py-4 text-sm text-white">{record.is_verified ? 'موثّق' : 'قيد المطابقة'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">لا توجد سجلات تشغيلية لهذا التطبيق.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data ? (
          <PaginationControls page={data.records.page} totalPages={data.records.totalPages} total={data.records.total} pageSize={data.records.pageSize} onPageChange={setPage} />
        ) : null}
      </section>
    </div>
  );
}
