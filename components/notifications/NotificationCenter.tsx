'use client';

import React, { useState } from 'react';
import { Bell, X, Check, Trash2, Filter, MoreVertical } from 'lucide-react';
import { useNotifications, useMarkNotifications, useDeleteNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);

  const { data, isLoading, error } = useNotifications(1, 50, activeTab === 'unread');
  const markAsRead = useMarkNotifications();
  const deleteNotifications = useDeleteNotifications();

  const handleSelectNotification = (notificationId: number) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (!data?.notifications) return;
    
    const allIds = data.notifications.map(n => n.id);
    setSelectedNotifications(
      selectedNotifications.length === allIds.length ? [] : allIds
    );
  };

  const handleMarkAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      await markAsRead.mutateAsync({ 
        notificationIds: selectedNotifications, 
        markAsRead: true 
      });
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleDelete = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      await deleteNotifications.mutateAsync(selectedNotifications);
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      try {
        await markAsRead.mutateAsync({ 
          notificationIds: [notification.id], 
          markAsRead: true 
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Handle notification action
    if (notification.data?.action) {
      // Navigate based on action
      switch (notification.data.action) {
        case 'VIEW_APPOINTMENT':
          // Navigate to appointments page
          break;
        case 'VIEW_DIET_PLAN':
          // Navigate to diet plan page
          break;
        case 'VIEW_RESULTS':
          // Navigate to lab results page
          break;
        case 'VIEW_PRESCRIPTION':
          // Navigate to prescriptions page
          break;
        default:
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_REMINDER':
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_CANCELLED':
        return '📅';
      case 'DIET_PLAN_READY':
      case 'DIET_PLAN_REQUEST_STATUS':
        return '🥗';
      case 'LAB_RESULTS_READY':
      case 'LAB_SAMPLE_COLLECTION':
      case 'LAB_BOOKING_CONFIRMED':
        return '🧪';
      case 'PRESCRIPTION_READY':
      case 'MEDICINE_REMINDER':
        return '💊';
      case 'PLAN_EXPIRY_WARNING':
      case 'PLAN_RENEWED':
        return '📋';
      case 'HEALTH_ALERT':
        return '⚠️';
      case 'AI_SUMMARY_READY':
        return '🤖';
      case 'CONSULTATION_REMINDER':
        return '👨‍⚕️';
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
        return '💳';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (type: string) => {
    switch (type) {
      case 'HEALTH_ALERT':
      case 'APPOINTMENT_CANCELLED':
      case 'PAYMENT_FAILED':
        return 'bg-red-500';
      case 'PLAN_EXPIRY_WARNING':
      case 'APPOINTMENT_REMINDER':
        return 'bg-orange-500';
      case 'LAB_RESULTS_READY':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {data?.unreadCount && data.unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {data.unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedNotifications.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAsRead}
                  disabled={markAsRead.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark Read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleteNotifications.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1">
            <div className="p-4">
              {/* Select All */}
              {data?.notifications && data.notifications.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                  >
                    {selectedNotifications.length === data.notifications.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <span className="text-sm text-gray-500">
                    {selectedNotifications.length} selected
                  </span>
                </div>
              )}

              {/* Notifications List */}
              <ScrollArea className="h-96">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-center text-red-500 py-8">
                    Failed to load notifications
                  </div>
                ) : !data?.notifications || data.notifications.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No notifications found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          notification.isRead 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-blue-50 border-blue-200'
                        } ${
                          selectedNotifications.includes(notification.id)
                            ? 'ring-2 ring-blue-500'
                            : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Priority indicator */}
                          <div className={`w-1 h-full rounded-full ${getPriorityColor(notification.type)}`} />
                          
                          {/* Icon */}
                          <div className="text-2xl">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h3 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                {notification.title}
                              </h3>
                              <input
                                type="checkbox"
                                checked={selectedNotifications.includes(notification.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleSelectNotification(notification.id);
                                }}
                                className="ml-2"
                              />
                            </div>
                            <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-600' : 'text-gray-800'}`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}
                              </span>
                              {!notification.isRead && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NotificationCenter;
