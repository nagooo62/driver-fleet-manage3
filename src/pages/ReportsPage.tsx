import { Bot, Download, Radar, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { printToPDF } from '@/lib/pdfExport';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { useDashboardStats } from '@/hooks/useDashboard';
import type { AiInsightBlueprint, FinanceComparisonSource } from '@/types';

const aiBlueprints: AiInsightBlueprint[] = [
  {
    modelKey: 'performance_prediction',
    title: 'توقع الأداء',
    description: 'توقع الأداء اليومي للمندوب بناءً على الطلبات وأيام العمل والالتزام الزمني.',
    readiness: 'ready_for_data',
  },
  {
    modelKey: 'risk_scoring',
    title: 'تقدير المخاطر',
    description: 'تقدير مخاطر التعطل، التأخر، أو التدهور التشغيلي قبل حدوثه.',
    readiness: 'planned',
  },
  {
    modelKey: 'fuel_analytics',
    title: 'تحليلات الوقود',
    description: 'طبقة جاهزة لربط استهلاك الوقود بمسارات GPS وسلوك التفويض.',
    readiness: 'requires_schema',
  },
  {
    modelKey: 'anomaly_detection',
    title: 'كشف الانحرافات',
    description: 'كشف الانحرافات في الحركة أو الأداء أو أوامر التطبيقات متعددة القنوات.',
    readiness: 'ready_for_data',
  },
];

const financeSources: FinanceComparisonSource[] = [
  { id: 'platform', source: 'platform', reference: 'تقارير المنصة', amount: 0, orders: 0, periodLabel: 'جاهز للربط' },
  { id: 'internal', source: 'internal', reference: 'السجلات الداخلية', amount: 0, orders: 0, periodLabel: 'جاهز للربط' },
  { id: 'driver', source: 'driver', reference: 'سجلات المناديب', amount: 0, orders: 0, periodLabel: 'جاهز للربط' },
];

export default function ReportsPage() {
  const { data: stats } = useDashboardStats();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="عرض تقديمي تفاعلي - روائس"
        title="المركز التحليلي"
        description="طبقة عرض استراتيجية لربط dashboard analytics، GPS architecture، AI analytics، ومطابقة المصادر المالية داخل مسار واحد قابل للتوسعة."
        actions={
          <Button variant="outline" onClick={() => printToPDF('التقارير - روائس اللوجستي')} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير PDF
          </Button>
        }
      />

      {stats ? (
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="إجمالي المناديب" value={stats.totalDrivers} subtitle="مندوب مسجل" icon={ShieldCheck} tone="primary" />
          <MetricCard title="تنبيهات تشغيلية" value={stats.realtimeAlerts} subtitle="غير مقروءة" icon={Radar} tone="danger" />
          <MetricCard title="جاهزية الذكاء الاصطناعي" value={2} subtitle="قدرات جاهزة للبيانات" icon={Bot} tone="accent" />
          <MetricCard title="مصادر مالية" value={3} subtitle="مصادر للمقارنة" icon={Wallet} tone="success" />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-panel p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-white">بنية التحليلات الذكية</h2>
            <p className="mt-1 text-sm text-muted-foreground">قدرات جاهزة للتفعيل فور ربط مصادر البيانات المساندة.</p>
          </div>
          <div className="space-y-3">
            {aiBlueprints.map((item) => (
              <div key={item.modelKey} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-right">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">{item.title}</span>
                  <span className="glass-pill text-[11px]">{item.readiness}</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-white">بنية نظام تتبع GPS</h2>
            <p className="mt-1 text-sm text-muted-foreground">المنصة مجهزة لإضافة طبقة تتبع رحلات وقياس مسافات واكتشاف الاستخدام غير المصرح به.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'نموذج رحلات GPS',
              'تجميع المسافات',
              'سجل تاريخ المسارات',
              'تنبيهات الاستخدام غير المصرح',
              'تحليلات حركة المناديب',
              'سياسات السياج الجغرافي',
            ].map((item) => (
              <div key={item} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm text-white">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="glass-panel p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-white">تصميم التسوية المالية</h2>
          <p className="mt-1 text-sm text-muted-foreground">مقارنة ثلاثية بين تقارير المنصة والسجلات الداخلية وسجلات السائقين لكشف الفروقات قبل التسوية.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {financeSources.map((source) => (
            <div key={source.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-right">
              <div className="text-sm font-semibold text-white">{source.reference}</div>
              <div className="mt-2 text-xs text-muted-foreground">{source.periodLabel}</div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                مصدر مقارن جاهز للربط. ستتم عليه خطوات normalization ثم difference detection ثم handoff للمراجعة المالية.
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
