import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, FileSpreadsheet, FileUp,
  Gauge, MapPin, Receipt, Timer, TrendingUp, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/** سقف الكيلومترات المسموح بها فوق مسافة التطبيق قبل اعتبارها زائدة */
const EXTRA_KM_THRESHOLD = 23;

interface AuditRow {
  driverName: string;
  appHours: number;      // ساعات فتح التطبيق
  ordersCount: number;   // عدد الطلبات
  appKm: number;         // كيلومترات التطبيق (المفترضة)
  gpsKm: number;         // كيلومترات GPS الفعلية
  carMoving: boolean;    // هل كانت السيارة متحركة أثناء فتح التطبيق
}

interface AuditResult extends AuditRow {
  extraKm: number;       // الفرق الزائد
  kmPerOrder: number;    // كم/طلب
  flagged: boolean;      // تجاوز السقف
  charge: number;        // الرسوم المحسوبة
}

const DEMO_ROWS: AuditRow[] = [
  { driverName: 'محمد علي محمد',   appHours: 9.5, ordersCount: 28, appKm: 120, gpsKm: 131, carMoving: true },
  { driverName: 'أحمد ياسر',        appHours: 8,   ordersCount: 22, appKm: 95,  gpsKm: 142, carMoving: true },
  { driverName: 'معتز بدري',        appHours: 6.5, ordersCount: 15, appKm: 70,  gpsKm: 69,  carMoving: true },
  { driverName: 'عبدالإله وافي',    appHours: 10,  ordersCount: 31, appKm: 140, gpsKm: 198, carMoving: true },
  { driverName: 'رامي سر الختم',   appHours: 7,   ordersCount: 18, appKm: 82,  gpsKm: 88,  carMoving: false },
  { driverName: 'سامي أحمد',        appHours: 9,   ordersCount: 26, appKm: 115, gpsKm: 171, carMoving: true },
];

/** يحوّل CSV إلى صفوف — الأعمدة: الاسم، ساعات، طلبات، كم التطبيق، كم GPS، متحركة(1/0) */
function parseCsv(text: string): AuditRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const rows: AuditRow[] = [];
  // تخطّي سطر العناوين إذا لم يبدأ برقم في العمود الثاني
  const startIdx = /\d/.test(lines[0]?.split(',')[1] ?? '') ? 0 : 1;
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < 5) continue;
    rows.push({
      driverName: cols[0],
      appHours: parseFloat(cols[1]) || 0,
      ordersCount: parseInt(cols[2]) || 0,
      appKm: parseFloat(cols[3]) || 0,
      gpsKm: parseFloat(cols[4]) || 0,
      carMoving: cols[5] === '1' || cols[5]?.toLowerCase() === 'true' || cols[5] === 'نعم',
    });
  }
  return rows;
}

export function GpsOrdersAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [pricePerKm, setPricePerKm] = useState<number>(0.5);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const results = useMemo<AuditResult[]>(() => {
    return rows.map((row) => {
      const extraKm = Math.max(0, row.gpsKm - row.appKm);
      const flagged = extraKm > EXTRA_KM_THRESHOLD;
      return {
        ...row,
        extraKm,
        kmPerOrder: row.ordersCount > 0 ? row.gpsKm / row.ordersCount : 0,
        flagged,
        charge: flagged ? +(extraKm * pricePerKm).toFixed(2) : 0,
      };
    }).sort((a, b) => b.extraKm - a.extraKm);
  }, [rows, pricePerKm]);

  const flaggedResults = results.filter((r) => r.flagged);
  const totalCharges = flaggedResults.reduce((sum, r) => sum + r.charge, 0);
  const totalExtraKm = flaggedResults.reduce((sum, r) => sum + r.extraKm, 0);

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (!parsed.length) {
        toast.error('الملف فارغ أو التنسيق غير صحيح — الأعمدة المطلوبة: الاسم، الساعات، الطلبات، كم التطبيق، كم GPS، متحركة');
        return;
      }
      setRows(parsed);
      setFileName(file.name);
      toast.success(`تم تحليل ${parsed.length} مندوب من الملف`);
    } catch {
      toast.error('تعذر قراءة الملف');
    }
  };

  return (
    <section className="glass-panel p-6 space-y-6">
      {/* العنوان وأدوات الرفع */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            تدقيق GPS مقابل الطلبات
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ارفع ملف التشغيل من التطبيق لمقارنة مسافة GPS الفعلية بمسافة الطلبات — أي زيادة فوق {EXTRA_KM_THRESHOLD} كم تُحتسب
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
            aria-label="رفع ملف CSV من التطبيق"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button onClick={() => fileRef.current?.click()} className="press-effect gap-2">
            <FileUp className="h-4 w-4" /> رفع ملف من التطبيق
          </Button>
          <Button variant="outline" onClick={() => { setRows(DEMO_ROWS); setFileName('بيانات تجريبية'); }} className="press-effect gap-2">
            <FileSpreadsheet className="h-4 w-4" /> بيانات تجريبية
          </Button>
          {fileName && (
            <span className="glass-pill text-xs">
              {fileName}
              <button onClick={() => { setRows([]); setFileName(null); }} aria-label="مسح البيانات">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* سعر الكيلو الزائد */}
      <div className="flex flex-wrap items-end gap-4 rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
        <div className="space-y-1.5">
          <Label htmlFor="price-per-km" className="block text-right text-xs text-muted-foreground">
            سعر الكيلومتر الزائد (ريال)
          </Label>
          <Input
            id="price-per-km"
            type="number" min="0" step="0.05"
            value={pricePerKm}
            onChange={(e) => setPricePerKm(parseFloat(e.target.value) || 0)}
            className="w-32 text-right tabular-nums"
          />
        </div>
        {rows.length > 0 && (
          <div className="stagger-children flex flex-wrap gap-3">
            <div className="glass-pill gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              متجاوزون: <strong className="tabular-nums">{flaggedResults.length}</strong>
            </div>
            <div className="glass-pill gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-red-400" />
              إجمالي الزيادة: <strong className="tabular-nums">{totalExtraKm.toFixed(1)} كم</strong>
            </div>
            <div className="glass-pill gap-2 text-sm">
              <Receipt className="h-4 w-4 text-emerald-400" />
              إجمالي الرسوم: <strong className="tabular-nums">{totalCharges.toFixed(2)} ريال</strong>
            </div>
          </div>
        )}
      </div>

      {/* جدول النتائج */}
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-right">
            <thead>
              <tr className="border-b border-white/10 text-xs text-muted-foreground">
                <th className="px-3 py-3">المندوب</th>
                <th className="px-3 py-3"><Timer className="ml-1 inline h-3.5 w-3.5" />ساعات التطبيق</th>
                <th className="px-3 py-3">الطلبات</th>
                <th className="px-3 py-3">كم التطبيق</th>
                <th className="px-3 py-3"><MapPin className="ml-1 inline h-3.5 w-3.5" />كم GPS</th>
                <th className="px-3 py-3">كم/طلب</th>
                <th className="px-3 py-3">السيارة متحركة</th>
                <th className="px-3 py-3">الزيادة</th>
                <th className="px-3 py-3">الرسوم</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.driverName}
                  className={cn(
                    'row-hover border-b border-white/6',
                    r.flagged && 'bg-red-500/[0.06]',
                  )}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {r.flagged
                        ? <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" aria-label="تجاوز السقف" />
                        : <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-label="ضمن الحد" />}
                      <span className={cn('text-sm font-semibold', r.flagged ? 'text-red-300' : 'text-white')}>
                        {r.driverName}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">{r.appHours} س</td>
                  <td className="px-3 py-3 text-sm text-white tabular-nums">{r.ordersCount}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">{r.appKm} كم</td>
                  <td className="px-3 py-3 text-sm text-white tabular-nums">{r.gpsKm} كم</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">{r.kmPerOrder.toFixed(1)}</td>
                  <td className="px-3 py-3">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      r.carMoving ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-muted-foreground',
                    )}>
                      {r.carMoving ? 'نعم' : 'لا'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums',
                      r.flagged
                        ? 'bg-red-500/15 text-red-400'
                        : r.extraKm > 0
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-emerald-500/15 text-emerald-400',
                    )}>
                      {r.extraKm > 0 ? `+${r.extraKm.toFixed(1)} كم` : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold tabular-nums">
                    {r.charge > 0
                      ? <span className="text-red-300">{r.charge.toFixed(2)} ريال</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-white/10 py-12 text-muted-foreground">
          <FileSpreadsheet className="h-10 w-10 opacity-25" aria-hidden="true" />
          <p className="text-sm font-medium">لا توجد بيانات بعد</p>
          <p className="text-xs opacity-70 max-w-md text-center">
            ارفع ملف CSV بالأعمدة: اسم المندوب، ساعات التطبيق، عدد الطلبات، كم التطبيق، كم GPS، السيارة متحركة (1/0)
            — أو جرّب البيانات التجريبية
          </p>
        </div>
      )}

      {/* قائمة المتجاوزين */}
      {flaggedResults.length > 0 && (
        <div className="rounded-[20px] border border-red-500/20 bg-red-500/[0.05] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-red-300">
            <AlertTriangle className="h-4 w-4" />
            مناديب تجاوزوا حد الـ {EXTRA_KM_THRESHOLD} كم ({flaggedResults.length})
          </h3>
          <div className="stagger-children flex flex-wrap gap-2">
            {flaggedResults.map((r) => (
              <span key={r.driverName} className="rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300">
                {r.driverName} — زيادة {r.extraKm.toFixed(1)} كم = {r.charge.toFixed(2)} ريال
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
