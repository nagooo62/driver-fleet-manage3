import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyRoleOverrides, getManagedUsers, resetRoleOverrides, resetUserOverrides,
  resolveUserPermissions, toggleRolePermission, toggleUserPermission,
} from './permissionsStore';
import type { Permission } from '@/types';

const BASE: Permission[] = ['dashboard:read', 'drivers:read', 'cars:read'];

describe('permissionsStore', () => {
  beforeEach(() => localStorage.clear());

  it('بدون تعديلات: صلاحيات الدور كما هي', () => {
    expect(applyRoleOverrides('employee', BASE)).toEqual(BASE);
  });

  it('منح صلاحية جديدة لدور', () => {
    toggleRolePermission('employee', 'reports:export', BASE);
    expect(applyRoleOverrides('employee', BASE)).toContain('reports:export');
  });

  it('سحب صلاحية موجودة من دور', () => {
    toggleRolePermission('employee', 'cars:read', BASE);
    expect(applyRoleOverrides('employee', BASE)).not.toContain('cars:read');
  });

  it('التبديل مرتين يعيد الوضع الأصلي', () => {
    toggleRolePermission('employee', 'reports:export', BASE);
    toggleRolePermission('employee', 'reports:export', BASE);
    expect(applyRoleOverrides('employee', BASE)).toEqual(BASE);
  });

  it('استعادة الافتراضي تمسح كل تعديلات الدور', () => {
    toggleRolePermission('employee', 'reports:export', BASE);
    toggleRolePermission('employee', 'cars:read', BASE);
    resetRoleOverrides('employee');
    expect(applyRoleOverrides('employee', BASE)).toEqual(BASE);
  });

  it('تخصيص مستخدم يتفوق على دوره — مشرف 2 فقط يحصل على GPS', () => {
    const sup1 = 'supervisor1@rawaes.local';
    const sup2 = 'supervisor2@rawaes.local';
    toggleUserPermission(sup2, 'gps:read', BASE);

    expect(resolveUserPermissions(sup2, 'employee', BASE)).toContain('gps:read');
    expect(resolveUserPermissions(sup1, 'employee', BASE)).not.toContain('gps:read');
  });

  it('سحب صلاحية من مستخدم محدد دون بقية الدور', () => {
    const sup1 = 'supervisor1@rawaes.local';
    toggleUserPermission(sup1, 'cars:read', BASE);
    expect(resolveUserPermissions(sup1, 'employee', BASE)).not.toContain('cars:read');
    expect(applyRoleOverrides('employee', BASE)).toContain('cars:read');
  });

  it('إزالة تخصيصات مستخدم تعيده لصلاحيات دوره', () => {
    const sup2 = 'supervisor2@rawaes.local';
    toggleUserPermission(sup2, 'gps:read', BASE);
    resetUserOverrides(sup2);
    expect(resolveUserPermissions(sup2, 'employee', BASE)).toEqual(BASE);
  });

  it('قائمة المستخدمين المُدارين تحتوي المدير العام والمشرفين', () => {
    const users = getManagedUsers();
    expect(users.some((u) => u.role === 'admin')).toBe(true);
    expect(users.filter((u) => u.role === 'employee').length).toBeGreaterThanOrEqual(2);
  });
});
