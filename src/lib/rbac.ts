import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS_CHANGED_EVENT, resolveUserPermissions } from '@/lib/permissionsStore';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_MODE, getDemoProfile, getDemoRole } from '@/lib/demoMode';
import { supabase } from '@/integrations/supabase/client';
import type { Permission, Profile, UserPermissionRow, UserRole } from '@/types';

export const PERMISSIONS: Permission[] = [
  'dashboard:read',
  'drivers:read',
  'drivers:write',
  'drivers:archive',
  'cars:read',
  'cars:write',
  'applications:read',
  'notifications:read',
  'notifications:write',
  'reports:read',
  'reports:export',
  'audit:read',
  'settings:read',
  'settings:write',
  'users:manage',
  'gps:read',
  'ai:read',
  'finance:read',
];

export const ROLE_PERMISSION_MAP: Record<UserRole, Permission[]> = {
  admin: [...PERMISSIONS],
  manager: [
    'dashboard:read',
    'drivers:read',
    'drivers:write',
    'drivers:archive',
    'cars:read',
    'cars:write',
    'applications:read',
    'notifications:read',
    'notifications:write',
    'reports:read',
    'reports:export',
    'audit:read',
    'settings:read',
    'gps:read',
    'ai:read',
    'finance:read',
  ],
  employee: [
    'dashboard:read',
    'drivers:read',
    'cars:read',
    'applications:read',
    'notifications:read',
  ],
  accountant: [
    'dashboard:read',
    'drivers:read',
    'cars:read',
    'notifications:read',
    'reports:read',
    'reports:export',
    'finance:read',
    'audit:read',
  ],
};

const toPermissionKey = (row: UserPermissionRow): Permission | null => {
  const key = `${row.resource}:${row.permission}` as Permission;
  return PERMISSIONS.includes(key) ? key : null;
};

export const canDo = (
  role: UserRole | null | undefined,
  permission: Permission,
  customPermissions: Permission[] = []
): boolean => {
  if (!role) return false;
  return ROLE_PERMISSION_MAP[role].includes(permission) || customPermissions.includes(permission);
};

export function usePermissions() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['rbac', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (DEMO_MODE) {
        return {
          role: getDemoRole(),
          profile: getDemoProfile(),
          customPermissions: [] as Permission[],
        };
      }

      const [profileResult, permissionsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle(),
        supabase.from('user_permissions').select('*').eq('user_id', user!.id),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (permissionsResult.error) throw permissionsResult.error;

      const profile = (profileResult.data as Profile | null) ?? null;
      const customPermissions = ((permissionsResult.data ?? []) as UserPermissionRow[])
        .map(toPermissionKey)
        .filter((permission): permission is Permission => Boolean(permission));

      return {
        role: (profile?.role ?? 'employee') as UserRole,
        profile,
        customPermissions,
      };
    },
  });

  // إعادة الحساب فوراً عند تعديل الصلاحيات من لوحة الإعدادات
  const [overridesVersion, setOverridesVersion] = useState(0);
  useEffect(() => {
    const handler = () => setOverridesVersion((v) => v + 1);
    window.addEventListener(PERMISSIONS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(PERMISSIONS_CHANGED_EVENT, handler);
  }, []);

  const permissions = useMemo(() => {
    void overridesVersion;
    const role = query.data?.role;
    if (!role) return [] as Permission[];
    const base = Array.from(new Set([...ROLE_PERMISSION_MAP[role], ...(query.data?.customPermissions ?? [])]));
    // تطبيق تعديلات الدور والمستخدم المخزنة (تشمل الوضع التجريبي والإنتاج)
    return resolveUserPermissions(user?.email ?? '', role, base);
  }, [query.data?.customPermissions, query.data?.role, user?.email, overridesVersion]);

  return {
    role: query.data?.role ?? null,
    profile: query.data?.profile ?? null,
    permissions,
    customPermissions: query.data?.customPermissions ?? [],
    can: (permission: Permission) => permissions.includes(permission),
    loading: query.isLoading,
  };
}

interface PermissionGuardProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
  const { can, loading } = usePermissions();

  if (loading) return null;

  return can(permission) ? children : fallback;
}
