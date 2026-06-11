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
