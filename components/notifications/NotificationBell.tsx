'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications, usePushNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NotificationCenter from './NotificationCenter';

const NotificationBell: React.FC = () => {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  
  const { data: notificationsData } = useNotifications(1, 10, true);
  const { 
    isSupported, 
    permission, 
    requestPermission, 
    registerForPush 
  } = usePushNotifications();

  const unreadCount = notificationsData?.unreadCount || 0;

  useEffect(() => {
    // Check if we should show permission banner
    if (isSupported && permission === 'default') {
      // Show banner if permission is default (not asked yet)
      setShowPermissionBanner(true);
    } else if (permission === 'granted') {
      // Hide banner if permission is granted
      setShowPermissionBanner(false);
    } else if (permission === 'denied') {
      // Hide banner if permission is denied
      setShowPermissionBanner(false);
    }
  }, [isSupported, permission]);

  const handleRequestPermission = async () => {
    try {
      console.log('🔔 Requesting notification permission...');
      const permission = await requestPermission();
      console.log('🔔 Permission result:', permission);
      
      if (permission === 'granted') {
        console.log('🔔 Permission granted, registering for push...');
        await registerForPush();
        setShowPermissionBanner(false);
        console.log('🔔 Push registration completed!');
      } else {
        console.log('🔔 Permission denied or dismissed');
        setShowPermissionBanner(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setShowPermissionBanner(false);
    }
  };

  const handleDismissBanner = () => {
    setShowPermissionBanner(false);
  };

  return (
    <>
      {/* Permission Banner */}
      {showPermissionBanner && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-[#F28A2E] to-[#F28A2E]/80 text-white p-5 rounded-2xl shadow-2xl max-w-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/20 rounded-full flex-shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Enable Notifications</h3>
              <p className="text-xs text-white/90 leading-relaxed mb-4">
                Get real-time updates about your appointments, test results, and health insights.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleRequestPermission}
                  className="text-xs bg-white text-[#F28A2E] hover:bg-gray-50 font-medium"
                >
                  Enable
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismissBanner}
                  className="text-xs text-white/90 hover:text-white hover:bg-white/10 p-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsNotificationCenterOpen(true)}
          className="relative p-2 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#F28A2E] text-white animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
        
        {/* Manual Enable Button for Testing */}
        {permission === 'default' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestPermission}
            className="ml-2 text-xs"
          >
            Enable Notifications
          </Button>
        )}
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </>
  );
};

export default NotificationBell;
