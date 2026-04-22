import { useMemo, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DriverForm } from '@/components/DriverForm';
import { PaginationControls } from '@/components/layout/PaginationControls';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDrivers, useExpiringDocuments } from '@/hooks/useDrivers';
import { cn } from '@/lib/utils';
import { formatDateArabic, getDaysUntil, translateDriverStatus } from '@/lib/dateUtils';
import { usePermissions } from '@/lib/rbac';
import type { Driver } from '@/types';

const documentTone = (daysLeft: number | null) => {
  if (daysLeft === null) return 'bg-white/5 text-muted-foreground';
  if (daysLeft <= 0) return 'bg-destructive/15 text-destructive';
  if (daysLeft <= 30) return 'bg-status-warn/15 text-status-warn';
  return 'bg-status-ok/15 text-status-ok';
};

const statusTone = (status: string) => {
  switch (status) {
    case 'accepted':
    case 'sponsored':
      return 'bg-status-ok/15 text-status-ok';
    case 'archived':
      return 'bg-destructive/15 text-destructive';
    case 'frozen':
    case 'stopped':
      return 'bg-status-warn/15 text-status-warn';
    default:
      return 'bg-primary/15 text-primary';
  }
};

export default function DriversPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { data, isLoading, refetch } = useDrivers({ page, pageSize: 10, search, status });
  const { data: expiringDocuments = [] } = useExpiringDocuments(30);

  const expiringCount = useMemo(() => new Set(expiringDocuments.map((item) => item.driverId)).size, [expiringDocuments]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="أداء المناديب اليومي"
        title="إدارة المناديب"
        description="واجهة عربية RTL لإدارة السجل الكامل للمندوب، مع بحث حي، تصفية خادمية، وحركة جدول هادئة من الجانب."
        aside={<div className="glass-pill">{data?.total ?? 0} سجل</div>}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-[240px]">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="بحث بالاسم أو رقم الإقامة أو المشرف" className="pr-10 text-right" />
            </div>
            <Select value={status} onValueChange={(value) => { setPage(1); setStatus(value); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
                <SelectItem value="accepted">مقبول</SelectItem>
                <SelectItem value="sponsored">على الكفالة</SelectItem>
                <SelectItem value="frozen">مجمّد</SelectItem>
                <SelectItem value="stopped">متوقف</SelectItem>
                <SelectItem value="archived">مؤرشف</SelectItem>
              </SelectContent>
            </Select>
            {can('drivers:write') ? (
              <Button onClick={() => { setEditingDriver(null); setIsFormOpen(true); }}>
                <UserPlus className="h-4 w-4" />
                إضافة مندوب
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="glass-panel section-enter p-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="glass-pill">وثائق حرجة: {expiringCount}</div>
          <div className="glass-pill">مرتبطون بتطبيق: {data?.items.filter((driver) => driver.using_app).length ?? 0}</div>
        </div>

        <div className="overflow-x-auto table-enter">
          <table className="min-w-full text-right">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">الإقامة</th>
                <th className="px-4 py-3">المشرف</th>
                <th className="px-4 py-3">حالة المندوب</th>
                <th className="px-4 py-3">حالة الوثائق</th>
                <th className="px-4 py-3">التطبيق</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-white/6">
                    <td colSpan={7} className="px-4 py-4 text-sm text-muted-foreground">جارٍ تحميل بيانات المناديب...</td>
                  </tr>
                ))
              ) : data?.items.length ? (
                data.items.map((driver) => {
                  const iqamaDays = getDaysUntil(driver.iqama_expiry);
                  const licenseDays = getDaysUntil(driver.license_expiry);
                  return (
                    <tr key={driver.id} className="border-b border-white/6 transition-colors hover:bg-white/[0.03]">
                      <td className="px-4 py-4">
                        <button className="text-right" onClick={() => navigate(`/drivers/${driver.id}`)}>
                          <div className="font-semibold text-white">{driver.full_name}</div>
                          <div className="text-xs text-muted-foreground">#{driver.id.slice(0, 8)}</div>
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm text-white">{driver.iqama}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{driver.manager ?? '—'}</td>
                      <td className="px-4 py-4">
                        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusTone(driver.status))}>
                          {translateDriverStatus(driver.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-end gap-2">
                          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', documentTone(iqamaDays))}>إقامة: {formatDateArabic(driver.iqama_expiry)}</span>
                          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', documentTone(licenseDays))}>رخصة: {formatDateArabic(driver.license_expiry)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-white">{driver.using_app ? 'نشط' : '—'}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/drivers/${driver.id}`)}>تفاصيل</Button>
                          {can('drivers:write') ? (
                            <Button variant="ghost" size="sm" onClick={() => { setEditingDriver(driver); setIsFormOpen(true); }}>
                              تعديل
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة للمرشحات الحالية.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data ? <PaginationControls page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} /> : null}
      </section>

      <DriverForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} driver={editingDriver} onSave={() => refetch()} />
    </div>
  );
}
