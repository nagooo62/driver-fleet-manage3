import { useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileText, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PageHeader } from '@/components/layout/PageHeader';
import type { FinanceReconciliationRow } from '@/types';

const reconciliationData: FinanceReconciliationRow[] = [
  { reference: 'جاهز - أبريل 2026', platformAmount: 18500, internalAmount: 18200, driverAmount: 18350, delta: 300, status: 'warning' },
  { reference: 'توياو - أبريل 2026', platformAmount: 12300, internalAmount: 12300, driverAmount: 12250, delta: 50, status: 'matched' },
  { reference: 'كيتا - أبريل 2026', platformAmount: 9800, internalAmount: 8900, driverAmount: 9200, delta: 900, status: 'critical' },
  { reference: 'هنقرستيشن - أبريل 2026', platformAmount: 22100, internalAmount: 22000, driverAmount: 22050, delta: 100, status: 'matched' },
  { reference: 'جاهز - مارس 2026', platformAmount: 17200, internalAmount: 17100, driverAmount: 17150, delta: 100, status: 'matched' },
];

const monthlyTrend = [
  { month: 'يناير', platform: 55000, internal: 54200, driver: 54600 },
  { month: 'فبراير', platform: 62000, internal: 61500, driver: 61800 },
  { month: 'مارس', platform: 58000, internal: 57900, driver: 57950 },
  { month: 'أبريل', platform: 62700, internal: 61400, driver: 61850 },
];

const pieData = [
  { name: 'متطابق', value: 3, color: '#22d3ee' },
  { name: 'تحذير', value: 1, color: '#f59e0b' },
  { name: 'حرج', value: 1, color: '#ef4444' },
];

const statusStyle: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  matched:  { label: 'متطابق', cls: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  warning:  { label: 'تحذير', cls: 'bg-amber-500/15 text-amber-400', icon: AlertCircle },
  critical: { label: 'حرج', cls: 'bg-red-500/15 text-red-400', icon: AlertCircle },
};

const totalPlatform = reconciliationData.reduce((s, r) => s + r.platformAmount, 0);
const totalInternal = reconciliationData.reduce((s, r) => s + r.internalAmount, 0);
const totalDelta = reconciliationData.reduce((s, r) => s + r.delta, 0);
const criticalCount = reconciliationData.filter((r) => r.status === 'critical').length;

function formatSAR(n: number) {
  return n.toLocaleString('ar-SA') + ' ر.س';
}

export default function FinancePage() {
  const [activeRow, setActiveRow] = useState<string | null>(null);

  const handleExport = () => {
    const rows = ['المرجع,المنصة,الداخلي,المندوب,الفرق,الحالة', ...reconciliationData.map((r) =>
      `"${r.reference}",${r.platformAmount},${r.internalAmount},${r.driverAmount},${r.delta},${r.status}`)].join('\n');
    const blob = new Blob(['\uFEFF' + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'تسوية-مالية.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="روائس - المركز المالي"
        title="التسوية المالية"
        description="مقارنة ثلاثية بين تقارير المنصة والسجلات الداخلية وسجلات المناديب لكشف الفروقات قبل التسوية النهائية."
        actions={
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير CSV
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="إجمالي المنصة" value={formatSAR(totalPlatform)} subtitle="هذا الشهر" icon={Wallet} tone="primary" />
        <MetricCard title="السجلات الداخلية" value={formatSAR(totalInternal)} subtitle="هذا الشهر" icon={FileText} tone="accent" />
        <MetricCard title="إجمالي الفروقات" value={formatSAR(totalDelta)} subtitle="يحتاج مراجعة" icon={TrendingDown} tone="danger" />
        <MetricCard title="سجلات حرجة" value={criticalCount} subtitle="فرق مرتفع" icon={AlertCircle} tone="danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.4fr]">
        {/* Monthly trend chart */}
        <section className="glass-panel p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">الاتجاه الشهري للمصادر الثلاثة</h2>
            <p className="mt-1 text-sm text-muted-foreground">مقارنة المنصة والسجل الداخلي وسجل المناديب شهرياً</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v / 1000) + 'k'} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9' }}
                formatter={(v: number) => [formatSAR(v), '']}
              />
              <Bar dataKey="platform" name="المنصة" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="internal" name="الداخلي" fill="#22d3ee" radius={[6, 6, 0, 0]} opacity={0.8} />
              <Bar dataKey="driver" name="المناديب" fill="#10b981" radius={[6, 6, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Pie chart */}
        <section className="glass-panel p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">توزيع السجلات</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={4}>
                {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9' }} />
              <Legend formatter={(val) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{val}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Reconciliation table */}
      <section className="glass-panel p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-white">جدول المطابقة التفصيلي</h2>
          <p className="mt-1 text-sm text-muted-foreground">اضغط على أي سجل لعرض تفاصيل الفروقات</p>
        </div>

        <div className="space-y-3">
          {reconciliationData.map((row) => {
            const st = statusStyle[row.status];
            const StatusIcon = st.icon;
            const isOpen = activeRow === row.reference;
            return (
              <div key={row.reference} className="overflow-hidden rounded-[24px] border border-white/8">
                <button
                  className="glass-hover flex w-full flex-wrap items-center justify-between gap-3 bg-white/[0.03] px-5 py-4 text-right"
                  onClick={() => setActiveRow(isOpen ? null : row.reference)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>
                      <StatusIcon className="h-3 w-3" />
                      {st.label}
                    </span>
                    <span className="text-xs text-muted-foreground">فرق: {formatSAR(row.delta)}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{row.reference}</div>
                </button>

                {isOpen && (
                  <div className="grid gap-3 border-t border-white/8 bg-white/[0.02] p-5 md:grid-cols-3">
                    <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-4 text-right">
                      <div className="text-xs text-muted-foreground">تقارير المنصة</div>
                      <div className="mt-1 flex items-center justify-end gap-2 text-lg font-bold text-white">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        {formatSAR(row.platformAmount)}
                      </div>
                    </div>
                    <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-4 text-right">
                      <div className="text-xs text-muted-foreground">السجلات الداخلية</div>
                      <div className="mt-1 text-lg font-bold text-white">{formatSAR(row.internalAmount)}</div>
                    </div>
                    <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-4 text-right">
                      <div className="text-xs text-muted-foreground">سجلات المناديب</div>
                      <div className="mt-1 text-lg font-bold text-white">{formatSAR(row.driverAmount)}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
