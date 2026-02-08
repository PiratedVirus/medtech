"use client"

import { useNotifications } from "@/hooks/useNotifications";
import { NotificationBadge } from "@/components/admin/NotificationBadge";
import { Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { NotificationsList } from "./NotificationsList";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePushNotifications } from "@/hooks/use-notifications";
import { toast } from "react-toastify";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function AdminHeader() {
  const { summary, hasHighPriorityNotifications } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [clinicName, setClinicName] = useState('Loading...');
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const { isSupported, permission, requestPermission, registerForPush } = usePushNotifications('admin');
  const [hasRegistered, setHasRegistered] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Fetch clinic name on component mount
  useEffect(() => {
    // ... existing fetch logic ...
    const fetchClinicName = async () => {
      try {
        const response = await fetch('/api/admin/auth/me', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        const data = await response.json()
        console.log('AdminHeader - API Response:', data)
        if (data.success && data.user?.clinic?.name) {
          console.log('AdminHeader - Setting clinic name to:', data.user.clinic.name)
          setClinicName(data.user.clinic.name)
        } else if (data.success && data.user && !data.user.clinic) {
          console.log('AdminHeader - No clinic data found')
          setClinicName('⚠️ Please Re-login')
        } else {
          console.log('AdminHeader - API failed or no user data')
          setClinicName('Clinic')
        }
      } catch (error) {
        console.error('AdminHeader - Failed to fetch clinic name:', error)
        setClinicName('Clinic')
      }
    }
    fetchClinicName()
  }, [])

  // Show banner if permission not yet granted
  useEffect(() => {
    if (isSupported && permission === 'default') {
      setShowPermissionBanner(true);
    } else {
      setShowPermissionBanner(false);
    }
  }, [isSupported, permission]);

  // Auto-register admin for push notifications when permission is already granted
  useEffect(() => {
    if (isSupported && permission === 'granted' && !hasRegistered) {
      console.log('[AdminHeader] Attempting to auto-register admin push...');
      setHasRegistered(true);
      
      registerForPush()
        .then(() => {
          console.log('[AdminHeader] Auto-registered admin for push notifications');
          setRegistrationError(null);
          toast.success("Push notifications active", { autoClose: 2000 });
        })
        .catch((err) => {
          console.error('[AdminHeader] Failed to auto-register admin push:', err);
          setRegistrationError(err.message || 'Registration failed');
          setHasRegistered(false); // Allow retry
          toast.error("Failed to activate push notifications");
        });
    }
  }, [isSupported, permission, hasRegistered, registerForPush]);

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
      {showPermissionBanner && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-[#F28A2E] to-[#F28A2E]/80 text-white p-5 rounded-2xl shadow-2xl max-w-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/20 rounded-full flex-shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Enable Admin Notifications</h3>
              <p className="text-xs text-white/90 leading-relaxed mb-4">
                Get real-time updates about new lab bookings and other clinic activity.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const result = await requestPermission();
                    if (result === 'granted') {
                      try {
                        await registerForPush();
                        setShowPermissionBanner(false);
                        toast.success("Notifications enabled!");
                      } catch (e) {
                        toast.error("Failed to register for notifications");
                      }
                    }
                  }}
                  className="text-xs bg-white text-[#F28A2E] hover:bg-gray-50 font-medium"
                >
                  Enable
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPermissionBanner(false)}
                  className="text-xs text-white/90 hover:text-white hover:bg-white/10 p-2"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center space-x-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            {isSupported && permission === 'granted' && !registrationError && (
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger>
                     <CheckCircle2 className="h-4 w-4 text-green-500" />
                   </TooltipTrigger>
                   <TooltipContent>
                     <p>Push notifications active</p>
                   </TooltipContent>
                 </Tooltip>
               </TooltipProvider>
            )}
            {(registrationError || (!showPermissionBanner && permission === 'denied')) && (
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger>
                     <AlertCircle className="h-4 w-4 text-red-500" />
                   </TooltipTrigger>
                   <TooltipContent>
                     <p>Push notifications issue: {registrationError || 'Permission denied'}</p>
                   </TooltipContent>
                 </Tooltip>
               </TooltipProvider>
            )}
          </div>
          <p className="text-sm text-gray-600">{clinicName}</p>
        </div>
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
