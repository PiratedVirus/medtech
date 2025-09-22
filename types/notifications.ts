export interface NotificationItem {
  id: string;
  type: 'appointment' | 'lab' | 'payment' | 'user' | 'system' | 'subscription' | 'diet';
  title: string;
  description: string;
  count?: number;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
  bgColor: string;
  timestamp: string;
  isRead: boolean;
  data?: any;
}

export interface NotificationResponse {
  notifications: {
    highPriority: NotificationItem[];
    mediumPriority: NotificationItem[];
    lowPriority: NotificationItem[];
  };
  summary: {
    total: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    unread: number;
  };
}

export interface NotificationBadgeProps {
  count: number;
  priority: 'high' | 'medium' | 'low';
  onClick?: () => void;
}

export interface NotificationCardProps {
  notification: NotificationItem;
  onAction?: (notification: NotificationItem) => void;
}
