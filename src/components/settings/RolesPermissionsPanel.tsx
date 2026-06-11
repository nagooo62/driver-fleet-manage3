import { useState } from 'react';
import {
  BadgeDollarSign, Check, Crown, Eye, ShieldCheck, UserCog, Users, X as XIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PERMISSIONS } from '@/lib/rbac';
import type { Permission, UserRole } from '@/types';

/** أسماء الأدوار بالعربي مع أيقونة ولون مميز */
const ROLE_META: Record<UserRole, { label: string; desc: string; icon: React.ElementType; cls: string }> = {
  admin: {
    label: 'المدير العام',
    desc: 'صلاحيات كاملة على كل النظام — إدارة المستخدمين والإعدادات',
    icon: Crown,
    cls: 'border-amber-500/40 bg-amber-500/[0.07] text-amber-400',
  },
  manager: {
    label: 'مدير التشغيل',
    desc: 'إدارة المناديب والسيارات والتقارير — بدون إدارة المستخدمين',
    icon: UserCog,
    cls: 'border-primary/40 bg-primary/[0.07] text-primary',
  },
  accountant: {
    label: 'المحاسب',
    desc: 'التقارير المالية والمطابقة والتصدير وسجل التدقيق',
    icon: BadgeDollarSign,
    cls: 'border-emerald-500/40 bg-emerald-500/[0.07] text-emerald-400',
  },
  employee: {
    label: 'المشرف',
    desc: 'عرض المناديب والسيارات والإشعارات — قراءة فقط',
    icon: Eye,
    cls: 'border-sky-500/40 bg-sky-500/[0.07] text-sky-400',
  },
};

/** أسماء الصلاحيات بالعربي */
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

/** خريطة الأدوار للصلاحيات — مطابقة لـ rbac.ts */
const ROLE_PERMS: Record<UserRole, Permission[]> = {
  admin: [...PERMISSIONS],
  manager: PERMISSIONS.filter((p) => !['users:manage', 'settings:write'].includes(p)),
  accountant: ['dashboard:read', 'drivers:read', 'cars:read', 'notifications:read', 'reports:read', 'reports:export', 'finance:read', 'audit:read'],
  employee: ['dashboard:read', 'drivers:read', 'cars:read', 'applications:read', 'notifications:read'],
};

const ROLE_ORDER: UserRole[] = ['admin', 'manager', 'accountant', 'employee'];

export function RolesPermissionsPanel() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const meta = ROLE_META[selectedRole];
  const activePerms = ROLE_PERMS[selectedRole];

  return (
    <section className="glass-panel p-6 space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <ShieldCheck className="h-5 w-5 text-primary" />
          الأدوار والصلاحيات
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          اختر دوراً لعرض صلاحياته — كل مستخدم في النظام يُسند له أحد هذه الأدوار
        </p>
      </div>

      {/* أزرار الأدوار */}
      <div className="stagger-children grid grid-cols-2 gap-3 lg:grid-cols-4" role="tablist" aria-label="أدوار النظام">
        {ROLE_ORDER.map((role) => {
          const m = ROLE_META[role];
          const Icon = m.icon;
          const isActive = selectedRole === role;
          return (
            <button
              key={role}
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedRole(role)}
              className={cn(
                'card-premium press-effect rounded-[20px] border p-4 text-right transition-colors',
                isActive ? m.cls : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]',
              )}
            >
              <Icon className="mb-2 h-6 w-6" aria-hidden="true" />
              <div className={cn('text-sm font-bold', isActive ? '' : 'text-white')}>{m.label}</div>
              <div className="mt-1 text-[11px] leading-5 opacity-70">{m.desc}</div>
            </button>
          );
        })}
      </div>

      {/* مصفوفة الصلاحيات للدور المحدد */}
      <div className={cn('rounded-[20px] border p-5', meta.cls.replace('text-', 'border-').split(' ')[0], 'bg-white/[0.02]')}>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
          <meta.icon className={cn('h-4 w-4', meta.cls.split(' ').pop())} />
          صلاحيات {meta.label} ({activePerms.length} من {PERMISSIONS.length})
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PERMISSIONS.map((perm) => {
            const granted = activePerms.includes(perm);
            return (
              <div
                key={perm}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-[14px] border px-3 py-2.5 text-xs',
                  granted
                    ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-white'
                    : 'border-white/6 bg-white/[0.02] text-muted-foreground opacity-60',
                )}
              >
                <span>{PERMISSION_LABELS[perm]}</span>
                {granted
                  ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-label="مسموح" />
                  : <XIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="غير مسموح" />}
              </div>
            );
          })}
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        لإسناد دور لمستخدم: افتح إدارة المستخدمين من قائمة الحساب (متاح للمدير العام فقط)
      </p>
    </section>
  );
}
