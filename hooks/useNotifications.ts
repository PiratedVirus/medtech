import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { NotificationResponse } from '@/types/notifications';

export function useNotifications() {
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch
  } = useQuery<NotificationResponse>({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/notifications');
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });

  const notifications = notificationsData?.notifications || {
    highPriority: [],
    mediumPriority: [],
    lowPriority: []
  };

  const summary = notificationsData?.summary || {
    total: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    unread: 0
  };

  const allNotifications = [
    ...notifications.highPriority,
    ...notifications.mediumPriority,
    ...notifications.lowPriority
  ];

  const hasHighPriorityNotifications = summary.highPriority > 0;
  const hasMediumPriorityNotifications = summary.mediumPriority > 0;
  const hasLowPriorityNotifications = summary.lowPriority > 0;

  return {
    notifications,
    summary,
    allNotifications,
    hasHighPriorityNotifications,
    hasMediumPriorityNotifications,
    hasLowPriorityNotifications,
    isLoading,
    error,
    refetch
  };
}
