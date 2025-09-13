"use client";
import React, { useEffect } from "react";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import { useRouter } from 'next/navigation';
import CdLoader from "@/components/ui/custom/cd-loader";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { profile, isLoading } = useDecryptedProfile();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!isLoading && profile) {
      router.replace('/dashboard');
    }
  }, [profile, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return <CdLoader />;
  }

  // If user is authenticated, don't render anything (will redirect)
  if (profile) {
    return null;
  }

  // If user is not authenticated, render the page
  return <>{children}</>;
};

export default PublicLayout; 