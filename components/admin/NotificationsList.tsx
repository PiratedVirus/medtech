"use client"

import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCard } from "@/components/admin/NotificationCard";
import { NotificationBadge } from "@/components/admin/NotificationBadge";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function NotificationsList() {
  const {
    notifications,
    summary,
    isLoading,
    error,
    hasHighPriorityNotifications,
    hasMediumPriorityNotifications,
    hasLowPriorityNotifications
  } = useNotifications();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading notifications...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Failed to load notifications. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (summary.total === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No notifications at the moment</p>
          <p className="text-sm text-gray-400 mt-1">All systems are running smoothly</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <div className="space-y-4">
        {/* Summary Badge */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pb-2">
          <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
          <NotificationBadge count={summary.total} priority={summary.highPriority} />
        </div>

        {/* All Notifications Combined */}
        <div className="space-y-2">
          {[
            ...notifications.highPriority,
            ...notifications.mediumPriority,
            ...notifications.lowPriority
          ].map((notification) => (
            <NotificationCard 
              key={notification.id} 
              notification={notification} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
