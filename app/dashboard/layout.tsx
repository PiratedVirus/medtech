"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile } from "@/store/userSlice";
import { usePathname } from "next/navigation"; // ✅ Replaces `useRouter()`
import { Lato } from "next/font/google";
import { DashboardHeader } from "@/components/ui/custom/cd-dashboard-header";
import "@/app/globals.css";
import type { AppDispatch, RootState } from "@/store";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, loading, error } = useSelector(
    (state: RootState) => state.user,
  );
  const pathname = usePathname(); // ✅ Keeps track of current page

  useEffect(() => {
    dispatch(fetchUserProfile()); // ✅ Fetch user details on mount
  }, [dispatch]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <html lang="en">
      <body className={`${lato.variable} antialiased`}>
        <DashboardHeader />
        <p>{JSON.stringify(profile)}</p>
        {children}
      </body>
    </html>
  );
}
