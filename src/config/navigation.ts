import {
  Activity,
  Bot,
  CarFront,
  ChartColumnBig,
  LayoutDashboard,
  MapPin,
  Route,
  Settings,
  Shield,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/types';

export interface NavigationItem {
  href: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  permission: Permission;
}

export interface AppCatalogItem {
  slug: string;
  label: string;
  shortLabel: string;
  accentClass: string;
}

export const navigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'لوحة القيادة',
    subtitle: 'أداء المناديب اليومي',
    icon: LayoutDashboard,
    permission: 'dashboard:read',
  },
  {
    href: '/drivers',
    label: 'المناديب',
    subtitle: 'إدارة دورة حياة المناديب',
    icon: Users,
    permission: 'drivers:read',
  },
  {
    href: '/cars',
    label: 'السيارات',
    subtitle: 'أسطول المركبات والتفويض',
    icon: CarFront,
    permission: 'cars:read',
  },
  {
    href: '/reports',
    label: 'التقارير',
    subtitle: 'التحليلات والمطابقة المالية',
    icon: ChartColumnBig,
    permission: 'reports:read',
  },
  {
    href: '/gps',
    label: 'تتبع GPS',
    subtitle: 'خريطة الأسطول والرحلات الحية',
    icon: MapPin,
    permission: 'gps:read',
  },
  {
    href: '/ai',
    label: 'الذكاء الاصطناعي',
    subtitle: 'توقع الأداء وكشف الانحرافات',
    icon: Bot,
    permission: 'ai:read',
  },
  {
    href: '/finance',
    label: 'التسوية المالية',
    subtitle: 'مقارنة المصادر وكشف الفروقات',
    icon: Wallet,
    permission: 'finance:read',
  },
  {
    href: '/settings',
    label: 'الإعدادات',
    subtitle: 'RBAC والاستعدادات التشغيلية',
    icon: Settings,
    permission: 'settings:read',
  },
  {
    href: '/testing',
    label: 'مختبر الميزات',
    subtitle: 'محاكاة الأنظمة والتحقق والقواعد',
    icon: Activity,
    permission: 'settings:read',
  },
];

export const appCatalog: AppCatalogItem[] = [
  {
    slug: 'toyou',
    label: 'ToYou',
    shortLabel: 'TY',
    accentClass: 'from-amber-300/20 to-orange-300/10',
  },
  {
    slug: 'jahez',
    label: 'جاهز',
    shortLabel: 'Jh',
    accentClass: 'from-emerald-300/20 to-teal-300/10',
  },
  {
    slug: 'keeta',
    label: 'كيتا',
    shortLabel: 'Kt',
    accentClass: 'from-sky-300/20 to-cyan-300/10',
  },
  {
    slug: 'hungerstation',
    label: 'هنقرستيشن',
    shortLabel: 'HS',
    accentClass: 'from-rose-300/20 to-orange-300/10',
  },
];

export function resolveRouteMeta(pathname: string) {
  if (pathname.startsWith('/drivers/')) {
    return {
      title: 'ملف المندوب',
      subtitle: 'Profile / Operations / Cars / Audit',
      highlight: 'تحديثات فورية للمناديب',
      icon: Shield,
    };
  }

  if (pathname.startsWith('/drivers')) {
    return {
      title: 'إدارة المناديب',
      subtitle: 'بحث، تصفية، وأرشفة مع pagination خادمي',
      highlight: 'أداء المناديب اليومي',
      icon: Users,
    };
  }

  if (pathname.startsWith('/cars')) {
    return {
      title: 'إدارة السيارات',
      subtitle: 'تفويض، جاهزية، وتعطل الأسطول',
      highlight: 'روائس - الحل اللوجستي الذكي',
      icon: CarFront,
    };
  }

  if (pathname.startsWith('/apps/')) {
    return {
      title: 'تتبع التطبيقات',
      subtitle: 'ربط الأداء التشغيلي بالمنصات المختلفة',
      highlight: 'تحديثات فورية للمناديب',
      icon: Route,
    };
  }

  if (pathname.startsWith('/reports')) {
    return {
      title: 'المركز التحليلي',
      subtitle: 'تحليلات + GPS + تسوية مالية',
      highlight: 'عرض تقديمي تفاعلي - روائس',
      icon: Activity,
    };
  }

  if (pathname.startsWith('/gps')) {
    return {
      title: 'خريطة التتبع الحي',
      subtitle: 'مراقبة مواقع المناديب والسيارات',
      highlight: 'روائس - تتبع الأسطول',
      icon: MapPin,
    };
  }

  if (pathname.startsWith('/ai')) {
    return {
      title: 'مركز الذكاء الاصطناعي',
      subtitle: 'توقع الأداء وكشف الانحرافات',
      highlight: 'روائس - التحليلات الذكية',
      icon: Bot,
    };
  }

  if (pathname.startsWith('/finance')) {
    return {
      title: 'التسوية المالية',
      subtitle: 'مقارنة المصادر وكشف الفروقات',
      highlight: 'روائس - المركز المالي',
      icon: Wallet,
    };
  }

  if (pathname.startsWith('/settings')) {
    return {
      title: 'الإعدادات والحوكمة',
      subtitle: 'صلاحيات، تنبيهات، وتجهيزات SaaS',
      highlight: 'روائس - الحل اللوجستي الذكي',
      icon: Settings,
    };
  }

  if (pathname.startsWith('/testing')) {
    return {
      title: 'مختبر الميزات (Feature Lab)',
      subtitle: 'محاكاة الأنظمة والتحقق وقواعد الأعمال',
      highlight: 'روائس - مختبر التحقق والمطابقة',
      icon: Activity,
    };
  }

  return {
    title: 'لوحة القيادة',
    subtitle: 'رؤية تشغيلية موحدة للمنصة',
    highlight: 'أداء المناديب اليومي',
    icon: LayoutDashboard,
  };
}
