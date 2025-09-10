import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  sentAt: string;
  readAt?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

// Register device token for push notifications
export const useRegisterDeviceToken = () => {
  return useMutation({
    mutationFn: async ({ deviceToken, platform = 'web' }: { deviceToken: string; platform?: string }) => {
      const response = await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceToken, platform }),
      });

      if (!response.ok) {
        throw new Error('Failed to register device token');
      }

      return response.json();
    },
  });
};

// Remove device token
export const useRemoveDeviceToken = () => {
  return useMutation({
    mutationFn: async (deviceToken: string) => {
      const response = await fetch('/api/notifications/register-token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove device token');
      }

      return response.json();
    },
  });
};

// Fetch notifications
export const useNotifications = (page = 1, limit = 20, unreadOnly = false) => {
  return useQuery({
    queryKey: ['notifications', page, limit, unreadOnly],
    queryFn: async (): Promise<NotificationResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString(),
      });

      const response = await fetch(`/api/notifications?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      return data.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// Mark notifications as read/unread
export const useMarkNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      notificationIds, 
      markAsRead = true 
    }: { 
      notificationIds: number[]; 
      markAsRead?: boolean; 
    }) => {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds, markAsRead }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notifications');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Delete notifications
export const useDeleteNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: number[]) => {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete notifications');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Push notification registration hook
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  const registerToken = useRegisterDeviceToken();
  const removeToken = useRemoveDeviceToken();

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);
    return permission;
  }, [isSupported]);

  const registerForPush = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications not supported');
    }

    // Check current permission status
    const currentPermission = Notification.permission;
    console.log('Current permission status:', currentPermission);
    
    if (currentPermission !== 'granted') {
      throw new Error(`Permission not granted. Current status: ${currentPermission}`);
    }

    try {
      console.log('Starting push notification registration...');
      
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('Service worker registered:', registration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      setRegistration(registration);
      
      console.log('Service worker is ready');

      // Get subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      console.log('Push subscription created:', subscription);

      // Send subscription to server
      const response = await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceToken: JSON.stringify(subscription),
          platform: 'web',
        }),
      });

      console.log('Registration response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Registration failed:', errorText);
        throw new Error(`Failed to register for push notifications: ${errorText}`);
      }

      const result = await response.json();
      console.log('Registration successful:', result);

      return subscription;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      throw error;
    }
  }, [isSupported]);

  const unregisterFromPush = useCallback(async () => {
    if (!registration) return;

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await removeToken.mutateAsync(JSON.stringify(subscription));
      }
    } catch (error) {
      console.error('Error unregistering from push notifications:', error);
      throw error;
    }
  }, [registration, removeToken]);

  return {
    isSupported,
    permission,
    registration,
    requestPermission,
    registerForPush,
    unregisterFromPush,
    isRegistering: registerToken.isPending,
    isUnregistering: removeToken.isPending,
  };
};
