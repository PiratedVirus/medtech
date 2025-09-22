"use client"

import { useNotifications } from "@/hooks/useNotifications";
import { NotificationBadge } from "@/components/admin/NotificationBadge";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { NotificationsList } from "./NotificationsList";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AdminHeader() {
  const { summary, hasHighPriorityNotifications } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const getHighestPriority = () => {
    if (summary.highPriority > 0) return 'high';
    if (summary.mediumPriority > 0) return 'medium';
    if (summary.lowPriority > 0) return 'low';
    return null;
  };

  const totalNotifications = summary.total;
  const highestPriority = getHighestPriority();

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Sheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {totalNotifications > 0 && highestPriority && (
                <div className="absolute -top-1 -right-1">
                  <NotificationBadge 
                    count={totalNotifications} 
                    priority={highestPriority}
                  />
                </div>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <div className="p-4">
                <NotificationsList />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
