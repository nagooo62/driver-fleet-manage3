import { useState } from 'react';
import { CarFront, Search, Truck } from 'lucide-react';
import { CarForm } from '@/components/CarForm';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PaginationControls } from '@/components/layout/PaginationControls';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCars, useCarStats } from '@/hooks/useCars';
import { formatDateArabic, translateCarStatus } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/rbac';
import type { Car } from '@/types';

const statusTone = (status: string) => {
  switch (status) {
    case 'delegated':
      return 'bg-primary/15 text-primary';
    case 'available':
      return 'bg-status-ok/15 text-status-ok';
    case 'out_of_service':
      return 'bg-destructive/15 text-destructive';
    default:
      return 'bg-accent/15 text-accent';
  }
};

export default function CarsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const { can } = usePermissions();
  const { data, isLoading, refetch } = useCars({ page, pageSize: 10, search, status });
  const { data: stats } = useCarStats();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="روائس - الحل اللوجستي الذكي"
        title="إدارة السيارات"
        description="تتبّع جاهزية المركبات، حالات التفويض، والتوقفات التشغيلية ضمن طبقة UI زجاجية موحدة."
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-[240px]">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="بحث باللوحة أو نوع السيارة" className="pr-10 text-right" />
            </div>
            <Select value={status} onValueChange={(value) => { setPage(1); setStatus(value); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="available">متاحة</SelectItem>
                <SelectItem value="delegated">مفوّضة</SelectItem>
                <SelectItem value="handed">مسلّمة</SelectItem>
                <SelectItem value="out_of_service">خارج الخدمة</SelectItem>
              </SelectContent>
            </Select>
            {can('cars:write') ? (
              <Button onClick={() => { setEditingCar(null); setIsFormOpen(true); }}>
                <CarFront className="h-4 w-4" />
                إضافة سيارة
              </Button>
            ) : null}
          </div>
        }
      />

      {stats ? (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Fleet" value={stats.total} subtitle={`${stats.available} متاحة`} icon={Truck} tone="primary" />
          <MetricCard title="Delegated" value={stats.delegated} subtitle="تفويضات نشطة" icon={CarFront} tone="accent" />
          <MetricCard title="Out Of Service" value={stats.outOfService} subtitle="تحتاج معالجة" icon={Truck} tone="danger" />
        </div>
      ) : null}

      <section className="glass-panel section-enter p-6">
        <div className="overflow-x-auto table-enter">
          <table className="min-w-full text-right">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-4 py-3">اللوحة</th>
                <th className="px-4 py-3">النوع</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">المندوب الحالي</th>
                <th className="px-4 py-3">مدة التفويض</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-white/6">
                    <td colSpan={6} className="px-4 py-4 text-sm text-muted-foreground">جارٍ تحميل بيانات السيارات...</td>
                  </tr>
                ))
              ) : data?.items.length ? (
                data.items.map((car) => (
                  <tr key={car.id} className="border-b border-white/6 transition-colors hover:bg-white/[0.03]">
                    <td className="px-4 py-4 text-sm font-semibold text-white">{car.plate}</td>
                    <td className="px-4 py-4 text-sm text-white">{car.type}</td>
                    <td className="px-4 py-4">
                      <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusTone(car.status))}>
                        {translateCarStatus(car.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{car.current_delegate?.full_name ?? '—'}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      <div>{formatDateArabic(car.delegation_start)}</div>
                      <div>{formatDateArabic(car.delegation_end)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {can('cars:write') ? (
                          <Button variant="ghost" size="sm" onClick={() => { setEditingCar(car); setIsFormOpen(true); }}>
                            تعديل
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">لا توجد سيارات مطابقة للمرشحات الحالية.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data ? <PaginationControls page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} /> : null}
      </section>

      <CarForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} car={editingCar} onSave={() => refetch()} />
    </div>
  );
}
