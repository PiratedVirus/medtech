"use client"

import { Badge } from "@/components/ui/badge";
import { NotificationBadgeProps } from "@/types/notifications";

export function NotificationBadge({ count, priority, onClick }: NotificationBadgeProps) {
  if (count === 0) return null;

  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'medium':
        return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'low':
        return 'bg-green-500 hover:bg-green-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  return (
    <Badge
      className={`cursor-pointer ${getPriorityStyles()}`}
      onClick={onClick}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}
