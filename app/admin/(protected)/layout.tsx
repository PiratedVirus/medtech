"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile } from "@/store/userSlice";
import { ProfileProvider } from "@/hooks/context/ProfileContext";
import type { AppDispatch, RootState } from "@/store";
import "@/app/globals.css";
import { useDecryptedProfile } from "@/hooks/use-profile";
import CdLoader from "@/components/ui/custom/cd-loader";
import { SidebarNav } from "@/components/admin/AdminSidebarNav";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {

  const { admin, loading: adminLoading, isAuthenticated, logout } = useAdminAuth();
  const error = !adminLoading && !isAuthenticated;
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [adminLoading, isAuthenticated, router]);

  if (adminLoading) {
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav logout={logout} collapsed={collapsed} onCollapsedChange={setCollapsed}/>
      <div className={"flex-1 transition-all duration-300 " + (collapsed ? "md:ml-16" : "md:ml-64") }>
        <AdminHeader />
        <main className="flex-1 bg-white">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
