import { useState, useEffect, useCallback } from 'react';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission as NotificationPermission;
  });

  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('notifications-enabled');
    return stored === 'true';
  });

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications-enabled', enabled.toString());
    }
  }, [enabled]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      
      if (result === 'granted') {
        setEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((options: NotificationOptions) => {
    if (!isSupported || !enabled || permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/assets/generated/pwa-icon.dim_192x192.png',
        tag: options.tag,
        data: options.data,
        badge: '/assets/generated/pwa-icon.dim_192x192.png',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [isSupported, enabled, permission]);

  const toggleEnabled = useCallback(async () => {
    if (!enabled && permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        return false;
      }
    } else {
      setEnabled(!enabled);
    }
    return true;
  }, [enabled, permission, requestPermission]);

  return {
    isSupported,
    permission,
    enabled,
    setEnabled,
    requestPermission,
    showNotification,
    toggleEnabled,
  };
}
