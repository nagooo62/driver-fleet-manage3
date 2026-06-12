import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Award, BadgeCheck, BarChart3, CalendarDays, CheckCircle2, Download,
  FileSpreadsheet, FileUp, Medal, Package, Search, ShieldCheck, Target,
  Timer, Trash2, TrendingDown, TrendingUp, Trophy, Users, Wallet, X,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  aggregateReports, deleteReport, listApprovedReports, saveReport,
  type ReportRow, type SavedReport,
} from '@/lib/reportsArchive';
import appsDriversData from '@/data/appsDrivers.json';
import { AppsStatusReport } from '@/components/reports/AppsStatusReport';

/* ═══ التطبيقات ═══ */
type AppKey = SavedReport['app'];
const APP_TABS: Array<{ value: AppKey; label: string; cls: string }> = [
  { value: 'toyou',         label: 'ToYou',     cls: 'bg-amber-500/15 text-amber-400' },
  { value: 'hungerstation', label: 'هنقرستيشن', cls: 'bg-orange-500/15 text-orange-400' },
  { value: 'jahez',         label: 'جاهز',       cls: 'bg-emerald-500/15 text-emerald-400' },
  { value: 'keeta',         label: 'كيتا',       cls: 'bg-sky-500/15 text-sky-400' },
  { value: 'chefz',         label: 'The Chefz', cls: 'bg-purple-500/15 text-purple-400' },
];

/* ═══ خريطة الأسماء من دليل التشغيل ═══ */
interface NameEntry { name: string; nameEn: string; phone: string | null; city: string | null }
interface RawEntry { appId: string | null; name: string; nameEn: string; phone: string | null; city: string | null }
const NAMES_MAP: Record<string, NameEntry> = {};
for (const appData of Object.values(appsDriversData as Record<string, { active: RawEntry[]; archive: RawEntry[] }>)) {
  for (const d of [...appData.active, ...appData.archive]) {
    if (d.appId && !NAMES_MAP[d.appId]) {
      NAMES_MAP[d.appId] = { name: d.name, nameEn: d.nameEn, phone: d.phone, city: d.city };
    }
  }
}

/* ═══ كشف الأعمدة ═══ */
const ID_KEYS     = ['rep id', 'rep_id', 'repid', 'rider id', 'rider_id', 'driver id', 'toyou id', 'id', 'الآيدي', 'رقم الآيدي', 'ايدي', 'آيدي'];
const ORDERS_KEYS = ['completed deliveries', 'completed_deliveries', 'delivered orders', 'delivered', 'deliveries', 'orders', 'total orders', 'عدد الطلبات', 'الطلبات المكتملة', 'الطلبات', 'طلبات'];
const HOURS_KEYS  = ['working hours', 'work hours', 'online hours', 'shift hours', 'hours', 'ساعات العمل', 'الساعات', 'ساعات'];
const DAY_KEYS    = ['day', 'date', 'report date', 'اليوم', 'التاريخ'];
const NAME_KEYS   = ['rep name', 'rider name', 'driver name', 'full name', 'name', 'الاسم الفعلي', 'الاسم'];

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();
const matchKey = (header: string, keys: string[]) => {
  const h = norm(header);
  return keys.some((k) => h === k) || keys.some((k) => h.includes(k));
};

function detectTable(matrix: unknown[][]) {
  for (let i = 0; i < Math.min(matrix.length, 15); i++) {
    const row = matrix[i];
    if (!row?.length) continue;
    let id = -1, orders = -1, hours = -1, day = -1, name = -1;
    row.forEach((cell, c) => {
      const h = String(cell ?? '');
      if (!h.trim()) return;
      if (id < 0 && matchKey(h, ID_KEYS)) id = c;
      else if (orders < 0 && matchKey(h, ORDERS_KEYS)) orders = c;
      else if (hours < 0 && matchKey(h, HOURS_KEYS)) hours = c;
      else if (day < 0 && matchKey(h, DAY_KEYS)) day = c;
      else if (name < 0 && matchKey(h, NAME_KEYS)) name = c;
    });
    if (id >= 0 && orders >= 0) return { headerIdx: i, cols: { id, orders, hours, day, name } };
  }
  return null;
}

const excelSerialToDate = (serial: number) => new Date((serial - 25569) * 86400000).toISOString().slice(0, 10);

function parseHours(value: unknown): number {
  if (typeof value === 'number') return value < 1 ? +(value * 24).toFixed(1) : +value.toFixed(1);
  const s = String(value ?? '').trim();
  if (!s) return 0;
  const hm = s.match(/^(\d{1,2}):(\d{2})/);
  if (hm) return +(parseInt(hm[1]) + parseInt(hm[2]) / 60).toFixed(1);
  return parseFloat(s) || 0;
}

const STATUS_META: Record<ReportRow['status'], { label: string; cls: string }> = {
  achieved: { label: 'محقق',         cls: 'bg-emerald-500/15 text-emerald-400' },
  near:     { label: 'قريب',         cls: 'bg-amber-500/15 text-amber-400' },
  below:    { label: 'أقل من الهدف', cls: 'bg-orange-500/15 text-orange-400' },
  stopped:  { label: 'متوقف',        cls: 'bg-red-500/15 text-red-400' },
};

const PODIUM_ICONS = [Trophy, Medal, Award];
const PODIUM_CLS = ['text-amber-400', 'text-slate-300', 'text-orange-400'];

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number | string; name?: string }>;
  label?: string;
}
const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[12px] border border-white/10 bg-slate-900/95 px-3 py-2 text-right text-xs">
      <div className="font-semibold text-white">{label}</div>
      {payload.map((p, i) => <div key={i} className="text-muted-foreground">{p.name}: {p.value}</div>)}
    </div>
  );
};

type ViewKey = 'daily' | 'weekly' | 'monthly';

export default function ReportsProPage() {
  const [app, setApp] = useState<AppKey>('toyou');
  const [view, setView] = useState<ViewKey>('daily');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [target, setTarget] = useState(15);
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fileName, setFileName] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [weekEnd, setWeekEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [version, setVersion] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const appMeta = APP_TABS.find((t) => t.value === app)!;

  /* التقارير المعتمدة للتطبيق الحالي */
  const approvedReports = useMemo(() => {
    void version;
    return listApprovedReports().filter((r) => r.app === app);
  }, [app, version]);

  /* ═══ رفع وتحليل الملف ═══ */
  const handleFile = async (file: File) => {
    try {
      const isCsv = /\.csv$/i.test(file.name) || file.type === 'text/csv';
      const wb = isCsv
        ? XLSX.read(await file.text(), { type: 'string' })
        : XLSX.read(await file.arrayBuffer());
      const ws = wb.Sheets[wb.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
      if (!matrix.length) { toast.error('الملف فارغ'); return; }

      const detected = detectTable(matrix);
      if (!detected) {
        toast.error('لم يتم العثور على أعمدة الآيدي والطلبات في الملف');
        return;
      }
      const { headerIdx, cols } = detected;

      const firstData = matrix[headerIdx + 1];
      if (cols.day >= 0 && firstData) {
        const dv = firstData[cols.day];
        if (typeof dv === 'number' && dv > 10000) setReportDate(excelSerialToDate(dv));
        else if (dv && /\d{4}-\d{2}-\d{2}/.test(String(dv))) setReportDate(String(dv).slice(0, 10));
        else if (dv && /\d{2}\/\d{2}\/\d{4}/.test(String(dv))) {
          const [m, d, y] = String(dv).split('/');
          setReportDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        }
      }

      const groups: Record<string, { orders: number; hours: number; fileName: string }> = {};
      for (let i = headerIdx + 1; i < matrix.length; i++) {
        const row = matrix[i];
        if (!row?.length) continue;
        const id = String(row[cols.id] ?? '').trim().replace(/\.0$/, '');
        if (!id || matchKey(id, ID_KEYS)) continue;
        if (!groups[id]) groups[id] = { orders: 0, hours: 0, fileName: cols.name >= 0 ? String(row[cols.name] ?? '') : '' };
        groups[id].orders += parseFloat(String(row[cols.orders])) || 0;
        if (cols.hours >= 0) groups[id].hours += parseHours(row[cols.hours]);
      }

      const parsed: ReportRow[] = Object.entries(groups).map(([repId, g]) => {
        const known = NAMES_MAP[repId];
        return {
          repId,
          name: known?.name || g.fileName || `مندوب ${repId}`,
          nameEn: known?.nameEn ?? g.fileName,
          orders: g.orders,
          hours: +g.hours.toFixed(1),
          phone: known?.phone ?? null,
          city: known?.city ?? null,
          achievedPct: 0,
          status: 'below' as const,
        };
      }).sort((a, b) => b.orders - a.orders);

      if (!parsed.length) { toast.error('لم يتم العثور على صفوف بيانات صالحة'); return; }

      setRows(parsed);
      setFileName(file.name);
      setIsApproved(false);
      toast.success(`تم التحليل: ${parsed.length} مندوب — راجع النتائج ثم اعتمد التقرير`);
    } catch {
      toast.error('تعذر قراءة الملف — تأكد أنه Excel أو CSV صحيح');
    }
  };

  const computedRows = useMemo(() => rows.map((r) => {
    const achievedPct = target > 0 ? Math.round((r.orders / target) * 100) : 0;
    const status: ReportRow['status'] =
      r.orders === 0 ? 'stopped'
      : r.orders >= target ? 'achieved'
      : r.orders >= target * 0.7 ? 'near'
      : 'below';
    return { ...r, achievedPct, status };
  }), [rows, target]);

  const summary = useMemo(() => {
    const totalOrders = computedRows.reduce((s, r) => s + r.orders, 0);
    return {
      totalDrivers: computedRows.length,
      totalOrders,
      totalHours: +computedRows.reduce((s, r) => s + r.hours, 0).toFixed(1),
      achievedCount: computedRows.filter((r) => r.status === 'achieved').length,
      stoppedCount: computedRows.filter((r) => r.status === 'stopped').length,
      avgOrders: computedRows.length ? +(totalOrders / computedRows.length).toFixed(1) : 0,
    };
  }, [computedRows]);

  const visibleRows = useMemo(() => {
    const q = tableSearch.trim();
    if (!q) return computedRows;
    return computedRows.filter((r) => r.name.includes(q) || r.repId.includes(q) || (r.nameEn ?? '').toLowerCase().includes(q.toLowerCase()));
  }, [computedRows, tableSearch]);

  const podium = computedRows.filter((r) => r.orders > 0).slice(0, 3);

  /* ═══ اعتماد تقرير اليوم ═══ */
  const handleApprove = () => {
    if (!computedRows.length) return;
    saveReport({
      app, reportDate, target,
      fileName: fileName ?? 'بدون اسم',
      rows: computedRows, summary,
      approved: true,
      approvedAt: new Date().toISOString(),
    });
    setIsApproved(true);
    setVersion((v) => v + 1);
    toast.success(`✅ تم اعتماد تقرير ${appMeta.label} الرسمي ليوم ${reportDate}`);
  };

  const handleOpenReport = (report: SavedReport) => {
    setRows(report.rows);
    setTarget(report.target);
    setReportDate(report.reportDate);
    setFileName(report.fileName);
    setIsApproved(true);
    setView('daily');
  };

  const exportRows = (data: Record<string, unknown>[], sheetName: string, file: string, widths: number[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = widths.map((wch) => ({ wch }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, file);
    toast.success('تم تصدير ملف Excel');
  };

  const handleExportDaily = () => {
    if (!computedRows.length) return;
    exportRows(
      computedRows.map((r, i) => ({
        '#': i + 1, 'الآيدي': r.repId, 'الاسم': r.name, 'اسم الحساب': r.nameEn ?? '',
        'الجوال': r.phone ?? '', 'الطلبات': r.orders, 'الساعات': r.hours,
        'نسبة التحقيق %': r.achievedPct, 'الحالة': STATUS_META[r.status].label,
      })),
      `تقرير ${reportDate}`, `تقرير-${appMeta.label}-اليومي-${reportDate}.xlsx`,
      [4, 10, 28, 26, 13, 9, 9, 13, 12],
    );
  };

  /* ═══ الأسبوعي: 7 أيام تنتهي بالتاريخ المحدد ═══ */
  const weekStart = useMemo(() => {
    const d = new Date(weekEnd);
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  }, [weekEnd]);

  const weeklyReports = useMemo(
    () => approvedReports.filter((r) => r.reportDate >= weekStart && r.reportDate <= weekEnd),
    [approvedReports, weekStart, weekEnd],
  );
  const weeklyAgg = useMemo(() => aggregateReports(weeklyReports), [weeklyReports]);

  const handleExportWeekly = () => {
    if (!weeklyAgg.length) return;
    exportRows(
      weeklyAgg.map((r, i) => ({
        '#': i + 1, 'الآيدي': r.repId, 'الاسم': r.name, 'أيام العمل': r.days,
        'الطلبات': r.orders, 'الساعات': r.hours, 'التارقت الإجمالي': r.targetTotal,
        'الفرق عن التارقت': r.diff, 'نسبة التحقيق %': r.achievedPct,
      })),
      `أسبوعي ${weekStart}`, `تقرير-${appMeta.label}-الأسبوعي-${weekEnd}.xlsx`,
      [4, 10, 28, 10, 9, 9, 14, 14, 13],
    );
  };

  /* ═══ الشهري — كشف الرواتب ═══ */
  const monthlyReports = useMemo(
    () => approvedReports.filter((r) => r.reportDate.startsWith(month)),
    [approvedReports, month],
  );
  const monthlyAgg = useMemo(() => aggregateReports(monthlyReports), [monthlyReports]);

  const handleExportMonthly = () => {
    if (!monthlyAgg.length) return;
    exportRows(
      monthlyAgg.map((r, i) => ({
        '#': i + 1, 'الآيدي': r.repId, 'الاسم': r.name, 'الجوال': r.phone ?? '',
        'أيام العمل': r.days, 'إجمالي الطلبات': r.orders, 'إجمالي الساعات': r.hours,
        'التارقت الشهري': r.targetTotal, 'الفرق': r.diff, 'نسبة التحقيق %': r.achievedPct,
        'متوسط طلبات/يوم': r.days ? +(r.orders / r.days).toFixed(1) : 0,
      })),
      `رواتب ${month}`, `كشف-رواتب-${appMeta.label}-${month}.xlsx`,
      [4, 10, 28, 13, 10, 13, 13, 13, 9, 13, 14],
    );
  };

  const clearCurrent = () => { setRows([]); setFileName(null); setIsApproved(false); };

  /* رسم بياني أسبوعي: الطلبات يومياً */
  const weekChart = useMemo(() =>
    [...weeklyReports]
      .sort((a, b) => a.reportDate.localeCompare(b.reportDate))
      .map((r) => ({ date: r.reportDate.slice(5), 'الطلبات': r.summary.totalOrders })),
  [weeklyReports]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="روائس - تحليل تقارير التطبيقات"
        title={`تقارير ${appMeta.label}`}
        description="ارفع تقرير الأداء، راجعه، ثم اعتمده ليصبح التقرير الرسمي لليوم — الأسبوعي يوضح فرق كل مندوب عن التارقت، والشهري جاهز للرواتب."
      />

      {/* تقرير حالة التطبيقات */}
      <AppsStatusReport />

      {/* تبويبات التطبيقات */}
      <section className="glass-panel flex flex-wrap gap-1.5 p-3" role="tablist" aria-label="اختيار التطبيق">
        {APP_TABS.map((tab) => (
          <button key={tab.value} role="tab" aria-selected={app === tab.value}
            onClick={() => { setApp(tab.value); clearCurrent(); }}
            className={cn(
              'press-effect rounded-full px-5 py-2 text-sm font-semibold transition-colors',
              app === tab.value ? cn('ring-1 ring-inset ring-white/20', tab.cls) : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
            )}>
            {tab.label}
          </button>
        ))}
      </section>

      {/* يومي / أسبوعي / شهري */}
      <div className="flex rounded-full bg-white/5 p-1 w-fit" role="tablist" aria-label="نوع التقرير">
        {([
          { key: 'daily', label: 'التقرير اليومي', icon: CalendarDays },
          { key: 'weekly', label: 'الأسبوعي', icon: BarChart3 },
          { key: 'monthly', label: 'الشهري (الرواتب)', icon: Wallet },
        ] as Array<{ key: ViewKey; label: string; icon: React.ElementType }>).map((v) => (
          <button key={v.key} role="tab" aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={cn('press-effect flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              view === v.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
            <v.icon className="h-3.5 w-3.5" /> {v.label}
          </button>
        ))}
      </div>

      {/* ═══════════ اليومي ═══════════ */}
      {view === 'daily' && (
        <>
          <section className="glass-panel flex flex-wrap items-end gap-4 p-4">
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              aria-label="رفع تقرير الأداء"
              onChange={(e) => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = ''; } }} />
            <Button onClick={() => fileRef.current?.click()} className="press-effect gap-2">
              <FileUp className="h-4 w-4" /> رفع التقرير
            </Button>
            {computedRows.length > 0 && !isApproved && (
              <Button onClick={handleApprove} className="press-effect gap-2 bg-emerald-600 hover:bg-emerald-500">
                <ShieldCheck className="h-4 w-4" /> اعتماد تقرير اليوم
              </Button>
            )}
            {isApproved && (
              <span className="glass-pill border-emerald-500/40 text-emerald-400">
                <BadgeCheck className="h-4 w-4" /> معتمد — التقرير الرسمي ليوم {reportDate}
              </span>
            )}
            {computedRows.length > 0 && (
              <Button variant="outline" onClick={handleExportDaily} className="press-effect gap-2">
                <Download className="h-4 w-4" /> تصدير Excel
              </Button>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="rp-target" className="block text-right text-xs text-muted-foreground">
                <Target className="ml-1 inline h-3 w-3" /> التارقت
              </Label>
              <Input id="rp-target" type="number" min="1" value={target}
                onChange={(e) => setTarget(parseInt(e.target.value) || 15)} className="w-24 text-right tabular-nums" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rp-date" className="block text-right text-xs text-muted-foreground">تاريخ التقرير</Label>
              <Input id="rp-date" type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-40" />
            </div>
            {fileName && (
              <div className="glass-pill text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                {fileName}
                <button onClick={clearCurrent} aria-label="مسح التقرير الحالي"><X className="h-3 w-3" /></button>
              </div>
            )}
          </section>

          {computedRows.length > 0 && (
            <>
              <div className="stagger-children grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                {[
                  { label: 'المناديب', value: summary.totalDrivers, icon: Users, cls: 'text-primary' },
                  { label: 'إجمالي الطلبات', value: summary.totalOrders, icon: Package, cls: 'text-accent' },
                  { label: 'إجمالي الساعات', value: summary.totalHours, icon: Timer, cls: 'text-sky-400' },
                  { label: 'حققوا التارقت', value: summary.achievedCount, icon: CheckCircle2, cls: 'text-emerald-400' },
                  { label: 'متوقفون', value: summary.stoppedCount, icon: X, cls: 'text-red-400' },
                  { label: 'متوسط الطلبات', value: summary.avgOrders, icon: TrendingUp, cls: 'text-purple-400' },
                ].map((c) => (
                  <div key={c.label} className="card-premium glass-panel p-4 text-right">
                    <c.icon className={cn('mb-2 h-5 w-5', c.cls)} aria-hidden="true" />
                    <div className="text-2xl font-bold text-white tabular-nums">{c.value}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{c.label}</div>
                  </div>
                ))}
              </div>

              {podium.length === 3 && (
                <section className="glass-panel p-5">
                  <h3 className="mb-4 text-sm font-bold text-white">🏆 أفضل المناديب — {reportDate}</h3>
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

              <section className="glass-panel p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">
                    {isApproved ? '✅ التقرير المعتمد' : '🔍 قيد المراجعة'} — {reportDate} ({visibleRows.length} مندوب)
                  </h3>
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
                          <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums" dir="ltr">{r.repId}</td>
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

          {!computedRows.length && (
            <section className="glass-panel flex flex-col items-center gap-3 py-14 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 opacity-20" aria-hidden="true" />
              <p className="text-sm font-medium">ارفع تقرير أداء {appMeta.label} — راجعه ثم اعتمده</p>
              <p className="max-w-md text-center text-xs opacity-70">
                Excel أو CSV بأي تنسيق شائع — الأسماء تُطابق تلقائياً من دليل التشغيل ({Object.keys(NAMES_MAP).length} مندوب معروف)
              </p>
              <Button onClick={() => fileRef.current?.click()} variant="outline" className="press-effect mt-2 gap-2">
                <FileUp className="h-4 w-4" /> اختر الملف
              </Button>
            </section>
          )}

          {/* التقارير المعتمدة */}
          <section className="glass-panel p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <BadgeCheck className="h-5 w-5 text-emerald-400" />
              التقارير المعتمدة — {appMeta.label} ({approvedReports.length})
            </h3>
            {approvedReports.length ? (
              <div className="stagger-children grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {approvedReports.map((report) => (
                  <div key={report.id} className="card-premium rounded-[20px] border border-emerald-500/15 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-white tabular-nums">
                          <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" /> {report.reportDate}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {report.summary.totalDrivers} مندوب • {report.summary.totalOrders} طلب • تارقت {report.target}
                        </div>
                      </div>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', appMeta.cls)}>{appMeta.label}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="press-effect h-7 flex-1 text-xs"
                        onClick={() => handleOpenReport(report)}>عرض</Button>
                      <Button size="sm" variant="ghost" className="press-effect h-7 w-7 p-0"
                        aria-label={`حذف تقرير ${report.reportDate}`}
                        onClick={() => { deleteReport(report.id); setVersion((v) => v + 1); toast.success('تم حذف التقرير'); }}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">لا توجد تقارير معتمدة بعد — ارفع تقريراً واعتمده</p>
            )}
          </section>
        </>
      )}

      {/* ═══════════ الأسبوعي ═══════════ */}
      {view === 'weekly' && (
        <>
          <section className="glass-panel flex flex-wrap items-end gap-4 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="rp-weekend" className="block text-right text-xs text-muted-foreground">أسبوع ينتهي بيوم</Label>
              <Input id="rp-weekend" type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} className="w-40" />
            </div>
            <div className="glass-pill text-xs">{weekStart} ← {weekEnd} • {weeklyReports.length} تقرير معتمد</div>
            {weeklyAgg.length > 0 && (
              <Button variant="outline" onClick={handleExportWeekly} className="press-effect gap-2">
                <Download className="h-4 w-4" /> تصدير الأسبوعي
              </Button>
            )}
          </section>

          {weekChart.length > 1 && (
            <section className="glass-panel p-6">
              <h3 className="mb-4 text-sm font-bold text-white">طلبات {appMeta.label} خلال الأسبوع</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekChart} margin={{ top: 5, right: 4, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="الطلبات" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}

          {weeklyAgg.length ? (
            <section className="glass-panel p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">فرق كل مندوب عن التارقت — {weeklyAgg.length} مندوب</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-right">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-muted-foreground">
                      <th className="px-3 py-3">#</th>
                      <th className="px-3 py-3">المندوب</th>
                      <th className="px-3 py-3">أيام العمل</th>
                      <th className="px-3 py-3">الطلبات</th>
                      <th className="px-3 py-3">الساعات</th>
                      <th className="px-3 py-3">التارقت الإجمالي</th>
                      <th className="px-3 py-3">الفرق عن التارقت</th>
                      <th className="px-3 py-3">التحقيق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyAgg.map((r, i) => (
                      <tr key={r.repId} className="row-hover border-b border-white/6">
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                        <td className="px-3 py-3">
                          <div className="text-sm font-semibold text-white">{r.name}</div>
                          <div className="text-xs text-muted-foreground tabular-nums" dir="ltr">{r.repId}</div>
                        </td>
                        <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">{r.days}</td>
                        <td className="px-3 py-3 text-sm font-bold text-white tabular-nums">{r.orders}</td>
                        <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">{r.hours}</td>
                        <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">{r.targetTotal}</td>
                        <td className="px-3 py-3">
                          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums',
                            r.diff >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>
                            {r.diff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {r.diff >= 0 ? `+${r.diff}` : r.diff}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs tabular-nums text-muted-foreground">{r.achievedPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section className="glass-panel py-12 text-center text-sm text-muted-foreground">
              لا توجد تقارير معتمدة في هذا الأسبوع — اعتمد تقارير يومية أولاً
            </section>
          )}
        </>
      )}

      {/* ═══════════ الشهري — الرواتب ═══════════ */}
      {view === 'monthly' && (
        <>
          <section className="glass-panel flex flex-wrap items-end gap-4 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="rp-month" className="block text-right text-xs text-muted-foreground">الشهر</Label>
              <Input id="rp-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
            </div>
            <div className="glass-pill text-xs">{monthlyReports.length} تقرير معتمد في {month}</div>
            {monthlyAgg.length > 0 && (
              <Button onClick={handleExportMonthly} className="press-effect gap-2 bg-emerald-600 hover:bg-emerald-500">
                <Wallet className="h-4 w-4" /> تصدير كشف الرواتب
              </Button>
            )}
          </section>

          {monthlyAgg.length ? (
            <section className="glass-panel p-6">
              <h3 className="mb-1 text-lg font-semibold text-white">كشف الشهر — {monthlyAgg.length} مندوب</h3>
              <p className="mb-4 text-xs text-muted-foreground">مبني على التقارير اليومية المعتمدة فقط — جاهز لاحتساب الرواتب</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-right">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-muted-foreground">
                      <th className="px-3 py-3">#</th>
                      <th className="px-3 py-3">المندوب</th>
                      <th className="px-3 py-3">الجوال</th>
                      <th className="px-3 py-3">أيام العمل</th>
                      <th className="px-3 py-3">الطلبات</th>
                      <th className="px-3 py-3">الساعات</th>
                      <th className="px-3 py-3">متوسط/يوم</th>
                      <th className="px-3 py-3">التارقت الشهري</th>
                      <th className="px-3 py-3">الفرق</th>
                      <th className="px-3 py-3">التحقيق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyAgg.map((r, i) => (
                      <tr key={r.repId} className="row-hover border-b border-white/6">
                        <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                        <td className="px-3 py-3">
                          <div className="text-sm font-semibold text-white">{r.name}</div>
                          <div className="text-xs text-muted-foreground tabular-nums" dir="ltr">{r.repId}</div>
                        </td>
                        <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums" dir="ltr">{r.phone ?? '—'}</td>
                        <td className="px-3 py-3 text-sm font-semibold text-white tabular-nums">{r.days}</td>
                        <td className="px-3 py-3 text-sm font-bold text-white tabular-nums">{r.orders}</td>
                        <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">{r.hours}</td>
                        <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">{r.days ? (r.orders / r.days).toFixed(1) : '—'}</td>
                        <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">{r.targetTotal}</td>
                        <td className="px-3 py-3">
                          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums',
                            r.diff >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>
                            {r.diff >= 0 ? `+${r.diff}` : r.diff}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs tabular-nums text-muted-foreground">{r.achievedPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section className="glass-panel py-12 text-center text-sm text-muted-foreground">
              لا توجد تقارير معتمدة في {month} — اعتمد التقارير اليومية أولاً ليُبنى عليها كشف الرواتب
            </section>
          )}
        </>
      )}
    </div>
  );
}
