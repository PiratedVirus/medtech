"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile } from "@/store/userSlice";
import { ProfileProvider } from "@/hooks/context/ProfileContext";
import type { AppDispatch, RootState } from "@/store";
import { DashboardHeader as Header } from "@/components/common/DashboardHeader";
import Footer from "@/components/common/Footer";
import "@/app/globals.css";
import { useDecryptedProfile } from "@/hooks/use-profile";
import CdLoader from "@/components/ui/custom/cd-loader";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DoctorHomeHeader from "@/components/doctors/home/DoctorHomeHeader";

interface DoctorLayoutProps {
  children: React.ReactNode;
}

const DoctorLayout: React.FC<DoctorLayoutProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile: storedProfile } = useDecryptedProfile();
  const { profile, loading, error } = useSelector(
    (state: RootState) => state.user,
  );

  useEffect(() => {
    // Only fetch if we don't have a profile in Redux store
    if (!profile && !storedProfile) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, profile, storedProfile]);

  if (loading) {
    return <CdLoader />;
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-2xl font-semibold text-red-600">
          Oops! Something went wrong.
        </h2>
        <p className="text-gray-600 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <ProfileProvider profile={profile || storedProfile}>
      <DoctorHomeHeader />
      <main className="flex-grow pb-14 sm:pb-2 bg-muted">
        {children}
      </main>
      <div className="hidden sm:block">
        <Footer />
      </div>
      <ToastContainer />
    </ProfileProvider>
  );
};

export default DoctorLayout; 