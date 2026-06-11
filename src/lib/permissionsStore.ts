import type { Permission, UserRole } from '@/types';

/**
 * مخزن الصلاحيات القابلة للتعديل:
 * - تعديلات الأدوار: منح/سحب صلاحية لدور كامل (كل المشرفين مثلاً)
 * - تعديلات المستخدمين: منح/سحب صلاحية لشخص محدد فوق صلاحيات دوره
 * عند أي تغيير يُبث حدث 'rawaes-permissions-changed' لتحديث الواجهة فوراً.
 */

export interface PermOverride {
  granted: Permission[];
  revoked: Permission[];
}

const ROLE_KEY = 'rawaes-role-overrides';
const USER_KEY = 'rawaes-user-overrides';
export const PERMISSIONS_CHANGED_EVENT = 'rawaes-permissions-changed';

type RoleOverrides = Partial<Record<UserRole, PermOverride>>;
type UserOverrides = Record<string, PermOverride>;   // المفتاح: البريد الإلكتروني

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? '') as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(PERMISSIONS_CHANGED_EVENT));
}

/* ─── تعديلات الأدوار ─── */
export function getRoleOverrides(): RoleOverrides {
  return read<RoleOverrides>(ROLE_KEY, {});
}

export function toggleRolePermission(role: UserRole, permission: Permission, basePerms: Permission[]) {
  const all = getRoleOverrides();
  const ov: PermOverride = all[role] ?? { granted: [], revoked: [] };
  const baseHas = basePerms.includes(permission);
  const currentlyOn = effectiveHas(baseHas, ov, permission);

  // عكس الحالة الحالية مع تنظيف القوائم
  ov.granted = ov.granted.filter((p) => p !== permission);
  ov.revoked = ov.revoked.filter((p) => p !== permission);
  if (currentlyOn && baseHas) ov.revoked.push(permission);
  else if (!currentlyOn && !baseHas) ov.granted.push(permission);

  all[role] = ov;
  write(ROLE_KEY, all);
}

export function resetRoleOverrides(role: UserRole) {
  const all = getRoleOverrides();
  delete all[role];
  write(ROLE_KEY, all);
}

/* ─── تعديلات المستخدمين ─── */
export function getUserOverrides(): UserOverrides {
  return read<UserOverrides>(USER_KEY, {});
}

export function toggleUserPermission(email: string, permission: Permission, rolePerms: Permission[]) {
  const all = getUserOverrides();
  const ov: PermOverride = all[email] ?? { granted: [], revoked: [] };
  const baseHas = rolePerms.includes(permission);
  const currentlyOn = effectiveHas(baseHas, ov, permission);

  ov.granted = ov.granted.filter((p) => p !== permission);
  ov.revoked = ov.revoked.filter((p) => p !== permission);
  if (currentlyOn && baseHas) ov.revoked.push(permission);
  else if (!currentlyOn && !baseHas) ov.granted.push(permission);

  all[email] = ov;
  write(USER_KEY, all);
}

export function resetUserOverrides(email: string) {
  const all = getUserOverrides();
  delete all[email];
  write(USER_KEY, all);
}

/* ─── الحساب الفعلي ─── */
function effectiveHas(baseHas: boolean, ov: PermOverride, permission: Permission): boolean {
  if (ov.revoked.includes(permission)) return false;
  if (ov.granted.includes(permission)) return true;
  return baseHas;
}

/** صلاحيات الدور بعد تطبيق تعديلاته */
export function applyRoleOverrides(role: UserRole, basePerms: Permission[]): Permission[] {
  const ov = getRoleOverrides()[role];
  if (!ov) return basePerms;
  return [
    ...basePerms.filter((p) => !ov.revoked.includes(p)),
    ...ov.granted.filter((p) => !basePerms.includes(p)),
  ];
}

/** الصلاحيات النهائية لمستخدم: دور معدّل + تعديلات شخصية */
export function resolveUserPermissions(email: string, role: UserRole, basePerms: Permission[]): Permission[] {
  const afterRole = applyRoleOverrides(role, basePerms);
  const ov = getUserOverrides()[email];
  if (!ov) return afterRole;
  return [
    ...afterRole.filter((p) => !ov.revoked.includes(p)),
    ...ov.granted.filter((p) => !afterRole.includes(p)),
  ];
}

/* ─── مستخدمو النظام (للوضع التجريبي) ─── */
export interface ManagedUser {
  email: string;
  name: string;
  role: UserRole;
}

const USERS_KEY = 'rawaes-managed-users';

const DEFAULT_USERS: ManagedUser[] = [
  { email: 'admin@rawaes.local',      name: 'المدير العام',  role: 'admin' },
  { email: 'ops@rawaes.local',        name: 'مدير التشغيل',  role: 'manager' },
  { email: 'accountant@rawaes.local', name: 'المحاسب',       role: 'accountant' },
  { email: 'supervisor1@rawaes.local', name: 'المشرف الأول', role: 'employee' },
  { email: 'supervisor2@rawaes.local', name: 'المشرف الثاني', role: 'employee' },
];

export function getManagedUsers(): ManagedUser[] {
  const users = read<ManagedUser[]>(USERS_KEY, DEFAULT_USERS);
  if (!read<ManagedUser[] | null>(USERS_KEY, null)) write(USERS_KEY, users);
  return users;
}

export function addManagedUser(user: ManagedUser) {
  const users = getManagedUsers().filter((u) => u.email !== user.email);
  users.push(user);
  write(USERS_KEY, users);
}
