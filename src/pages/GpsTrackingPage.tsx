import { useState } from 'react';
import { Activity, AlertTriangle, Car, MapPin, Navigation, Route, Shield, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { GpsOrdersAudit } from '@/components/gps/GpsOrdersAudit';
import { useDashboardStats } from '@/hooks/useDashboard';

const mockTrips = [
  { id: '1', driver: 'أحمد محمد', car: 'تويوتا هايلوكس - ABC 1234', distance: 42.5, status: 'active', started: 'منذ ٢ ساعة', route: 'الرياض → الدمام' },
  { id: '2', driver: 'خالد عبدالله', car: 'نيسان أورفان - XYZ 5678', distance: 18.3, status: 'completed', started: 'منذ ٥ ساعات', route: 'جدة → مكة' },
  { id: '3', driver: 'محمد علي', car: 'تويوتا هايلوكس - DEF 9012', distance: 67.1, status: 'active', started: 'منذ ٣ ساعات', route: 'الرياض → القصيم' },
  { id: '4', driver: 'عبدالرحمن سالم', car: 'هيونداي H1 - GHI 3456', distance: 5.2, status: 'idle', started: 'منذ ٣٠ دقيقة', route: 'حي النزهة' },
  { id: '5', driver: 'فيصل حمد', car: 'تويوتا هايلوكس - JKL 7890', distance: 0, status: 'alert', started: 'منذ ١٠ دقائق', route: 'منطقة غير مصرح' },
];

const geofenceZones = [
  { name: 'منطقة الرياض الكبرى', status: 'active', drivers: 12, color: 'text-emerald-400' },
  { name: 'محيط جدة التشغيلي', status: 'active', drivers: 8, color: 'text-emerald-400' },
  { name: 'المنطقة الشرقية', status: 'warning', drivers: 3, color: 'text-amber-400' },
  { name: 'منطقة مكة المكرمة', status: 'restricted', drivers: 0, color: 'text-red-400' },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  active:    { label: 'نشط', cls: 'bg-emerald-500/15 text-emerald-400' },
  completed: { label: 'مكتمل', cls: 'bg-primary/15 text-primary' },
  idle:      { label: 'في الانتظار', cls: 'bg-amber-500/15 text-amber-400' },
  alert:     { label: 'تنبيه', cls: 'bg-red-500/15 text-red-400' },
};

export default function GpsTrackingPage() {
  const { data: stats } = useDashboardStats();
  const [filter, setFilter] = useState<'all' | 'active' | 'alert'>('all');

  const filtered = mockTrips.filter((t) => filter === 'all' || t.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="روائس - تتبع الأسطول"
        title="خريطة التتبع الحي"
        description="مراقبة مواقع المناديب والسيارات في الوقت الفعلي مع تنبيهات الاستخدام غير المصرح وإدارة السياج الجغرافي."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilter('all')} className={filter === 'all' ? 'border-primary/50 text-primary' : ''}>الكل</Button>
            <Button variant="outline" size="sm" onClick={() => setFilter('active')} className={filter === 'active' ? 'border-emerald-500/50 text-emerald-400' : ''}>نشط</Button>
            <Button variant="outline" size="sm" onClick={() => setFilter('alert')} className={filter === 'alert' ? 'border-red-500/50 text-red-400' : ''}>تنبيهات</Button>
          </div>
        }
      />

      <div className="stagger-children grid gap-4 md:grid-cols-4">
        <MetricCard title="مناديب على الطريق" value={mockTrips.filter((t) => t.status === 'active').length} subtitle="رحلة نشطة الآن" icon={Navigation} tone="primary" />
        <MetricCard title="إجمالي الكيلومترات" value="133.1" subtitle="كم اليوم" icon={Route} tone="accent" />
        <MetricCard title="في الانتظار" value={mockTrips.filter((t) => t.status === 'idle').length} subtitle="سيارة متوقفة" icon={Car} tone="success" />
        <MetricCard title="تنبيهات خرق السياج" value={mockTrips.filter((t) => t.status === 'alert').length} subtitle="يحتاج مراجعة" icon={AlertTriangle} tone="danger" />
      </div>

      {/* ─── تدقيق GPS مقابل الطلبات ─── */}
      <GpsOrdersAudit />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        {/* Map placeholder */}
        <section className="glass-panel p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-white">الخريطة التفاعلية</h2>
              <p className="mt-1 text-sm text-muted-foreground">مواقع المناديب والسيارات مباشرة</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400">بث مباشر</span>
            </div>
          </div>

          <div className="relative h-80 overflow-hidden rounded-[24px] border border-white/8 bg-slate-900/60">
            {/* Simulated map grid */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto mb-3 h-12 w-12 text-primary/60" />
                <p className="text-sm font-semibold text-white">خريطة GPS التفاعلية</p>
                <p className="mt-1 text-xs text-muted-foreground">تتصل بـ Google Maps / Mapbox عند ربط API المطلوب</p>
              </div>
            </div>

            {/* Simulated driver dots */}
            {mockTrips.filter((t) => t.status === 'active').map((t, i) => (
              <div key={t.id}
                className="absolute flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-400/20"
                style={{ top: `${20 + i * 20}%`, left: `${15 + i * 18}%` }}>
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              </div>
            ))}
            {mockTrips.filter((t) => t.status === 'alert').map((t, i) => (
              <div key={t.id}
                className="absolute flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-400 bg-red-400/20"
                style={{ top: `${65}%`, left: `${75 + i * 10}%` }}>
                <AlertTriangle className="h-3 w-3 text-red-400" />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-400" /><span>نشط</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-400" /><span>في الانتظار</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-400" /><span>تنبيه خرق</span></div>
          </div>
        </section>

        {/* Geofence zones */}
        <section className="glass-panel p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white">السياج الجغرافي</h2>
            <p className="mt-1 text-sm text-muted-foreground">المناطق المصرح والمقيّدة</p>
          </div>
          <div className="space-y-3">
            {geofenceZones.map((zone) => (
              <div key={zone.name} className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4 text-right">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className={`h-4 w-4 ${zone.color}`} />
                    <span className={`text-xs font-semibold ${zone.color}`}>{zone.status === 'active' ? 'نشطة' : zone.status === 'warning' ? 'تحذير' : 'مقيدة'}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{zone.name}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{zone.drivers} مندوب داخل النطاق</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Trips table */}
      <section className="glass-panel p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-white">رحلات اليوم</h2>
          <p className="mt-1 text-sm text-muted-foreground">سجل الرحلات الحالية والمنتهية مع تفاصيل المسار والمسافة.</p>
        </div>

        <div className="space-y-3">
          {filtered.map((trip) => {
            const st = statusMap[trip.status];
            return (
              <div key={trip.id} className="glass-hover flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-4 text-right">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  <span className="text-xs text-muted-foreground">{trip.started}</span>
                </div>
                <div className="flex flex-1 flex-col items-end gap-1">
                  <div className="text-sm font-semibold text-white">{trip.driver}</div>
                  <div className="text-xs text-muted-foreground">{trip.car}</div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-xs text-muted-foreground">المسار</div>
                    <div className="text-sm font-semibold text-white">{trip.route}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">المسافة</div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-white">
                      <Zap className="h-3 w-3 text-primary" />
                      {trip.distance} كم
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.03] p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-4 w-4 text-primary" />
            <span>البيانات مُحاكاة – ستُستبدل ببيانات GPS الحقيقية عند ربط مزود الخريطة</span>
          </div>
        </div>
      </section>
    </div>
  );
}
