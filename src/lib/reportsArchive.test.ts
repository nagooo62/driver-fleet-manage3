import { beforeEach, describe, expect, it } from 'vitest';
import {
  deleteReport, getReport, listReports, saveReport, searchReports,
  type ReportRow,
} from './reportsArchive';

const row = (overrides: Partial<ReportRow> = {}): ReportRow => ({
  repId: '361488',
  name: 'احمد خيرى',
  orders: 20,
  hours: 8,
  achievedPct: 133,
  status: 'achieved',
  ...overrides,
});

const baseReport = (date: string, app: 'toyou' | 'jahez' = 'toyou') => ({
  app,
  reportDate: date,
  target: 15,
  fileName: 'perf.xlsx',
  rows: [row()],
  summary: { totalDrivers: 1, totalOrders: 20, totalHours: 8, achievedCount: 1, stoppedCount: 0, avgOrders: 20 },
});

describe('reportsArchive', () => {
  beforeEach(() => localStorage.clear());

  it('يحفظ تقريراً ويعيده بالقائمة', () => {
    saveReport(baseReport('2026-06-10'));
    const all = listReports();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('toyou-2026-06-10');
    expect(all[0].rows[0].name).toBe('احمد خيرى');
  });

  it('تقرير واحد لكل يوم لكل تطبيق — الحفظ الثاني يستبدل الأول', () => {
    saveReport(baseReport('2026-06-10'));
    saveReport({ ...baseReport('2026-06-10'), target: 20 });
    const all = listReports();
    expect(all).toHaveLength(1);
    expect(all[0].target).toBe(20);
  });

  it('نفس اليوم لتطبيقين مختلفين = تقريران منفصلان', () => {
    saveReport(baseReport('2026-06-10', 'toyou'));
    saveReport(baseReport('2026-06-10', 'jahez'));
    expect(listReports()).toHaveLength(2);
  });

  it('القائمة مرتبة من الأحدث للأقدم', () => {
    saveReport(baseReport('2026-06-08'));
    saveReport(baseReport('2026-06-11'));
    saveReport(baseReport('2026-06-09'));
    expect(listReports().map((r) => r.reportDate)).toEqual(['2026-06-11', '2026-06-09', '2026-06-08']);
  });

  it('البحث بتاريخ جزئي وباسم مندوب', () => {
    saveReport(baseReport('2026-06-10'));
    saveReport(baseReport('2026-05-01'));
    expect(searchReports('2026-06')).toHaveLength(1);
    expect(searchReports('احمد خيرى')).toHaveLength(2);
    expect(searchReports('غير موجود')).toHaveLength(0);
  });

  it('الحذف يزيل التقرير المحدد فقط', () => {
    saveReport(baseReport('2026-06-10'));
    saveReport(baseReport('2026-06-11'));
    deleteReport('toyou-2026-06-10');
    expect(listReports()).toHaveLength(1);
    expect(getReport('toyou-2026-06-10')).toBeUndefined();
    expect(getReport('toyou-2026-06-11')).toBeDefined();
  });
});
