"use client";
import React from "react";
import { ProfileProvider } from "@/hooks/context/ProfileContext";
import { DashboardHeader as Header } from "@/components/common/DashboardHeader";
import Footer from "@/components/common/Footer";
import FloatingCallButton from "@/components/common/FloatingCallButton";
import "@/app/globals.css";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import CdLoader from "@/components/ui/custom/cd-loader";


interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { profile, isLoading, isError, error } = useDecryptedProfile();

  if (isLoading) {
    return <CdLoader />;
  }

  if (isError || error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-2xl font-semibold text-red-600">
          Oops! Something went wrong.
        </h2>
        <p className="text-gray-600 mt-2">
          {error?.message || 'Failed to load profile'}
        </p>
      </div>
    );
  }

  return (
    <ProfileProvider profile={profile}>
      <Header />
      <main className="flex-grow pb-14 sm:pb-2">
        {children}
      </main>
      <div className="hidden sm:block">
        <Footer />
      </div>
      <FloatingCallButton />
    </ProfileProvider>
  );
};

export default DashboardLayout;
