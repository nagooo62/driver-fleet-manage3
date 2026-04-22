import { useCallback, useEffect, useState } from 'react';

type Permission = 'default' | 'granted' | 'denied';

export function usePushNotifications() {
  const [permission, setPermission] = useState<Permission>('default');
  const supported = typeof window !== 'undefined' && 'Notification' in window;

  useEffect(() => {
    if (supported) setPermission(Notification.permission as Permission);
  }, [supported]);

  const requestPermission = useCallback(async () => {
    if (!supported) return;
    const result = await Notification.requestPermission();
    setPermission(result as Permission);
    return result;
  }, [supported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!supported || Notification.permission !== 'granted') return;
    new Notification(title, { icon: '/favicon.ico', dir: 'rtl', ...options });
  }, [supported]);

  return { permission, supported, requestPermission, sendNotification };
}
