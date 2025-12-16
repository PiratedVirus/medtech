"use client";
import React, { useEffect } from "react";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import { useClinicContext } from "@/hooks/use-clinic-context";
import { useRouter, usePathname } from 'next/navigation';
import CdLoader from "@/components/ui/custom/cd-loader";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { profile, isLoading: profileLoading, isError: profileError } = useDecryptedProfile();
  const pathname = usePathname();
  
  // Don't validate clinic on the clinic-not-found page itself
  const isClinicNotFoundPage = pathname === '/clinic-not-found';
  const { isLoading: clinicLoading, isError: clinicError, subdomain } = useClinicContext({ 
    redirectOnNotFound: !isClinicNotFoundPage 
  });
  
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!profileLoading && !profileError && profile) {
      router.replace('/dashboard');
    }
  }, [profile, profileLoading, profileError, router]);

  // Show loading while checking authentication or clinic (but not if there's an error)
  const isLoading = (profileLoading && !profileError) || (clinicLoading && !isClinicNotFoundPage);
  
  if (isLoading) {
    return <CdLoader />;
  }

  // If clinic validation failed and we're on a subdomain (not the clinic-not-found page)
  // The useClinicContext hook will handle the redirect
  if (clinicError && subdomain && !isClinicNotFoundPage) {
    return <CdLoader />;
  }

  // If user is authenticated, don't render anything (will redirect)
  if (profile) {
    return null;
  }

  // If user is not authenticated or there's an error, render the page
  return <>{children}</>;
};

export default PublicLayout; 