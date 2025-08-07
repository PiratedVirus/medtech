"use client";

import { useDecryptedProfile } from "@/hooks/use-profile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Calendar, Users, FileText, Video, Clipboard, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/store/userSlice";
import type { AppDispatch } from "@/store";

const navigation = [
  { name: "Dashboard", href: "/doctor", icon: Calendar },
  { name: "Appointments", href: "/doctor/appointments", icon: Calendar },
  { name: "Patients", href: "/doctor/patients", icon: Users },
  { name: "Prescriptions", href: "/doctor/prescriptions", icon: FileText },
  { name: "Video Calls", href: "/doctor/video-calls", icon: Video },
  { name: "Referrals", href: "/doctor/referrals", icon: Clipboard },
  { name: "Settings", href: "/doctor/settings", icon: Settings },
];

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isDoctor, isLoading } = useDecryptedProfile();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!isLoading && !isDoctor) {
      router.push("/dashboard");
    }
  }, [isLoading, isDoctor, router]);

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary">Doctor Portal</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-primary"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-xl font-bold text-primary">Doctor Portal</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
        <div className="px-4 py-2 overflow-x-auto">
          <div className="flex space-x-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md whitespace-nowrap hover:bg-gray-100 hover:text-primary"
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
} 