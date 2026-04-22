import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BellRing, CheckCheck, ChevronLeft, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotificationActions, useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTimeArabic, translateNotificationType } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationRead?: () => void;
}

export function NotificationsPanel({ isOpen, onClose, onNotificationRead }: NotificationsPanelProps) {
  const { data, isLoading } = useNotifications(1, 20);
  const { markOne, markAll } = useNotificationActions();
  const notifications = data?.items ?? [];
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const toneClasses: Record<string, string> = {
    critical: 'bg-destructive/15 text-destructive border-destructive/30',
    warning: 'bg-status-warn/15 text-status-warn border-status-warn/30',
    success: 'bg-status-ok/15 text-status-ok border-status-ok/30',
    info: 'bg-primary/15 text-primary border-primary/30',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-modal max-h-[80vh] max-w-2xl border-white/10 p-0">
        <DialogHeader className="border-b border-white/10 px-6 py-5 text-right">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2 text-right">
              <DialogTitle className="flex items-center justify-end gap-2 text-2xl text-white">
                <span>تحديثات فورية للمناديب</span>
                <BellRing className="h-5 w-5 text-primary" />
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء.` : 'كل الإشعارات تمت قراءتها.'}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={!unreadCount || markAll.isPending}
              onClick={() =>
                markAll.mutate(undefined, {
                  onSuccess: () => {
                    onNotificationRead?.();
                  },
                })
              }
            >
              <CheckCheck className="h-4 w-4" />
              تمييز الكل كمقروء
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh] px-6 py-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="glass-panel h-24 animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="glass-panel flex h-48 flex-col items-center justify-center gap-3 p-6 text-center">
              <BellRing className="h-8 w-8 text-primary/70" />
              <p className="text-lg font-semibold text-white">لا توجد إشعارات حالية</p>
              <p className="text-sm text-muted-foreground">ستظهر هنا التنبيهات الفورية والتنبيهات التشغيلية فور ورودها.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={cn('glass-panel p-4 transition-all duration-300', !notification.is_read && 'border-primary/30 bg-primary/10')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Badge className={cn('border text-xs', toneClasses[notification.severity])}>
                          {translateNotificationType(notification.type)}
                        </Badge>
                        {!notification.is_read ? <Badge className="bg-accent text-accent-foreground">جديد</Badge> : null}
                      </div>

                      <div>
                        <h4 className="text-base font-semibold text-white">{notification.title}</h4>
                        <p className="mt-1 text-sm leading-7 text-muted-foreground">{notification.message}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatRelativeTimeArabic(notification.created_at)}
                        </span>
                        {notification.link ? (
                          <Link className="inline-flex items-center gap-1 text-primary hover:text-primary/80" to={notification.link} onClick={onClose}>
                            <span>الانتقال للسجل</span>
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    {!notification.is_read ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={markOne.isPending}
                        onClick={() =>
                          markOne.mutate(notification.id, {
                            onSuccess: () => {
                              onNotificationRead?.();
                            },
                          })
                        }
                      >
                        مقروء
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
