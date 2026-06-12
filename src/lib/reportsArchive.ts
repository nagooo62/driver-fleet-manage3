/**
 * أرشيف تقارير التطبيقات — تخزين محلي مع بحث بالتاريخ.
 * كل تقرير يُحفظ بتاريخه ويمكن فتحه أو تصديره لاحقاً.
 */

export interface ReportRow {
  repId: string;
  name: string;
  nameEn?: string;
  orders: number;
  hours: number;
  phone?: string | null;
  city?: string | null;
  achievedPct: number;   // نسبة تحقيق التارقت
  status: 'achieved' | 'near' | 'below' | 'stopped';
}

export interface SavedReport {
  id: string;
  app: 'toyou' | 'hungerstation' | 'jahez' | 'keeta' | 'chefz';
  reportDate: string;     // YYYY-MM-DD — تاريخ التقرير نفسه
  savedAt: string;        // وقت الحفظ
  target: number;
  fileName: string;
  rows: ReportRow[];
  summary: {
    totalDrivers: number;
    totalOrders: number;
    totalHours: number;
    achievedCount: number;
    stoppedCount: number;
    avgOrders: number;
  };
  /** اعتماد التقرير: المعتمد فقط يدخل في الأسبوعي والشهري والرواتب */
  approved?: boolean;
  approvedAt?: string;
}

const KEY = 'rawaes-reports-archive';

function readAll(): SavedReport[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as SavedReport[];
  } catch {
    return [];
  }
}

function writeAll(reports: SavedReport[]) {
  window.localStorage.setItem(KEY, JSON.stringify(reports));
}

export function listReports(): SavedReport[] {
  return readAll().sort((a, b) => b.reportDate.localeCompare(a.reportDate));
}

export function getReport(id: string): SavedReport | undefined {
  return readAll().find((r) => r.id === id);
}

/** يحفظ تقرير جديد — لو وُجد تقرير لنفس التطبيق ونفس التاريخ يستبدله */
export function saveReport(report: Omit<SavedReport, 'id' | 'savedAt'>): SavedReport {
  const all = readAll();
  const id = `${report.app}-${report.reportDate}`;
  const saved: SavedReport = { ...report, id, savedAt: new Date().toISOString() };
  const idx = all.findIndex((r) => r.id === id);
  if (idx >= 0) all[idx] = saved;
  else all.push(saved);
  writeAll(all);
  return saved;
}

export function deleteReport(id: string) {
  writeAll(readAll().filter((r) => r.id !== id));
}

/** التقارير المعتمدة فقط — التقارير القديمة بلا علامة تُعد معتمدة */
export function listApprovedReports(): SavedReport[] {
  return listReports().filter((r) => r.approved !== false);
}

/** اعتماد تقرير محفوظ */
export function approveReport(id: string): SavedReport | undefined {
  const all = readAll();
  const report = all.find((r) => r.id === id);
  if (!report) return undefined;
  report.approved = true;
  report.approvedAt = new Date().toISOString();
  writeAll(all);
  return report;
}

/** تجميع أسبوعي/شهري: مجموع طلبات وساعات وأيام كل مندوب عبر تقارير معتمدة */
export interface DriverAggregate {
  repId: string;
  name: string;
  phone?: string | null;
  days: number;          // عدد الأيام التي ظهر فيها
  orders: number;
  hours: number;
  targetTotal: number;   // مجموع التارقت للأيام التي ظهر فيها
  diff: number;          // الطلبات - التارقت الإجمالي (+ فوق الهدف / - تحته)
  achievedPct: number;
}

export function aggregateReports(reports: SavedReport[]): DriverAggregate[] {
  const map = new Map<string, DriverAggregate>();
  for (const report of reports) {
    for (const row of report.rows) {
      const entry = map.get(row.repId) ?? {
        repId: row.repId, name: row.name, phone: row.phone,
        days: 0, orders: 0, hours: 0, targetTotal: 0, diff: 0, achievedPct: 0,
      };
      entry.days += 1;
      entry.orders += row.orders;
      entry.hours = +(entry.hours + row.hours).toFixed(1);
      entry.targetTotal += report.target;
      map.set(row.repId, entry);
    }
  }
  return [...map.values()].map((e) => ({
    ...e,
    diff: e.orders - e.targetTotal,
    achievedPct: e.targetTotal > 0 ? Math.round((e.orders / e.targetTotal) * 100) : 0,
  })).sort((a, b) => b.diff - a.diff);
}

/** بحث بالتاريخ (كامل أو جزئي مثل 2026-06) أو باسم مندوب داخل التقرير */
export function searchReports(query: string): SavedReport[] {
  const q = query.trim();
  if (!q) return listReports();
  return listReports().filter((r) =>
    r.reportDate.includes(q) ||
    r.fileName.includes(q) ||
    r.rows.some((row) => row.name.includes(q)),
  );
}
