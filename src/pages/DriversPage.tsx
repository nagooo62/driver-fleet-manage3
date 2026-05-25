import { useMemo, useState } from 'react';
import { Filter, Search, User, UserPlus, X } from 'lucide-react';
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

const APP_LABELS: Record<string, string> = {
  toyou: 'ToYou', hungerstation: 'HungerStation',
  jahez: 'جاهز', keeta: 'كيتا', chefz: 'The Chefz',
};
const APP_COLORS: Record<string, string> = {
  toyou: 'bg-amber-500/15 text-amber-400',
  hungerstation: 'bg-orange-500/15 text-orange-400',
  jahez: 'bg-emerald-500/15 text-emerald-400',
  keeta: 'bg-sky-500/15 text-sky-400',
  chefz: 'bg-purple-500/15 text-purple-400',
};

const docTone = (days: number | null) => {
  if (days === null) return 'bg-white/5 text-muted-foreground';
  if (days <= 0)  return 'bg-red-500/15 text-red-400';
  if (days <= 30) return 'bg-amber-500/15 text-amber-400';
  return 'bg-emerald-500/15 text-emerald-400';
};

const statusTone = (s: string) => {
  switch (s) {
    case 'accepted': case 'sponsored': return 'bg-emerald-500/15 text-emerald-400';
    case 'archived': return 'bg-red-500/15 text-red-400';
    case 'frozen':   case 'stopped':   return 'bg-amber-500/15 text-amber-400';
    default: return 'bg-primary/15 text-primary';
  }
};

const NATIONALITIES = ['الكل', 'سعودي', 'مصري', 'يمني', 'باكستاني', 'هندي', 'بنغلاديشي', 'سوداني', 'إثيوبي', 'نيبالي', 'فلبيني', 'إندونيسي'];
const CITIES        = ['الكل', 'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'القصيم', 'أبها', 'تبوك', 'الطائف'];

export default function DriversPage() {
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('all');
  const [appFilter, setAppFilter]   = useState('all');
  const [natFilter, setNatFilter]   = useState('الكل');
  const [cityFilter, setCityFilter] = useState('الكل');
  const [docFilter, setDocFilter]   = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen,    setIsFormOpen]    = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const navigate = useNavigate();
  const { can }  = usePermissions();
  const { data, isLoading, refetch } = useDrivers({ page, pageSize: 10, search, status });
  const { data: expiringDocuments = [] } = useExpiringDocuments(30);
  const expiringCount = useMemo(() => new Set(expiringDocuments.map((i) => i.driverId)).size, [expiringDocuments]);

  // فلترة جانب العميل (app / nationality / city / doc)
  const filtered = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((d) => {
      if (appFilter !== 'all'  && d.app_name !== appFilter)    return false;
      if (natFilter !== 'الكل' && d.nationality !== natFilter) return false;
      if (cityFilter !== 'الكل' && d.city !== cityFilter)      return false;
      if (docFilter === 'critical') {
        const days = Math.min(
          getDaysUntil(d.iqama_expiry) ?? 9999,
          getDaysUntil(d.license_expiry) ?? 9999,
          getDaysUntil(d.medical_expiry) ?? 9999,
        );
        if (days > 30) return false;
      }
      return true;
    });
  }, [data?.items, appFilter, natFilter, cityFilter, docFilter]);

  const activeFiltersCount = [appFilter !== 'all', natFilter !== 'الكل', cityFilter !== 'الكل', docFilter !== 'all'].filter(Boolean).length;

  const resetFilters = () => { setAppFilter('all'); setNatFilter('الكل'); setCityFilter('الكل'); setDocFilter('all'); };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="أداء المناديب اليومي"
        title="إدارة المناديب"
        description="قائمة كاملة بالمناديب مع بحث حي وتصفية متقدمة بالتطبيق والجنسية والمدينة وحالة الوثائق."
        aside={<div className="glass-pill">{data?.total ?? 0} سجل</div>}
        actions={
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[220px]">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                placeholder="بحث بالاسم أو رقم الإقامة..." className="pr-10 text-right" />
            </div>
            <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
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
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative gap-2">
              <Filter className="h-4 w-4" />
              فلاتر
              {activeFiltersCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">{activeFiltersCount}</span>
              )}
            </Button>
            {can('drivers:write') && (
              <Button onClick={() => { setEditingDriver(null); setIsFormOpen(true); }}>
                <UserPlus className="h-4 w-4" /> إضافة مندوب
              </Button>
            )}
          </div>
        }
      />

      {/* ─── لوحة الفلاتر المتقدمة ─── */}
      {showFilters && (
        <section className="glass-panel p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 min-w-[150px]">
              <label className="block text-xs text-muted-foreground text-right">التطبيق</label>
              <Select value={appFilter} onValueChange={setAppFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="toyou">ToYou</SelectItem>
                  <SelectItem value="hungerstation">HungerStation</SelectItem>
                  <SelectItem value="jahez">جاهز</SelectItem>
                  <SelectItem value="keeta">كيتا</SelectItem>
                  <SelectItem value="chefz">The Chefz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-w-[150px]">
              <label className="block text-xs text-muted-foreground text-right">الجنسية</label>
              <Select value={natFilter} onValueChange={setNatFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{NATIONALITIES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-w-[150px]">
              <label className="block text-xs text-muted-foreground text-right">المدينة</label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-w-[160px]">
              <label className="block text-xs text-muted-foreground text-right">حالة الوثائق</label>
              <Select value={docFilter} onValueChange={setDocFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="critical">وثائق حرجة (30 يوم)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
                <X className="h-3 w-3" /> إعادة ضبط
              </Button>
            )}
          </div>
        </section>
      )}

      <section className="glass-panel section-enter p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <div className="glass-pill">وثائق حرجة: {expiringCount}</div>
          <div className="glass-pill">يظهر: {filtered.length} من {data?.total ?? 0}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-right">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-3">المندوب</th>
                <th className="px-3 py-3">الجنسية / المدينة</th>
                <th className="px-3 py-3">الجوال</th>
                <th className="px-3 py-3">حالة المندوب</th>
                <th className="px-3 py-3">التطبيق</th>
                <th className="px-3 py-3">الإقامة</th>
                <th className="px-3 py-3">الرخصة</th>
                <th className="px-3 py-3">أجير</th>
                <th className="px-3 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/6">
                    <td colSpan={9} className="px-4 py-4 text-sm text-muted-foreground">جارٍ التحميل...</td>
                  </tr>
                ))
              ) : filtered.length ? filtered.map((driver) => {
                const iqamaDays   = getDaysUntil(driver.iqama_expiry);
                const licenseDays = getDaysUntil(driver.license_expiry);
                const ajeerDays   = getDaysUntil(driver.ajeer_expiry ?? null);
                return (
                  <tr key={driver.id} className="border-b border-white/6 transition-colors hover:bg-white/[0.03]">
                    {/* صورة + اسم */}
                    <td className="px-3 py-3">
                      <button className="flex items-center gap-3 text-right" onClick={() => navigate(`/drivers/${driver.id}`)}>
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white/5">
                          {driver.photo_url
                            ? <img src={driver.photo_url} alt={driver.full_name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                            : <div className="flex h-full w-full items-center justify-center" aria-hidden="true"><User className="h-4 w-4 text-muted-foreground" /></div>}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{driver.full_name}</div>
                          <div className="text-xs text-muted-foreground">{driver.iqama}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">
                      <div>{driver.nationality ?? '—'}</div>
                      <div className="text-xs">{driver.city ?? '—'}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">{driver.phone ?? '—'}</td>
                    <td className="px-3 py-3">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', statusTone(driver.status))}>
                        {translateDriverStatus(driver.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {driver.app_name
                        ? <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', APP_COLORS[driver.app_name] ?? 'bg-primary/15 text-primary')}>
                            {APP_LABELS[driver.app_name] ?? driver.app_name}
                          </span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', docTone(iqamaDays))}>
                        {formatDateArabic(driver.iqama_expiry)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', docTone(licenseDays))}>
                        {formatDateArabic(driver.license_expiry)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {driver.ajeer_expiry
                        ? <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', docTone(ajeerDays))}>
                            {formatDateArabic(driver.ajeer_expiry)}
                          </span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/drivers/${driver.id}`)} aria-label={`فتح ملف ${driver.full_name}`}>ملف</Button>
                        {can('drivers:write') && (
                          <Button variant="ghost" size="sm" onClick={() => { setEditingDriver(driver); setIsFormOpen(true); }} aria-label={`تعديل بيانات ${driver.full_name}`}>تعديل</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <User className="h-10 w-10 opacity-20" aria-hidden="true" />
                      <p className="text-sm font-medium">لا توجد نتائج مطابقة</p>
                      <p className="text-xs opacity-70">
                        {activeFiltersCount > 0
                          ? 'جرّب تغيير الفلاتر أو إعادة ضبطها'
                          : 'ابدأ بإضافة مندوب جديد'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data && <PaginationControls page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />}
      </section>

      <DriverForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} driver={editingDriver} onSave={() => refetch()} />
    </div>
  );
}
