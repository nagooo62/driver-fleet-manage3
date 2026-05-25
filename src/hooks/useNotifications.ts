import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  DEMO_MODE,
  getDemoNotifications,
  markAllDemoNotificationsRead,
  markDemoNotificationRead,
} from '@/lib/demoMode';
import type { NotificationItem, NotificationRecord } from '@/types';

const mapSeverity = (type: string | null | undefined): NotificationItem['severity'] => {
  switch (type) {
    case 'critical':
      return 'critical';
    case 'warning':
    case 'iqama_expiry':
    case 'license_expiry':
    case 'medical_expiry':
    case 'car_downtime':
    case 'import_mismatch':
      return 'warning';
    case 'success':
    case 'import_complete':
      return 'success';
    default:
      return 'info';
  }
};

const toNotificationItem = (notification: NotificationRecord): NotificationItem => ({
  ...(notification as NotificationItem),
  severity: mapSeverity(notification.type),
  link: notification.target_type === 'driver' && notification.target_id ? `/drivers/${notification.target_id}` : undefined,
});

const buildUserFilter = (userId?: string) => (userId ? `user_id.eq.${userId},user_id.is.null` : 'user_id.is.null');

export function useNotifications(page = 1, pageSize = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', 'list', user?.id, page, pageSize],
    enabled: !!user,
    staleTime: 30 * 1000,
    queryFn: async () => {
      if (DEMO_MODE) {
        const notifications = [...getDemoNotifications()].sort((left, right) => right.created_at.localeCompare(left.created_at));
        const from = (page - 1) * pageSize;
        const items = notifications.slice(from, from + pageSize);

        return {
          items,
          total: notifications.length,
          page,
          pageSize,
        };
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .or(buildUserFilter(user?.id))
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        items: (data ?? []).map(toNotificationItem),
        total: count ?? 0,
        page,
        pageSize,
      };
    },
  });
}

export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    enabled: !!user,
    staleTime: 30 * 1000,
    queryFn: async () => {
      if (DEMO_MODE) {
        return getDemoNotifications().filter((notification) => !notification.is_read).length;
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .or(buildUserFilter(user?.id))
        .eq('is_read', false);

      if (error) throw error;
      return count ?? 0;
    },
  });
}

export async function markAsRead(notificationId: string) {
  if (DEMO_MODE) {
    markDemoNotificationRead(notificationId);
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllRead(userId?: string | null) {
  if (DEMO_MODE) {
    markAllDemoNotificationsRead();
    return;
  }

  const filter = userId ? `user_id.eq.${userId},user_id.is.null` : 'user_id.is.null';
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .or(filter)
    .eq('is_read', false);

  if (error) throw error;
}

export function useNotificationActions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markOne = useMutation({
    mutationFn: markAsRead,
    onSuccess: refresh,
  });

  const markAll = useMutation({
    mutationFn: () => markAllRead(user?.id),
    onSuccess: refresh,
  });

  return {
    markOne,
    markAll,
  };
}

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (DEMO_MODE || !user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);
}
