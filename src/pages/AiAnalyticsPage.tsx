import { useState } from 'react';
import { Activity, AlertTriangle, Bot, Brain, CheckCircle2, ChevronDown, ChevronUp, Fuel, Sparkles, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { useDashboardStats } from '@/hooks/useDashboard';
import type { AiInsightBlueprint } from '@/types';

const performanceData = [
  { day: 'السبت', score: 72, orders: 45, risk: 18 },
  { day: 'الأحد', score: 85, orders: 62, risk: 12 },
  { day: 'الاثنين', score: 78, orders: 55, risk: 22 },
  { day: 'الثلاثاء', score: 91, orders: 78, risk: 8 },
  { day: 'الأربعاء', score: 88, orders: 70, risk: 10 },
  { day: 'الخميس', score: 95, orders: 85, risk: 5 },
  { day: 'الجمعة', score: 82, orders: 60, risk: 14 },
];

const fuelData = [
  { month: 'يناير', consumption: 320, target: 300 },
  { month: 'فبراير', consumption: 295, target: 300 },
  { month: 'مارس', consumption: 340, target: 300 },
  { month: 'أبريل', consumption: 280, target: 300 },
];

const driverRiskProfiles = [
  { name: 'أحمد محمد', score: 92, risk: 'منخفض', trend: 'up', color: 'text-emerald-400' },
  { name: 'خالد عبدالله', score: 78, risk: 'متوسط', trend: 'down', color: 'text-amber-400' },
  { name: 'محمد علي', score: 85, risk: 'منخفض', trend: 'up', color: 'text-emerald-400' },
  { name: 'عبدالرحمن سالم', score: 61, risk: 'مرتفع', trend: 'down', color: 'text-red-400' },
  { name: 'فيصل حمد', score: 74, risk: 'متوسط', trend: 'up', color: 'text-amber-400' },
];

const anomalies = [
  { id: 1, type: 'انحراف في الأوامر', driver: 'عبدالرحمن سالم', detected: 'منذ ٢ ساعة', severity: 'high', desc: 'تسجيل ٤ أوامر أقل من المتوسط اليومي بنسبة ٦٠٪' },
  { id: 2, type: 'توقف غير مبرر', driver: 'خالد عبدالله', detected: 'منذ ٤ ساعات', severity: 'medium', desc: 'توقف لمدة ٤٥ دقيقة في منطقة غير عملياتية' },
  { id: 3, type: 'استهلاك وقود مرتفع', driver: 'فيصل حمد', detected: 'أمس', severity: 'low', desc: 'استهلاك وقود أعلى من المعدل بنسبة ٢٢٪ هذا الأسبوع' },
];

const aiModels: (AiInsightBlueprint & { icon: React.ElementType })[] = [
  { modelKey: 'performance_prediction', title: 'توقع الأداء اليومي', description: 'توقع أداء المندوب بناءً على الطلبات وأيام العمل والالتزام الزمني.', readiness: 'ready_for_data', icon: TrendingUp },
  { modelKey: 'risk_scoring', title: 'تقدير المخاطر التشغيلية', description: 'تقدير مخاطر التعطل، التأخر، أو التدهور التشغيلي قبل حدوثه.', readiness: 'planned', icon: AlertTriangle },
  { modelKey: 'fuel_analytics', title: 'تحليلات استهلاك الوقود', description: 'طبقة جاهزة لربط استهلاك الوقود بمسارات GPS وسلوك التفويض.', readiness: 'requires_schema', icon: Fuel },
  { modelKey: 'anomaly_detection', title: 'كشف الانحرافات الذكي', description: 'كشف الانحرافات في الحركة أو الأداء أو أوامر التطبيقات متعددة القنوات.', readiness: 'ready_for_data', icon: Brain },
];

const readinessStyle: Record<string, { label: string; cls: string }> = {
  ready_for_data:   { label: 'جاهز للبيانات', cls: 'bg-emerald-500/15 text-emerald-400' },
  planned:          { label: 'مخطط له', cls: 'bg-primary/15 text-primary' },
  requires_schema:  { label: 'يحتاج مخطط', cls: 'bg-amber-500/15 text-amber-400' },
};

const severityStyle: Record<string, string> = {
  high:   'bg-red-500/15 text-red-400',
  medium: 'bg-amber-500/15 text-amber-400',
  low:    'bg-blue-500/15 text-blue-400',
};

export default function AiAnalyticsPage() {
  const { data: stats } = useDashboardStats();
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="روائس - التحليلات الذكية"
        title="مركز الذكاء الاصطناعي"
        description="تحليلات متقدمة لتوقع أداء المناديب وكشف المخاطر وتحليل الوقود واكتشاف الانحرافات التشغيلية."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="نماذج جاهزة" value={2} subtitle="جاهزة للبيانات" icon={Bot} tone="primary" />
        <MetricCard title="انحرافات مكتشفة" value={anomalies.length} subtitle="تحتاج مراجعة" icon={AlertTriangle} tone="danger" />
        <MetricCard title="متوسط الأداء" value="84%" subtitle="هذا الأسبوع" icon={Activity} tone="success" />
        <MetricCard title="توفير الوقود" value="7%" subtitle="عن الهدف الشهري" icon={Fuel} tone="accent" />
      </div>

      {/* Performance & Risk Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-panel p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">منحنى الأداء الأسبوعي</h2>
            <p className="mt-1 text-sm text-muted-foreground">مؤشر الأداء اليومي مقارنة بالأوامر المنجزة</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="score" name="مؤشر الأداء" stroke="#6366f1" fill="url(#scoreGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="orders" name="الأوامر" stroke="#22d3ee" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="glass-panel p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">تحليل استهلاك الوقود</h2>
            <p className="mt-1 text-sm text-muted-foreground">الاستهلاك الفعلي مقابل الهدف الشهري</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fuelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9' }} />
              <Bar dataKey="consumption" name="الاستهلاك الفعلي" fill="#6366f1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="target" name="الهدف" fill="#22d3ee" radius={[8, 8, 0, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Driver Risk Profiles */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="glass-panel p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">ملفات مخاطر المناديب</h2>
            <p className="mt-1 text-sm text-muted-foreground">تقييم المخاطر التشغيلية لكل مندوب</p>
          </div>
          <div className="space-y-3">
            {driverRiskProfiles.map((driver) => (
              <div key={driver.name} className="flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center gap-2">
                  {driver.trend === 'up'
                    ? <TrendingUp className="h-4 w-4 text-emerald-400" />
                    : <TrendingDown className="h-4 w-4 text-red-400" />}
                  <span className={`text-sm font-semibold ${driver.color}`}>{driver.risk}</span>
                </div>
                <div className="flex-1 text-right">
                  <div className="text-sm font-semibold text-white">{driver.name}</div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${driver.score}%` }} />
                  </div>
                </div>
                <div className="text-lg font-bold text-white">{driver.score}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Anomalies */}
        <section className="glass-panel p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">الانحرافات المكتشفة</h2>
            <p className="mt-1 text-sm text-muted-foreground">تنبيهات الذكاء الاصطناعي للحالات غير الاعتيادية</p>
          </div>
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4 text-right">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityStyle[anomaly.severity]}`}>
                      {anomaly.severity === 'high' ? 'عالي' : anomaly.severity === 'medium' ? 'متوسط' : 'منخفض'}
                    </span>
                    <span className="text-xs text-muted-foreground">{anomaly.detected}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{anomaly.type}</div>
                </div>
                <div className="mt-2 text-xs font-semibold text-primary">{anomaly.driver}</div>
                <p className="mt-1 text-xs text-muted-foreground">{anomaly.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* AI Models Status */}
      <section className="glass-panel p-6">
        <div className="mb-5 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold text-white">حالة نماذج الذكاء الاصطناعي</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">تفاصيل جاهزية كل نموذج وخطوات التفعيل</p>
          </div>
        </div>
        <div className="space-y-3">
          {aiModels.map((model) => {
            const rd = readinessStyle[model.readiness];
            const Icon = model.icon;
            const isOpen = expandedModel === model.modelKey;
            return (
              <div key={model.modelKey} className="rounded-[20px] border border-white/8 bg-white/[0.03] overflow-hidden">
                <button
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-right"
                  onClick={() => setExpandedModel(isOpen ? null : model.modelKey)}
                >
                  <div className="flex items-center gap-2">
                    {model.readiness === 'ready_for_data'
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      : <Zap className="h-4 w-4 text-amber-400" />}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${rd.cls}`}>{rd.label}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-white">{model.title}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-white/8 px-5 py-4 text-right">
                    <p className="text-sm leading-7 text-muted-foreground">{model.description}</p>
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
