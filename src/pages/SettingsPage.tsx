import { useQuery } from '@tanstack/react-query';
import { Building2, ServerCog, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE, getDemoCompanySettings } from '@/lib/demoMode';
import { PERMISSIONS, usePermissions } from '@/lib/rbac';
import { useProfile } from '@/hooks/useProfile';

export default function SettingsPage() {
  const { data: profile } = useProfile();
  const { permissions } = usePermissions();

  const { data: company } = useQuery({
    queryKey: ['company-settings', 'settings-page'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (DEMO_MODE) {
        return getDemoCompanySettings();
      }

      const { data, error } = await supabase.from('company_settings').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="الحوكمة والاستعداد التشغيلي"
        title="الإعدادات والحوكمة"
        description="مساحة مهيأة لإدارة RBAC، تعريف الشركة، والاستعدادات البنيوية لـ GPS وAI والمالية داخل منصة SaaS-ready."
        aside={<div className="glass-pill">الدور الحالي: {profile?.role ?? 'employee'}</div>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel p-6">
          <div className="mb-5 flex items-center gap-2 text-white">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">بيانات الشركة</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs text-muted-foreground">الاسم التجاري</div>
              <div className="mt-2 text-sm font-semibold text-white">{company?.company_name ?? 'روائس'}</div>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs text-muted-foreground">الاسم القانوني</div>
              <div className="mt-2 text-sm font-semibold text-white">{company?.legal_name ?? '—'}</div>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs text-muted-foreground">البريد الرسمي</div>
              <div className="mt-2 text-sm font-semibold text-white">{company?.official_email ?? '—'}</div>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-xs text-muted-foreground">الموقع الرئيسي</div>
              <div className="mt-2 text-sm font-semibold text-white">{company?.headquarters_location ?? '—'}</div>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 sm:col-span-2">
              <div className="text-xs text-muted-foreground">أرقام التواصل</div>
              <div className="mt-2 text-sm font-semibold text-white">{company?.phone_numbers?.join(' • ') || '—'}</div>
            </div>
          </div>
        </section>

        <section className="glass-panel p-6">
          <div className="mb-5 flex items-center gap-2 text-white">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <h2 className="text-2xl font-semibold">RBAC groundwork</h2>
          </div>
          <div className="mb-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm text-muted-foreground">
            الصلاحيات الحالية للمستخدم تُجمع من الدور الأساسي + أي منح إضافية من جدول user_permissions.
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {PERMISSIONS.map((permission) => (
              <div key={permission} className={`rounded-2xl border px-3 py-2 text-sm ${permissions.includes(permission) ? 'border-primary/30 bg-primary/10 text-white' : 'border-white/8 bg-white/[0.03] text-muted-foreground'}`}>
                {permission}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="glass-panel p-6">
        <div className="mb-5 flex items-center gap-2 text-white">
          <ServerCog className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">SaaS-ready architecture</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {[
            { title: 'Tenant-friendly routing', icon: ServerCog },
            { title: 'GPS integration ready', icon: Sparkles },
            { title: 'AI analytics ready', icon: Sparkles },
            { title: 'Finance reconciliation ready', icon: Wallet },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-right">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-white">{item.title}</div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  جاهز كطبقة بنيوية في الواجهة والتوجيه والأنواع وقابل للربط مع مصادر البيانات اللاحقة.
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
