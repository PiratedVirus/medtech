"use client";
import React, { useEffect } from "react";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import { useRouter } from 'next/navigation';
import CdLoader from "@/components/ui/custom/cd-loader";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { profile, isLoading, isError } = useDecryptedProfile();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!isLoading && !isError && profile) {
      router.replace('/dashboard');
    }
  }, [profile, isLoading, isError, router]);

  // Show loading while checking authentication (but not if there's an error)
  // Also add a timeout to prevent infinite loading
  if (isLoading && !isError) {
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