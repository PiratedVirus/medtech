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


interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile: storedProfile } = useDecryptedProfile();
  const { profile, loading, error } = useSelector(
    (state: RootState) => state.user,
  );

  useEffect(() => {
    if (storedProfile) {
      dispatch({
        type: "user/fetchUserProfile/fulfilled",
        payload: storedProfile,
      });
    } else {
      dispatch(fetchUserProfile());
    }
  }, [dispatch]);

  if (loading) {
        return (
      <CdLoader />
    );
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
   
          <ProfileProvider profile={profile}>
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <div className="hidden sm:block">
              <Footer />
            </div>
          </ProfileProvider>
    
    );
};

export default DashboardLayout;
