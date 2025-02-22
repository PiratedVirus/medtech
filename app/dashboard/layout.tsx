'use client'
import type { Metadata } from "next";
import { Lato } from 'next/font/google'
import "@/app/globals.css";
import { DashboardHeader } from "@/components/ui/custom/cd-dashboard-header";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile } from "@/store/userSlice";
import { useRouter } from "next/router";
import type { AppDispatch, RootState } from "@/store";

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
})



export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, loading, error, phoneNumber } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (phoneNumber) {
      dispatch(fetchUserProfile(phoneNumber));
    }
  }, [dispatch, phoneNumber]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }
  return (
    <html lang="en">
      <body className={`${lato.variable} antialiased`}>
        <DashboardHeader  />
        {children}
      </body>
    </html>
  );
}
