import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Archive, Award, CheckCircle2, Download, FileSpreadsheet, FileUp,
  Medal, Package, Search, Target, Timer, Trash2, TrendingUp, Trophy, Users, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  deleteReport, listReports, saveReport, searchReports,
  type ReportRow, type SavedReport,
} from '@/lib/reportsArchive';
import toyouDriversData from '@/data/toyouDrivers.json';
import toyouArchiveData from '@/data/toyouArchive.json';

/* ─── خريطة الأسماء: من بيانات دليل التشغيل الحقيقية ─── */
interface NameEntry { name: string; nameEn: string; phone: string | null; city: string | null }
const NAMES_MAP: Record<string, NameEntry> = {};
for (const d of toyouDriversData as Array<{ toyouId: string; name: string; nameEn: string; phone: string | null; city: string | null }>) {
  NAMES_MAP[d.toyouId] = { name: d.name, nameEn: d.nameEn, phone: d.phone, city: d.city };
}
for (const d of toyouArchiveData as Array<{ toyouId: string | null; name: string; nameEn: string; phone: string | null; city: string | null }>) {
  if (d.toyouId && !NAMES_MAP[d.toyouId]) NAMES_MAP[d.toyouId] = { name: d.name, nameEn: d.nameEn, phone: d.phone, city: d.city };
}

/* ─── كشف الأعمدة بأسماء مرنة ─── */
const ID_COLS     = ['Rep ID', 'rep_id', 'RepID', 'ID', 'id', 'Rider Id', 'rider_id', 'ToYou ID', 'رقم الآيدي', 'الآيدي'];
const ORDERS_COLS = ['Completed Deliveries', 'completed_deliveries', 'Delivered Orders', 'Orders', 'orders', 'عدد الطلبات', 'الطلبات المكتملة', 'الطلبات'];
const HOURS_COLS  = ['Working Hours', 'Hours', 'hours', 'Shift Hours', 'ساعات العمل', 'الساعات', 'ساعات'];
const DAY_COLS    = ['Day', 'Date', 'date', 'اليوم', 'التاريخ'];
const NAME_COLS   = ['Name', 'name', 'Rep Name', 'Rider Name', 'الاسم'];

type RawRow = Record<string, unknown>;

function findCol(row: RawRow, candidates: string[]): string | null {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const hit = keys.find((k) => k.trim().toLowerCase() === c.toLowerCase());
    if (hit) return hit;
  }
  for (const c of candidates) {
    const hit = keys.find((k) => k.trim().toLowerCase().includes(c.toLowerCase()));
    if (hit) return hit;
  }
  return null;
}

function excelSerialToDate(serial: number): string {
  return new Date((serial - 25569) * 86400000).toISOString().slice(0, 10);
}

/** يحول قيم الساعات: رقم أو "HH:MM" أو كسر يوم Excel */
function parseHours(value: unknown): number {
  if (typeof value === 'number') return value < 1 ? +(value * 24).toFixed(1) : +value.toFixed(1);
  const s = String(value ?? '').trim();
  if (!s) return 0;
  const hm = s.match(/^(\d{1,2}):(\d{2})/);
  if (hm) return +(parseInt(hm[1]) + parseInt(hm[2]) / 60).toFixed(1);
  return parseFloat(s) || 0;
}

const STATUS_META: Record<ReportRow['status'], { label: string; cls: string }> = {
  achieved: { label: 'محقق',      cls: 'bg-emerald-500/15 text-emerald-400' },
  near:     { label: 'قريب',      cls: 'bg-amber-500/15 text-amber-400' },
  below:    { label: 'أقل من الهدف', cls: 'bg-orange-500/15 text-orange-400' },
  stopped:  { label: 'متوقف',     cls: 'bg-red-500/15 text-red-400' },
};

const PODIUM_ICONS = [Trophy, Medal, Award];
const PODIUM_CLS = ['text-amber-400', 'text-slate-300', 'text-orange-400'];

export default function ReportsProPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [target, setTarget] = useState(15);
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fileName, setFileName] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveVersion, setArchiveVersion] = useState(0);
  const [openedReportId, setOpenedReportId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const archivedReports = useMemo(
    () => (archiveSearch ? searchReports(archiveSearch) : listReports()),
    [archiveSearch, archiveVersion],
  );

  /* ─── رفع وتحليل ملف الأداء ─── */
  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<RawRow>(ws);
      if (!raw.length) { toast.error('الملف فارغ'); return; }

      const idCol = findCol(raw[0], ID_COLS);
      const ordCol = findCol(raw[0], ORDERS_COLS);
      const hrsCol = findCol(raw[0], HOURS_COLS);
      const dayCol = findCol(raw[0], DAY_COLS);
      const nameCol = findCol(raw[0], NAME_COLS);

      if (!idCol) { toast.error('لم يتم العثور على عمود الآيدي (Rep ID)'); return; }

      // تاريخ التقرير من عمود اليوم إن وُجد
      if (dayCol) {
        const dv = raw[0][dayCol];
        if (typeof dv === 'number' && dv > 10000) setReportDate(excelSerialToDate(dv));
        else if (dv && /\d{4}-\d{2}-\d{2}/.test(String(dv))) setReportDate(String(dv).slice(0, 10));
      }

      // تجميع حسب الآيدي (الملف قد يحتوي عدة شفتات لنفس المندوب)
      const groups: Record<string, { orders: number; hours: number; fileName: string }> = {};
      for (const r of raw) {
        const id = String(r[idCol] ?? '').trim();
        if (!id) continue;
        if (!groups[id]) groups[id] = { orders: 0, hours: 0, fileName: nameCol ? String(r[nameCol] ?? '') : '' };
        groups[id].orders += ordCol ? (parseFloat(String(r[ordCol])) || 0) : 0;
        groups[id].hours += hrsCol ? parseHours(r[hrsCol]) : 0;
      }

      const parsed: ReportRow[] = Object.entries(groups).map(([repId, g]) => {
        const known = NAMES_MAP[repId];
        const achievedPct = target > 0 ? Math.round((g.orders / target) * 100) : 0;
        const status: ReportRow['status'] =
          g.orders === 0 ? 'stopped'
          : g.orders >= target ? 'achieved'
          : g.orders >= target * 0.7 ? 'near'
          : 'below';
        return {
          repId,
          name: known?.name || g.fileName || `مندوب ${repId}`,
          nameEn: known?.nameEn ?? g.fileName,
          orders: g.orders,
          hours: +g.hours.toFixed(1),
          phone: known?.phone ?? null,
          city: known?.city ?? null,
          achievedPct,
          status,
        };
      }).sort((a, b) => b.orders - a.orders);

      setRows(parsed);
      setFileName(file.name);
      setOpenedReportId(null);
      toast.success(`تم تحليل ${parsed.length} مندوب — ${Object.keys(NAMES_MAP).length ? 'الأسماء مطابقة من دليل التشغيل' : ''}`);
    } catch {
      toast.error('تعذر قراءة الملف — تأكد أنه Excel أو CSV صحيح');
    }
  };

  /* ─── الملخص ─── */
  const summary = useMemo(() => {
    const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
    const totalHours = rows.reduce((s, r) => s + r.hours, 0);
    return {
      totalDrivers: rows.length,
      totalOrders,
      totalHours: +totalHours.toFixed(1),
      achievedCount: rows.filter((r) => r.status === 'achieved').length,
      stoppedCount: rows.filter((r) => r.status === 'stopped').length,
      avgOrders: rows.length ? +(totalOrders / rows.length).toFixed(1) : 0,
    };
  }, [rows]);

  /* إعادة حساب الحالة عند تغيير التارقت */
  const computedRows = useMemo(() => rows.map((r) => {
    const achievedPct = target > 0 ? Math.round((r.orders / target) * 100) : 0;
    const status: ReportRow['status'] =
      r.orders === 0 ? 'stopped'
      : r.orders >= target ? 'achieved'
      : r.orders >= target * 0.7 ? 'near'
      : 'below';
    return { ...r, achievedPct, status };
  }), [rows, target]);

  const visibleRows = useMemo(() => {
    const q = tableSearch.trim();
    if (!q) return computedRows;
    return computedRows.filter((r) => r.name.includes(q) || r.repId.includes(q) || (r.nameEn ?? '').toLowerCase().includes(q.toLowerCase()));
  }, [computedRows, tableSearch]);

  const podium = computedRows.slice(0, 3);

  /* ─── حفظ بالأرشيف ─── */
  const handleSave = () => {
    if (!computedRows.length) return;
    saveReport({
      app: 'toyou',
      reportDate,
      target,
      fileName: fileName ?? 'بدون اسم',
      rows: computedRows,
      summary: {
        ...summary,
        achievedCount: computedRows.filter((r) => r.status === 'achieved').length,
        stoppedCount: computedRows.filter((r) => r.status === 'stopped').length,
      },
    });
    setArchiveVersion((v) => v + 1);
    toast.success(`تم حفظ تقرير ${reportDate} في الأرشيف`);
  };

  /* ─── فتح تقرير قديم ─── */
  const handleOpenReport = (report: SavedReport) => {
    setRows(report.rows);
    setTarget(report.target);
    setReportDate(report.reportDate);
    setFileName(report.fileName);
    setOpenedReportId(report.id);
    toast.success(`تم فتح تقرير ${report.reportDate}`);
  };

  /* ─── تصدير Excel ─── */
  const handleExport = () => {
    if (!computedRows.length) return;
    const data = computedRows.map((r, i) => ({
      '#': i + 1,
      'الآيدي': r.repId,
      'الاسم': r.name,
      'الاسم الإنجليزي': r.nameEn ?? '',
      'الجوال': r.phone ?? '',
      'المدينة': r.city ?? '',
      'الطلبات': r.orders,
      'الساعات': r.hours,
      'نسبة التحقيق %': r.achievedPct,
      'الحالة': STATUS_META[r.status].label,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 4 }, { wch: 10 }, { wch: 28 }, { wch: 26 }, { wch: 13 }, { wch: 16 }, { wch: 9 }, { wch: 9 }, { wch: 13 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `تقرير ${reportDate}`);
    XLSX.writeFile(wb, `تقرير-تويو-${reportDate}.xlsx`);
    toast.success('تم تصدير ملف Excel');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="روائس - تحليل تقارير التطبيقات"
        title="تقرير تويو اليومي"
        description="ارفع ملف الأداء (Rider's Performance) — يطابق الآيدي بأسماء دليل التشغيل تلقائياً، يحسب التارقت، يحفظ في الأرشيف، ويصدّر Excel."
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              aria-label="رفع ملف الأداء"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Button onClick={() => fileRef.current?.click()} className="press-effect gap-2">
              <FileUp className="h-4 w-4" /> رفع ملف الأداء
            </Button>
            {computedRows.length > 0 && (
              <>
                <Button variant="outline" onClick={handleSave} className="press-effect gap-2">
                  <Archive className="h-4 w-4" /> حفظ بالأرشيف
                </Button>
                <Button variant="outline" onClick={handleExport} className="press-effect gap-2">
                  <Download className="h-4 w-4" /> تصدير Excel
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* ─── شريط الإعدادات ─── */}
      <section className="glass-panel flex flex-wrap items-end gap-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="rp-target" className="block text-right text-xs text-muted-foreground">
            <Target className="ml-1 inline h-3 w-3" /> التارقت اليومي (طلب)
          </Label>
          <Input id="rp-target" type="number" min="1" value={target}
            onChange={(e) => setTarget(parseInt(e.target.value) || 15)}
            className="w-28 text-right tabular-nums" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rp-date" className="block text-right text-xs text-muted-foreground">تاريخ التقرير</Label>
          <Input id="rp-date" type="date" value={reportDate}
            onChange={(e) => setReportDate(e.target.value)} className="w-40" />
        </div>
        {fileName && (
          <div className="glass-pill text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
            {fileName}
            {openedReportId && <span className="text-muted-foreground">(من الأرشيف)</span>}
            <button onClick={() => { setRows([]); setFileName(null); setOpenedReportId(null); }} aria-label="مسح التقرير الحالي">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </section>

      {computedRows.length > 0 && (
        <>
          {/* ─── بطاقات الملخص ─── */}
          <div className="stagger-children grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {[
              { label: 'المناديب', value: summary.totalDrivers, icon: Users, cls: 'text-primary' },
              { label: 'إجمالي الطلبات', value: summary.totalOrders, icon: Package, cls: 'text-accent' },
              { label: 'إجمالي الساعات', value: summary.totalHours, icon: Timer, cls: 'text-sky-400' },
              { label: 'حققوا التارقت', value: computedRows.filter((r) => r.status === 'achieved').length, icon: CheckCircle2, cls: 'text-emerald-400' },
              { label: 'متوقفون', value: computedRows.filter((r) => r.status === 'stopped').length, icon: X, cls: 'text-red-400' },
              { label: 'متوسط الطلبات', value: summary.avgOrders, icon: TrendingUp, cls: 'text-purple-400' },
            ].map((c) => (
              <div key={c.label} className="card-premium glass-panel p-4 text-right">
                <c.icon className={cn('mb-2 h-5 w-5', c.cls)} aria-hidden="true" />
                <div className="text-2xl font-bold text-white tabular-nums">{c.value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{c.label}</div>
              </div>
            ))}
          </div>

          {/* ─── البوديوم: أفضل 3 ─── */}
          {podium.length === 3 && (
            <section className="glass-panel p-5">
              <h3 className="mb-4 text-sm font-bold text-white">🏆 أفضل المناديب اليوم</h3>
              <div className="stagger-children grid gap-3 sm:grid-cols-3">
                {podium.map((r, i) => {
                  const Icon = PODIUM_ICONS[i];
                  return (
                    <div key={r.repId} className={cn('card-premium rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-center', i === 0 && 'border-amber-500/30 bg-amber-500/[0.05]')}>
                      <Icon className={cn('mx-auto mb-2 h-7 w-7', PODIUM_CLS[i])} aria-hidden="true" />
                      <div className="text-sm font-bold text-white">{r.name}</div>
                      <div className="mt-1 text-2xl font-bold tabular-nums text-primary">{r.orders}</div>
                      <div className="text-xs text-muted-foreground">طلب • {r.hours} ساعة</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── جدول النتائج ─── */}
          <section className="glass-panel p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">نتائج {reportDate} — {visibleRows.length} مندوب</h3>
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={tableSearch} onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الآيدي..." className="pr-10 text-right" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-right">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-muted-foreground">
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">المندوب</th>
                    <th className="px-3 py-3">الآيدي</th>
                    <th className="px-3 py-3">الجوال</th>
                    <th className="px-3 py-3">المدينة</th>
                    <th className="px-3 py-3">الطلبات</th>
                    <th className="px-3 py-3">الساعات</th>
                    <th className="px-3 py-3">التحقيق</th>
                    <th className="px-3 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r, i) => (
                    <tr key={r.repId} className="row-hover border-b border-white/6">
                      <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="px-3 py-3">
                        <div className="text-sm font-semibold text-white">{r.name}</div>
                        {r.nameEn && r.nameEn !== r.name && <div className="text-xs text-muted-foreground" dir="ltr">{r.nameEn}</div>}
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">{r.repId}</td>
                      <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums" dir="ltr">{r.phone ?? '—'}</td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">{r.city ?? '—'}</td>
                      <td className="px-3 py-3 text-sm font-bold text-white tabular-nums">{r.orders}</td>
                      <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">{r.hours}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                            <div className={cn('h-full rounded-full', r.achievedPct >= 100 ? 'bg-emerald-400' : r.achievedPct >= 70 ? 'bg-amber-400' : 'bg-red-400')}
                              style={{ width: `${Math.min(r.achievedPct, 100)}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground">{r.achievedPct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_META[r.status].cls)}>
                          {STATUS_META[r.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ─── حالة فارغة ─── */}
      {!computedRows.length && (
        <section className="glass-panel flex flex-col items-center gap-3 py-14 text-muted-foreground">
          <FileSpreadsheet className="h-12 w-12 opacity-20" aria-hidden="true" />
          <p className="text-sm font-medium">ارفع ملف الأداء لبدء التحليل</p>
          <p className="max-w-md text-center text-xs opacity-70">
            يدعم Excel و CSV — يكفي وجود عمود الآيدي (Rep ID) وعمود الطلبات،
            وسيتم مطابقة الأسماء تلقائياً من دليل تشغيل المناديب ({Object.keys(NAMES_MAP).length} مندوب معروف)
          </p>
          <Button onClick={() => fileRef.current?.click()} variant="outline" className="press-effect mt-2 gap-2">
            <FileUp className="h-4 w-4" /> اختر الملف
          </Button>
        </section>
      )}

      {/* ─── أرشيف التقارير ─── */}
      <section className="glass-panel p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Archive className="h-5 w-5 text-primary" />
            أرشيف التقارير ({archivedReports.length})
          </h3>
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={archiveSearch} onChange={(e) => setArchiveSearch(e.target.value)}
              placeholder="بحث بالتاريخ (2026-06) أو الاسم..." className="pr-10 text-right" />
          </div>
        </div>

        {archivedReports.length ? (
          <div className="stagger-children grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archivedReports.map((report) => (
              <div key={report.id}
                className={cn('card-premium rounded-[20px] border border-white/10 bg-white/[0.03] p-4',
                  openedReportId === report.id && 'border-primary/40 bg-primary/[0.05]')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white tabular-nums">{report.reportDate}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {report.summary.totalDrivers} مندوب • {report.summary.totalOrders} طلب • تارقت {report.target}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground opacity-70">{report.fileName}</div>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">ToYou</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="press-effect h-7 flex-1 text-xs"
                    onClick={() => handleOpenReport(report)}>فتح</Button>
                  <Button size="sm" variant="ghost" className="press-effect h-7 w-7 p-0"
                    aria-label={`حذف تقرير ${report.reportDate}`}
                    onClick={() => { deleteReport(report.id); setArchiveVersion((v) => v + 1); toast.success('تم حذف التقرير'); }}>
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {archiveSearch ? 'لا توجد تقارير مطابقة للبحث' : 'لم تُحفظ تقارير بعد — بعد التحليل اضغط "حفظ بالأرشيف"'}
          </p>
        )}
      </section>
    </div>
  );
}
