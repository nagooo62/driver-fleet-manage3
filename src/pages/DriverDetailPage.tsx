import { useState } from 'react';
import {
  CarFront, ClipboardList, FileText, MapPin, Phone,
  ShieldCheck, User, Briefcase, Globe, Calendar,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { DriverForm } from '@/components/DriverForm';
import { DriverDocumentsPanel } from '@/components/DriverDocumentsPanel';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDriverDetail } from '@/hooks/useDrivers';
import { formatDateArabic, formatDateArabicLong, getDaysUntil, translateCarStatus, translateDriverStatus } from '@/lib/dateUtils';
import { usePermissions } from '@/lib/rbac';
import { cn } from '@/lib/utils';

const APP_LABELS: Record<string, string> = {
  toyou: 'ToYou', hungerstation: 'HungerStation',
  jahez: 'جاهز', keeta: 'كيتا', chefz: 'The Chefz',
};

function docBadge(daysLeft: number | null) {
  if (daysLeft === null) return 'bg-white/5 text-muted-foreground';
  if (daysLeft <= 0)  return 'bg-red-500/15 text-red-400';
  if (daysLeft <= 30) return 'bg-amber-500/15 text-amber-400';
  return 'bg-emerald-500/15 text-emerald-400';
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="text-sm font-semibold text-white">{value}</div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
}

export default function DriverDetailPage() {
  const { id }    = useParams();
  const { data, isLoading, refetch } = useDriverDetail(id);
  const { can }   = usePermissions();
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-[520px] rounded-[32px]" />;
  if (!data) return <div className="glass-panel p-8 text-center text-muted-foreground">تعذر تحميل ملف المندوب المطلوب.</div>;

  const driver = data.driver;
  const iqamaDays   = getDaysUntil(driver.iqama_expiry);
  const licenseDays = getDaysUntil(driver.license_expiry);
  const medicalDays = getDaysUntil(driver.medical_expiry);
  const ajeerDays   = getDaysUntil(driver.ajeer_expiry ?? null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ملف المندوب الكامل"
        title={driver.full_name}
        description={`رقم الإقامة ${driver.iqama} • آخر تحديث ${formatDateArabicLong(driver.updated_at)}`}
        aside={
          <div className="flex items-center gap-2">
            <div className="glass-pill">{translateDriverStatus(driver.status)}</div>
            {driver.app_name && <div className="glass-pill text-primary">{APP_LABELS[driver.app_name] ?? driver.app_name}</div>}
          </div>
        }
        actions={can('drivers:write') ? <Button onClick={() => setIsEditOpen(true)}>تعديل الملف</Button> : null}
      />

      {/* صورة + بطاقة سريعة */}
      <div className="flex flex-wrap items-center gap-5 rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
        <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shrink-0">
          {driver.photo_url
            ? <img src={driver.photo_url} alt={driver.full_name} className="h-full w-full object-cover" loading="eager" />
            : <div className="flex h-full w-full items-center justify-center" aria-hidden="true"><User className="h-8 w-8 text-muted-foreground" /></div>}
        </div>
        <div className="flex-1 text-right min-w-0">
          <h2 className="text-xl font-bold text-white">{driver.full_name}</h2>
          <div className="mt-1 flex flex-wrap justify-end gap-3 text-sm text-muted-foreground">
            {driver.nationality && <span><span aria-hidden="true">🌍 </span>{driver.nationality}</span>}
            {driver.city        && <span><span aria-hidden="true">📍 </span>{driver.city}</span>}
            {driver.phone       && <a href={`tel:${driver.phone}`} className="hover:text-primary transition-colors"><span aria-hidden="true">📞 </span>{driver.phone}</a>}
            {driver.profession  && <span><span aria-hidden="true">💼 </span>{driver.profession}</span>}
          </div>
        </div>
        {/* مؤشر الأداء */}
        {driver.performance_score != null && (
          <div className="flex flex-col items-center gap-1" aria-label={`مؤشر الأداء: ${driver.performance_score}%`}>
            <div className="text-2xl font-bold text-white tabular-nums">{driver.performance_score}%</div>
            <div className="text-xs text-muted-foreground">مؤشر الأداء</div>
          </div>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-[24px] bg-white/5 p-1" aria-label="أقسام ملف المندوب">
          <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
          <TabsTrigger value="documents">الوثائق</TabsTrigger>
          <TabsTrigger value="operations">السجل التشغيلي</TabsTrigger>
          <TabsTrigger value="cars">السيارات</TabsTrigger>
        </TabsList>

        {/* ─── تبويب الملف الشخصي ─── */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="glass-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-white">البيانات الشخصية</h2>
              </div>
              <div className="space-y-2">
                <InfoRow icon={User}     label="الاسم"       value={driver.full_name} />
                <InfoRow icon={ShieldCheck} label="الإقامة"  value={driver.iqama} />
                <InfoRow icon={Globe}    label="الجنسية"     value={driver.nationality} />
                <InfoRow icon={Phone}    label="الجوال"      value={driver.phone} />
                <InfoRow icon={MapPin}   label="المدينة"     value={driver.city} />
                <InfoRow icon={Briefcase} label="المهنة"     value={driver.profession} />
                <InfoRow icon={Calendar} label="المشرف"      value={driver.manager} />
              </div>
            </section>

            <section className="glass-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-semibold text-white">حالة الوثائق</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'الإقامة',        expiry: driver.iqama_expiry,   days: iqamaDays },
                  { label: 'الرخصة',         expiry: driver.license_expiry, days: licenseDays },
                  { label: 'الفحص الطبي',    expiry: driver.medical_expiry, days: medicalDays },
                  { label: 'تصريح أجير',     expiry: driver.ajeer_expiry,   days: ajeerDays },
                ].map(({ label, expiry, days }) => expiry ? (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-3">
                    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', docBadge(days))}>
                      {days === null ? '—' : days <= 0 ? 'منتهي' : `${days} يوم`}
                    </span>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="text-sm font-semibold text-white">{formatDateArabic(expiry)}</div>
                    </div>
                  </div>
                ) : null)}
              </div>
            </section>
          </div>
        </TabsContent>

        {/* ─── تبويب الوثائق ─── */}
        <TabsContent value="documents">
          <section className="glass-panel p-6">
            <div className="mb-5 flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-semibold text-white">وثائق المندوب</h2>
              <p className="mr-2 text-sm text-muted-foreground">ارفع صور الوثائق أو PDF وحدد تواريخ الانتهاء</p>
            </div>
            <DriverDocumentsPanel driverId={driver.id} />
          </section>
        </TabsContent>

        {/* ─── تبويب السجل التشغيلي ─── */}
        <TabsContent value="operations">
          <section className="glass-panel p-6">
            <div className="mb-5 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">السجل التشغيلي</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-right">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-3">التطبيق</th>
                    <th className="px-4 py-3">الرقم الوظيفي</th>
                    <th className="px-4 py-3">الطلبات</th>
                    <th className="px-4 py-3">أيام العمل</th>
                    <th className="px-4 py-3">التحقق</th>
                  </tr>
                </thead>
                <tbody>
                  {data.operations.length ? data.operations.map((op) => (
                    <tr key={op.id} className="border-b border-white/6">
                      <td className="px-4 py-4 text-sm text-white">{op.applicationName}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{op.employee_id ?? '—'}</td>
                      <td className="px-4 py-4 text-sm text-white">{op.orders_count ?? 0}</td>
                      <td className="px-4 py-4 text-sm text-white">{op.working_days ?? 0}</td>
                      <td className="px-4 py-4">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', op.is_verified ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400')}>
                          {op.is_verified ? 'موثّق' : 'قيد المطابقة'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">لا توجد سجلات تشغيلية.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>

        {/* ─── تبويب السيارات ─── */}
        <TabsContent value="cars">
          <section className="glass-panel p-6">
            <div className="mb-5 flex items-center gap-2">
              <CarFront className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">السيارات المرتبطة</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {data.assignedCars.length ? data.assignedCars.map((car) => (
                <div key={car.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-right">
                  {car.photo_url && (
                    <img src={car.photo_url} alt={`صورة السيارة ${car.plate}`} className="mb-3 h-28 w-full rounded-[16px] object-cover" loading="lazy" decoding="async" />
                  )}
                  <div className="text-sm font-semibold text-white">{car.plate}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {[car.brand, car.model, car.year, car.color].filter(Boolean).join(' • ')}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{translateCarStatus(car.status)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">من {formatDateArabic(car.delegation_start)} إلى {formatDateArabic(car.delegation_end)}</div>
                </div>
              )) : (
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-sm text-muted-foreground md:col-span-2">لا توجد سيارات مرتبطة حاليًا.</div>
              )}
            </div>
          </section>
        </TabsContent>
      </Tabs>

      <DriverForm isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} driver={driver} onSave={() => refetch()} />
    </div>
  );
}
