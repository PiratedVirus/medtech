'use client';

import React, { useState } from 'react';
import { 
  Bell, X, Check, Trash2, Filter, MoreVertical, 
  Calendar, Utensils, FlaskConical, Pill, FileText, 
  AlertTriangle, Bot, Stethoscope, CreditCard, Clock 
} from 'lucide-react';
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
      case 'FOLLOW_UP_APPOINTMENT':
        return Calendar;
      case 'DIET_PLAN_READY':
      case 'DIET_PLAN_REQUEST_STATUS':
      case 'DIET_PLAN_FOLLOW_UP':
        return Utensils;
      case 'LAB_RESULTS_READY':
      case 'LAB_SAMPLE_COLLECTION':
      case 'LAB_BOOKING_CONFIRMED':
      case 'FOLLOW_UP_LAB_TEST':
        return FlaskConical;
      case 'PRESCRIPTION_READY':
      case 'MEDICINE_REMINDER':
        return Pill;
      case 'PLAN_EXPIRY_WARNING':
      case 'PLAN_RENEWED':
      case 'PLAN_SUBSCRIBED':
        return FileText;
      case 'HEALTH_ALERT':
        return AlertTriangle;
      case 'AI_SUMMARY_READY':
        return Bot;
      case 'CONSULTATION_REMINDER':
        return Stethoscope;
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
        return CreditCard;
      default:
        return Bell;
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
      case 'FOLLOW_UP_APPOINTMENT':
      case 'FOLLOW_UP_LAB_TEST':
        return 'bg-[#F28A2E]';
      case 'LAB_RESULTS_READY':
        return 'bg-yellow-500';
      case 'PLAN_SUBSCRIBED':
      case 'DIET_PLAN_FOLLOW_UP':
        return 'bg-green-500';
      default:
        return 'bg-[#134F30]';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-[#F28A2E]/20 bg-gradient-to-r from-[#F28A2E] to-[#F28A2E]/80 rounded-t-2xl">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-white/20 rounded-full flex-shrink-0">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Notifications</h2>
                {data?.unreadCount && data.unreadCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse bg-white text-[#F28A2E] text-xs">
                    {data.unreadCount}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-white/90 hidden sm:block">Stay updated with your health journey</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {selectedNotifications.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                <span className="text-sm text-white font-medium">
                  {selectedNotifications.length} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAsRead}
                  disabled={markAsRead.isPending}
                  className="h-8 px-3 text-xs border-white text-white hover:bg-white hover:text-[#F28A2E]"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark Read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleteNotifications.isPending}
                  className="h-8 px-3 text-xs text-white hover:text-white hover:bg-red-500 border-white"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            )}
            
            {/* Mobile action buttons */}
            {selectedNotifications.length > 0 && (
              <div className="sm:hidden flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAsRead}
                  disabled={markAsRead.isPending}
                  className="h-8 w-8 p-0 border-white text-white hover:bg-white hover:text-[#F28A2E]"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleteNotifications.isPending}
                  className="h-8 w-8 p-0 text-white hover:text-white hover:bg-red-500 border-white"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onClose}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-white/20 text-white flex-shrink-0"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
          <div className="px-4 sm:px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 h-10">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 data-[state=active]:font-medium text-sm"
              >
                <span className="hidden sm:inline">All Notifications</span>
                <span className="sm:hidden">All</span>
              </TabsTrigger>
              <TabsTrigger 
                value="unread" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 data-[state=active]:font-medium text-sm"
              >
                <span className="hidden sm:inline">Unread Only</span>
                <span className="sm:hidden">Unread</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="flex-1 mt-0">
            <div className="px-4 sm:px-6 py-4">
              {/* Select All */}
              {data?.notifications && data.notifications.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                    className="text-sm h-8 w-full sm:w-auto"
                  >
                    {selectedNotifications.length === data.notifications.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-gray-600 justify-center sm:justify-end">
                    <span>{data.notifications.length} total</span>
                    {data.unreadCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-[#F28A2E] font-medium">{data.unreadCount} unread</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Notifications List */}
              <ScrollArea className="h-[300px] sm:h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-500">Loading notifications...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-red-500 mb-2">⚠️</div>
                    <p className="text-red-600 font-medium">Failed to load notifications</p>
                    <p className="text-sm text-gray-500 mt-1">Please try refreshing the page</p>
                  </div>
                ) : !data?.notifications || data.notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-3">
                      <Bell className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-700 font-medium">No notifications yet</p>
                    <p className="text-sm text-gray-600 mt-1">We'll notify you when something important happens</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.notifications.map((notification, index) => (
                      <div
                        key={notification.id}
                        className={`group pl-2 pr-3 py-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${
                          notification.isRead 
                            ? 'bg-white border-gray-200 hover:border-gray-300' 
                            : 'bg-gradient-to-r from-[#F28A2E]/5 to-[#F28A2E]/10 border-[#F28A2E]/20 hover:border-[#F28A2E]/30'
                        } ${
                          selectedNotifications.includes(notification.id)
                            ? 'ring-2 ring-[#F28A2E] shadow-md'
                            : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="flex items-start gap-2">
                          {/* Priority indicator */}
                          <div className={`w-1 h-full rounded-full ${getPriorityColor(notification.type)} flex-shrink-0`} />
                          
                          {/* Icon */}
                          <div className="flex-shrink-0 p-1.5 bg-gray-100 rounded-md">
                            {React.createElement(getNotificationIcon(notification.type), { 
                              className: "h-4 w-4 text-gray-600" 
                            })}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className={`font-medium text-sm leading-tight ${
                                notification.isRead ? 'text-gray-700' : 'text-gray-900'
                              }`}>
                                {notification.title}
                              </h3>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {!notification.isRead && (
                                  <div className="w-1.5 h-1.5 bg-[#F28A2E] rounded-full animate-pulse"></div>
                                )}
                                <input
                                  type="checkbox"
                                  checked={selectedNotifications.includes(notification.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleSelectNotification(notification.id);
                                  }}
                                  className="w-3.5 h-3.5 text-[#F28A2E] border-gray-300 rounded focus:ring-[#F28A2E]"
                                />
                              </div>
                            </div>
                            <p className={`text-xs mt-1 leading-relaxed ${
                              notification.isRead ? 'text-gray-600' : 'text-gray-800'
                            }`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                {formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}
                              </span>
                              {!notification.isRead && (
                                <Badge variant="secondary" className="text-xs bg-[#134F30]/10 text-[#134F30] px-1.5 py-0.5">
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
