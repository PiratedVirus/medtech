"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Phone, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FAB_CONFIG } from "@/lib/fab-config";

interface FloatingCallButtonProps {
  phoneNumber?: string;
  whatsappNumber?: string;
  className?: string;
  showWhatsApp?: boolean;
}

export default function FloatingCallButton({ 
  phoneNumber = FAB_CONFIG.phoneNumber,
  whatsappNumber = FAB_CONFIG.whatsappNumber,
  className,
  showWhatsApp = FAB_CONFIG.showWhatsApp
}: FloatingCallButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const fabRef = useRef<HTMLDivElement>(null);

  // Check if current page should hide FAB
  const shouldHideFAB = FAB_CONFIG.hiddenPages.some(page => {
    // Special case for root path - exact match only
    if (page === "/") {
      return pathname === "/";
    }
    // For other pages, use startsWith
    return pathname.startsWith(page);
  });

  // Check if user has dismissed the FAB in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem("fab-dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);


  // Show FAB after a delay (UX best practice)
  useEffect(() => {
    if (!shouldHideFAB && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, FAB_CONFIG.showAfterDelay);

      return () => clearTimeout(timer);
    }
  }, [shouldHideFAB, isDismissed]);

  // Hide FAB when scrolling down, show when scrolling up (UX best practice)
  useEffect(() => {
    if (!FAB_CONFIG.hideOnScroll && !FAB_CONFIG.showOnScrollUp) return;
    
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? "down" : "up";
      
      if (FAB_CONFIG.hideOnScroll && direction === "down" && scrollY > 100) {
        setIsVisible(false);
      } else if (FAB_CONFIG.showOnScrollUp && (direction === "up" || scrollY < 100)) {
        setIsVisible(true);
      }
      
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCall = () => {
    // Add haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleWhatsApp = () => {
    // Add haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    const message = encodeURIComponent(FAB_CONFIG.whatsappMessage);
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const handleDismiss = () => {
    // Only close the expanded menu, don't dismiss the entire FAB
    setIsExpanded(false);
  };

  const handleDismissFAB = () => {
    // This would be for a separate "dismiss FAB" action if needed
    if (FAB_CONFIG.dismissible) {
      setIsDismissed(true);
      setIsExpanded(false);
      sessionStorage.setItem("fab-dismissed", "true");
    }
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Close expanded state when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);


  // Don't render if conditions are not met
  if (shouldHideFAB || isDismissed || !isVisible) {
    return null;
  }


  return (
    <div 
      ref={fabRef}
      className={cn(
        "fixed bottom-20 right-4 z-50 transition-all duration-300 ease-in-out",
        "md:bottom-6",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expanded state with call options */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 animate-in slide-in-from-bottom-2 duration-200">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[240px] max-w-[280px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">Need Help?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Choose your preferred way to contact us
            </p>
            
            <div className="space-y-2">
              <Button
                onClick={handleCall}
                className="w-full bg-secondary hover:bg-secondary/90 text-white/90 text-sm"
                size="sm"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call {phoneNumber}
              </Button>
              
              {showWhatsApp && (
                <Button
                  onClick={handleWhatsApp}
                  variant="outline"
                  className="w-full border-secondary text-secondary hover:bg-secondary/10 text-sm"
                  size="sm"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main FAB button */}
      <Button
        onClick={handleToggle}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
          "bg-secondary hover:bg-secondary/90 text-white/80",
          "flex items-center justify-center",
          "transform hover:scale-105 active:scale-95",
          isExpanded && "bg-secondary/90 scale-105",
          isHovered && "shadow-2xl"
        )}
        size="lg"
        aria-label="Contact support"
      >
        <Phone className={cn(
          "h-6 w-6 transition-transform duration-200",
          isExpanded && "rotate-12"
        )} />
      </Button>

      {/* Tooltip for desktop */}
      {isHovered && !isExpanded && (
        <div className="hidden md:block absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap animate-in fade-in duration-200">
          Need Help? Contact Us
          <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </div>
      )}
    </div>
  );
}
