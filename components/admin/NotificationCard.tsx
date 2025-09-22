"use client"

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NotificationCardProps } from "@/types/notifications";
import { 
  AlertTriangle, 
  Calendar, 
  CreditCard, 
  FlaskConical, 
  Clock, 
  UserPlus, 
  Users, 
  AlertCircle,
  Utensils,
  ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";

const iconMap = {
  AlertTriangle,
  Calendar,
  CreditCard,
  FlaskConical,
  Clock,
  UserPlus,
  Users,
  AlertCircle,
  Utensils
};

export function NotificationCard({ notification, onAction }: NotificationCardProps) {
  const router = useRouter();
  const IconComponent = iconMap[notification.icon as keyof typeof iconMap] || AlertCircle;

  const handleAction = () => {
    if (onAction) {
      onAction(notification);
    }
  };

  // Get priority color for vertical strip
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div 
      className={`relative bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group`}
      onClick={handleAction}
    >
      {/* Colored vertical strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getPriorityColor(notification.priority)} rounded-l-lg`} />
      
      {/* Content */}
      <div className="flex items-start space-x-3 pl-4">
        <IconComponent className={`h-4 w-4 mt-0.5 text-[${notification.color}] flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {notification.title}
            </h4>
            {notification.count && notification.count > 1 && (
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {notification.count}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {notification.description}
          </p>
        </div>
      </div>
    </div>
  );
}
