"use client";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile } from "@/store/userSlice";
import { usePathname } from "next/navigation";
import { Lato } from "next/font/google";
import { DashboardHeader } from "@/components/ui/custom/cd-dashboard-header";
import "@/app/globals.css";
import type { AppDispatch, RootState } from "@/store";
import { ProfileProvider } from "@/hooks/context/ProfileContext";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
});

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, loading, error } = useSelector(
    (state: RootState) => state.user,
  );
  const pathname = usePathname();
  const hasFetched = useRef(false); // ✅ Prevent double fetch

  useEffect(() => {
    if (!profile && !loading && !hasFetched.current) {
      hasFetched.current = true; // ✅ Mark as fetched to avoid duplicate calls
      dispatch(fetchUserProfile());
    }
  }, [dispatch, profile, loading]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-custom-green rounded-full animate-spin"></div>
      </div>
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
    <html lang="en">
      <body className={`${lato.variable} antialiased`}>
        <ProfileProvider profile={profile}>
          <DashboardHeader />
          {children}
        </ProfileProvider>
      </body>
    </html>
  );
};

export default DashboardLayout;
