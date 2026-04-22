import { useState } from 'react';
import { CarFront, ClipboardList, FileText, ShieldCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { DriverForm } from '@/components/DriverForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDriverDetail } from '@/hooks/useDrivers';
import { formatDateArabic, formatDateArabicLong, translateCarStatus, translateDriverStatus } from '@/lib/dateUtils';
import { usePermissions } from '@/lib/rbac';

export default function DriverDetailPage() {
  const { id } = useParams();
  const { data, isLoading, refetch } = useDriverDetail(id);
  const { can } = usePermissions();
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-[520px] rounded-[32px]" />;
  }

  if (!data) {
    return <div className="glass-panel p-8 text-center text-muted-foreground">تعذر تحميل ملف المندوب المطلوب.</div>;
  }

  const driver = data.driver;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="تحديثات فورية للمناديب"
        title={driver.full_name}
        description={`رقم الإقامة ${driver.iqama} • آخر تحديث ${formatDateArabicLong(driver.updated_at)}`}
        aside={<div className="glass-pill">{translateDriverStatus(driver.status)}</div>}
        actions={can('drivers:write') ? <Button onClick={() => setIsEditOpen(true)}>تعديل الملف</Button> : null}
      />

      <Tabs defaultValue="Profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-[24px] bg-white/5 p-1">
          <TabsTrigger value="Profile">Profile</TabsTrigger>
          <TabsTrigger value="Operations">Operations</TabsTrigger>
          <TabsTrigger value="Cars">Cars</TabsTrigger>
          <TabsTrigger value="Audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="Profile" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="glass-panel p-6">
              <div className="mb-4 flex items-center gap-2 text-white">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold">الملف الأساسي</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs text-muted-foreground">الاسم الكامل</div>
                  <div className="mt-2 text-sm font-semibold text-white">{driver.full_name}</div>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs text-muted-foreground">رقم الإقامة</div>
                  <div className="mt-2 text-sm font-semibold text-white">{driver.iqama}</div>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs text-muted-foreground">المشرف</div>
                  <div className="mt-2 text-sm font-semibold text-white">{driver.manager ?? '—'}</div>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs text-muted-foreground">مرتبط بتطبيق</div>
                  <div className="mt-2 text-sm font-semibold text-white">{driver.using_app ? 'نعم' : 'لا'}</div>
                </div>
              </div>
            </section>

            <section className="glass-panel p-6">
              <div className="mb-4 flex items-center gap-2 text-white">
                <FileText className="h-5 w-5 text-accent" />
                <h2 className="text-2xl font-semibold">حالة الوثائق</h2>
              </div>
              <div className="space-y-3">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs text-muted-foreground">الإقامة</div>
                  <div className="mt-2 text-sm font-semibold text-white">{formatDateArabic(driver.iqama_expiry)}</div>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs text-muted-foreground">الرخصة</div>
                  <div className="mt-2 text-sm font-semibold text-white">{formatDateArabic(driver.license_expiry)}</div>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs text-muted-foreground">الفحص الطبي</div>
                  <div className="mt-2 text-sm font-semibold text-white">{formatDateArabic(driver.medical_expiry)}</div>
                </div>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="Operations">
          <section className="glass-panel p-6">
            <div className="mb-5 flex items-center gap-2 text-white">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">السجل التشغيلي</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-right">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="px-4 py-3">التطبيق</th>
                    <th className="px-4 py-3">الرقم الوظيفي</th>
                    <th className="px-4 py-3">الطلبات</th>
                    <th className="px-4 py-3">أيام العمل</th>
                    <th className="px-4 py-3">التحقق</th>
                  </tr>
                </thead>
                <tbody>
                  {data.operations.length ? (
                    data.operations.map((operation) => (
                      <tr key={operation.id} className="border-b border-white/6">
                        <td className="px-4 py-4 text-sm text-white">{operation.applicationName}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{operation.employee_id ?? '—'}</td>
                        <td className="px-4 py-4 text-sm text-white">{operation.orders_count ?? 0}</td>
                        <td className="px-4 py-4 text-sm text-white">{operation.working_days ?? 0}</td>
                        <td className="px-4 py-4 text-sm text-white">{operation.is_verified ? 'موثّق' : 'قيد المطابقة'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">لا توجد سجلات تشغيلية مرتبطة بهذا المندوب.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="Cars">
          <section className="glass-panel p-6">
            <div className="mb-5 flex items-center gap-2 text-white">
              <CarFront className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">السيارات المرتبطة</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {data.assignedCars.length ? (
                data.assignedCars.map((car) => (
                  <div key={car.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-right">
                    <div className="text-sm font-semibold text-white">{car.plate}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{car.type}</div>
                    <div className="mt-3 text-xs text-muted-foreground">{translateCarStatus(car.status)}</div>
                    <div className="mt-2 text-xs text-muted-foreground">من {formatDateArabic(car.delegation_start)} إلى {formatDateArabic(car.delegation_end)}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-sm text-muted-foreground md:col-span-2">لا توجد سيارات مرتبطة حاليًا بهذا المندوب.</div>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="Audit">
          <section className="glass-panel p-6">
            <div className="mb-5 flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-accent" />
              <h2 className="text-2xl font-semibold">سجل المراجعة</h2>
            </div>
            <div className="space-y-3">
              {data.audit.length ? (
                data.audit.map((entry) => (
                  <div key={entry.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-right">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-white">{entry.action}</span>
                      <span className="text-xs text-muted-foreground">{formatDateArabic(entry.created_at)}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">بواسطة: {entry.actorName ?? 'النظام'}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-sm text-muted-foreground">لا توجد أحداث تدقيق مرتبطة بهذا المندوب حتى الآن.</div>
              )}
            </div>
          </section>
        </TabsContent>
      </Tabs>

      <DriverForm isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} driver={driver} onSave={() => refetch()} />
    </div>
  );
}
