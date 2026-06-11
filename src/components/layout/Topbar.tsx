import { useState } from 'react';
import { Menu, Bell, LogOut, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { AnimatedLogo } from '@/components/branding/AnimatedLogo';
import { resolveRouteMeta } from '@/config/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useRealtimeNotifications, useUnreadCount } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE, getDemoCompanySettings } from '@/lib/demoMode';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getCurrentDateArabic } from '@/lib/dateUtils';

interface TopbarProps {
  onOpenMenu: () => void;
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const location = useLocation();
  const routeMeta = resolveRouteMeta(location.pathname);
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const { data: unreadCount = 0 } = useUnreadCount();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { permission, requestPermission, sendNotification } = usePushNotifications();

  useRealtimeNotifications();

  const { data: company } = useQuery({
    queryKey: ['company-settings', 'header'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (DEMO_MODE) {
        return getDemoCompanySettings();
      }

      const { data, error } = await supabase.from('company_settings').select('company_name').maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <header className="sticky top-4 z-30 mx-4 mt-4 flex items-center justify-between gap-4 rounded-[28px] glass-panel px-4 py-4 sm:mx-6 lg:mr-[21rem] lg:ml-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="فتح القائمة الجانبية">
            <Menu className="h-5 w-5" />
          </Button>

          <AnimatedLogo size="sm" />

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{company?.company_name ?? 'روائس'}</p>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">{routeMeta.title}</h2>
              <span className="hidden text-xs text-muted-foreground md:inline">{routeMeta.highlight}</span>
            </div>
          </div>
        </div>

        <div className="hidden xl:flex glass-pill max-w-xl flex-1 justify-center text-center text-sm text-muted-foreground">
          {routeMeta.subtitle}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden glass-pill xl:flex">{getCurrentDateArabic()}</div>

          <Button
            variant="outline"
            size="icon"
            title={theme === 'dark' ? 'وضع فاتح' : 'وضع داكن'}
            aria-label={theme === 'dark' ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
            onClick={toggleTheme}
            className="press-effect"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            title="تفعيل إشعارات المتصفح"
            onClick={async () => {
              if (permission !== 'granted') {
                const res = await requestPermission();
                if (res === 'granted') sendNotification('روائس اللوجستي', { body: 'تم تفعيل الإشعارات بنجاح!' });
              } else {
                sendNotification('روائس اللوجستي', { body: 'الإشعارات مفعّلة بالفعل' });
              }
            }}
            className={`press-effect ${permission === 'granted' ? 'border-emerald-500/50 text-emerald-400' : ''}`}
            aria-label="تفعيل إشعارات المتصفح"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="press-effect relative"
            onClick={() => setNotificationsOpen(true)}
            aria-label={unreadCount > 0 ? `الإشعارات — ${unreadCount} غير مقروء` : 'الإشعارات'}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <Badge className="pulse-dot absolute -top-1 -left-1 min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground" aria-hidden="true">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            ) : null}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-3 px-3">
                <UserRound className="h-4 w-4" />
                <span className="hidden text-sm sm:inline">{profile?.full_name ?? user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="text-right">الحساب</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="justify-end gap-2 text-right">
                <span>{profile?.full_name ?? user?.email}</span>
                <UserRound className="h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="justify-end gap-2 text-right">
                <span>{profile?.role ?? 'employee'}</span>
                <ShieldCheck className="h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-end gap-2 text-right" onClick={() => signOut()}>
                <span>تسجيل الخروج</span>
                <LogOut className="h-4 w-4" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <NotificationsPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}
