import { useEffect, useState } from 'react';
import {
  BadgeDollarSign, Check, Crown, Eye, RotateCcw, ShieldCheck, UserCog, UserRound, Users, X as XIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PERMISSIONS, ROLE_PERMISSION_MAP, usePermissions } from '@/lib/rbac';
import {
  PERMISSIONS_CHANGED_EVENT,
  applyRoleOverrides, getManagedUsers, resetRoleOverrides, resetUserOverrides,
  resolveUserPermissions, toggleRolePermission, toggleUserPermission,
  type ManagedUser,
} from '@/lib/permissionsStore';
import type { Permission, UserRole } from '@/types';

const ROLE_META: Record<UserRole, { label: string; desc: string; icon: React.ElementType; cls: string }> = {
  admin: {
    label: 'المدير العام',
    desc: 'صلاحيات كاملة على كل النظام',
    icon: Crown,
    cls: 'border-amber-500/40 bg-amber-500/[0.07] text-amber-400',
  },
  manager: {
    label: 'مدير التشغيل',
    desc: 'إدارة المناديب والسيارات والتقارير',
    icon: UserCog,
    cls: 'border-primary/40 bg-primary/[0.07] text-primary',
  },
  accountant: {
    label: 'المحاسب',
    desc: 'التقارير المالية والمطابقة والتدقيق',
    icon: BadgeDollarSign,
    cls: 'border-emerald-500/40 bg-emerald-500/[0.07] text-emerald-400',
  },
  employee: {
    label: 'المشرف',
    desc: 'عرض المناديب والسيارات والإشعارات',
    icon: Eye,
    cls: 'border-sky-500/40 bg-sky-500/[0.07] text-sky-400',
  },
};

const PERMISSION_LABELS: Record<Permission, string> = {
  'dashboard:read': 'عرض لوحة القيادة',
  'drivers:read': 'عرض المناديب',
  'drivers:write': 'إضافة وتعديل المناديب',
  'drivers:archive': 'أرشفة المناديب',
  'cars:read': 'عرض السيارات',
  'cars:write': 'إضافة وتعديل السيارات',
  'applications:read': 'عرض التطبيقات',
  'notifications:read': 'عرض الإشعارات',
  'notifications:write': 'إدارة الإشعارات',
  'reports:read': 'عرض التقارير',
  'reports:export': 'تصدير التقارير',
  'audit:read': 'سجل التدقيق',
  'settings:read': 'عرض الإعدادات',
  'settings:write': 'تعديل الإعدادات',
  'users:manage': 'إدارة المستخدمين',
  'gps:read': 'تتبع GPS',
  'ai:read': 'التحليل الذكي',
  'finance:read': 'المالية والمطابقة',
};

const ROLE_ORDER: UserRole[] = ['admin', 'manager', 'accountant', 'employee'];

export function RolesPermissionsPanel() {
  const { can } = usePermissions();
  const canManage = can('users:manage');
  const [mode, setMode] = useState<'roles' | 'users'>('roles');
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener(PERMISSIONS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(PERMISSIONS_CHANGED_EVENT, handler);
  }, []);

  void version; // يعيد الرسم عند كل تغيير

  const users = getManagedUsers();
  const meta = ROLE_META[selectedRole];

  /* الصلاحيات الفعلية حسب الوضع المختار */
  const basePerms = ROLE_PERMISSION_MAP[selectedRole];
  const roleEffective = applyRoleOverrides(selectedRole, basePerms);
  const userEffective = selectedUser
    ? resolveUserPermissions(selectedUser.email, selectedUser.role, ROLE_PERMISSION_MAP[selectedUser.role])
    : [];

  const activePerms = mode === 'roles' ? roleEffective : userEffective;

  const handleToggle = (perm: Permission) => {
    if (!canManage) { toast.error('تعديل الصلاحيات متاح للمدير العام فقط'); return; }
    if (mode === 'roles') {
      if (selectedRole === 'admin' && perm === 'users:manage') {
        toast.error('لا يمكن سحب إدارة المستخدمين من المدير العام');
        return;
      }
      toggleRolePermission(selectedRole, perm, basePerms);
      toast.success(`تم تحديث صلاحيات ${meta.label}`);
    } else if (selectedUser) {
      toggleUserPermission(selectedUser.email, perm, applyRoleOverrides(selectedUser.role, ROLE_PERMISSION_MAP[selectedUser.role]));
      toast.success(`تم تحديث صلاحيات ${selectedUser.name}`);
    }
  };

  const handleReset = () => {
    if (!canManage) return;
    if (mode === 'roles') {
      resetRoleOverrides(selectedRole);
      toast.success(`تمت استعادة الصلاحيات الافتراضية لـ${meta.label}`);
    } else if (selectedUser) {
      resetUserOverrides(selectedUser.email);
      toast.success(`تمت إزالة التخصيصات عن ${selectedUser.name}`);
    }
  };

  return (
    <section className="glass-panel space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <ShieldCheck className="h-5 w-5 text-primary" />
            الأدوار والصلاحيات
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManage
              ? 'اضغط على أي صلاحية لتفعيلها أو إلغائها — التغيير يسري فوراً'
              : 'عرض فقط — تعديل الصلاحيات متاح للمدير العام'}
          </p>
        </div>
        {/* تبديل: أدوار عامة / مستخدمون محددون */}
        <div className="flex rounded-full bg-white/5 p-1" role="tablist" aria-label="نوع التخصيص">
          <button role="tab" aria-selected={mode === 'roles'}
            onClick={() => setMode('roles')}
            className={cn('press-effect rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
              mode === 'roles' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
            صلاحيات عامة (أدوار)
          </button>
          <button role="tab" aria-selected={mode === 'users'}
            onClick={() => setMode('users')}
            className={cn('press-effect rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
              mode === 'users' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
            مخصصة لمستخدم
          </button>
        </div>
      </div>

      {mode === 'roles' ? (
        /* ─── اختيار الدور ─── */
        <div className="stagger-children grid grid-cols-2 gap-3 lg:grid-cols-4" role="tablist" aria-label="أدوار النظام">
          {ROLE_ORDER.map((role) => {
            const m = ROLE_META[role];
            const Icon = m.icon;
            const isActive = selectedRole === role;
            return (
              <button key={role} role="tab" aria-selected={isActive}
                onClick={() => setSelectedRole(role)}
                className={cn(
                  'card-premium press-effect rounded-[20px] border p-4 text-right transition-colors',
                  isActive ? m.cls : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]',
                )}>
                <Icon className="mb-2 h-6 w-6" aria-hidden="true" />
                <div className={cn('text-sm font-bold', isActive ? '' : 'text-white')}>{m.label}</div>
                <div className="mt-1 text-[11px] leading-5 opacity-70">{m.desc}</div>
              </button>
            );
          })}
        </div>
      ) : (
        /* ─── اختيار المستخدم ─── */
        <div className="stagger-children grid grid-cols-2 gap-3 lg:grid-cols-5" role="tablist" aria-label="مستخدمو النظام">
          {users.map((u) => {
            const m = ROLE_META[u.role];
            const isActive = selectedUser?.email === u.email;
            return (
              <button key={u.email} role="tab" aria-selected={isActive}
                onClick={() => setSelectedUser(u)}
                className={cn(
                  'card-premium press-effect rounded-[20px] border p-4 text-right transition-colors',
                  isActive ? m.cls : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]',
                )}>
                <UserRound className="mb-2 h-5 w-5" aria-hidden="true" />
                <div className={cn('text-sm font-bold', isActive ? '' : 'text-white')}>{u.name}</div>
                <div className="mt-1 text-[11px] opacity-70">{m.label}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── مصفوفة الصلاحيات التفاعلية ─── */}
      {(mode === 'roles' || selectedUser) && (
        <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              {mode === 'roles'
                ? <><meta.icon className={cn('h-4 w-4', meta.cls.split(' ').pop())} /> صلاحيات {meta.label}</>
                : <><UserRound className="h-4 w-4 text-primary" /> صلاحيات {selectedUser!.name} <span className="text-xs font-normal text-muted-foreground">(دور: {ROLE_META[selectedUser!.role].label})</span></>}
              <span className="text-xs font-normal text-muted-foreground">({activePerms.length} من {PERMISSIONS.length})</span>
            </h3>
            {canManage && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="press-effect gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="h-3 w-3" /> استعادة الافتراضي
              </Button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PERMISSIONS.map((perm) => {
              const granted = activePerms.includes(perm);
              return (
                <button
                  key={perm}
                  onClick={() => handleToggle(perm)}
                  disabled={!canManage}
                  aria-pressed={granted}
                  aria-label={`${PERMISSION_LABELS[perm]} — ${granted ? 'مفعّلة' : 'معطّلة'}`}
                  className={cn(
                    'press-effect flex items-center justify-between gap-2 rounded-[14px] border px-3 py-2.5 text-right text-xs transition-colors',
                    granted
                      ? 'border-emerald-500/25 bg-emerald-500/[0.07] text-white'
                      : 'border-white/8 bg-white/[0.02] text-muted-foreground opacity-70',
                    canManage && 'cursor-pointer hover:border-primary/40 hover:opacity-100',
                  )}
                >
                  <span>{PERMISSION_LABELS[perm]}</span>
                  {granted
                    ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                    : <XIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === 'users' && !selectedUser && (
        <p className="py-4 text-center text-sm text-muted-foreground">اختر مستخدماً لعرض وتعديل صلاحياته الشخصية</p>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        الصلاحيات المخصصة لمستخدم تتفوق على صلاحيات دوره — مثلاً: امنح المشرف الثاني "تصدير التقارير" دون بقية المشرفين
      </p>
    </section>
  );
}
