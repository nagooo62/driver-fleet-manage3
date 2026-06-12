import { beforeEach, describe, expect, it } from 'vitest';
import {
  aggregateReports, approveReport, deleteReport, getReport,
  listApprovedReports, listReports, saveReport, searchReports,
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

describe('الاعتماد والتجميع الأسبوعي/الشهري', () => {
  beforeEach(() => localStorage.clear());

  it('غير المعتمد لا يدخل في قائمة المعتمدة', () => {
    saveReport({ ...baseReport('2026-06-10'), approved: false });
    saveReport({ ...baseReport('2026-06-11'), approved: true });
    const approved = listApprovedReports();
    expect(approved).toHaveLength(1);
    expect(approved[0].reportDate).toBe('2026-06-11');
  });

  it('approveReport يحول التقرير لمعتمد مع وقت الاعتماد', () => {
    saveReport({ ...baseReport('2026-06-10'), approved: false });
    const approved = approveReport('toyou-2026-06-10');
    expect(approved?.approved).toBe(true);
    expect(approved?.approvedAt).toBeDefined();
    expect(listApprovedReports()).toHaveLength(1);
  });

  it('التجميع: يجمع طلبات وأيام المندوب عبر عدة تقارير ويحسب الفرق عن التارقت', () => {
    // يومان: المندوب جاب 20 ثم 8 — التارقت 15 يومياً
    saveReport({ ...baseReport('2026-06-10'), approved: true, rows: [row({ orders: 20 })] });
    saveReport({ ...baseReport('2026-06-11'), approved: true, rows: [row({ orders: 8 })] });
    const agg = aggregateReports(listApprovedReports());
    expect(agg).toHaveLength(1);
    expect(agg[0].days).toBe(2);
    expect(agg[0].orders).toBe(28);
    expect(agg[0].targetTotal).toBe(30);
    expect(agg[0].diff).toBe(-2);          // 28 - 30 = تحت الهدف بطلبين
    expect(agg[0].achievedPct).toBe(93);
  });

  it('التجميع يرتب تنازلياً بالفرق — المتفوق أولاً', () => {
    saveReport({
      ...baseReport('2026-06-10'), approved: true,
      rows: [row({ repId: 'A', name: 'متفوق', orders: 30 }), row({ repId: 'B', name: 'متأخر', orders: 5 })],
    });
    const agg = aggregateReports(listApprovedReports());
    expect(agg[0].name).toBe('متفوق');
    expect(agg[0].diff).toBe(15);
    expect(agg[1].diff).toBe(-10);
  });
});
