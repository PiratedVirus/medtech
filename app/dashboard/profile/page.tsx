'use client'
import { useDispatch } from "react-redux";
import { logoutUser } from "@/store/userSlice";
import type { AppDispatch } from "@/store";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ProfileForm } from "@/components/patients/profile/ProfilePlan";
export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const handleLogout = () => {
    dispatch(logoutUser());
    router.push("/login");
  };

  return (
    <div className="container px-4 sm:px-6 lg:px-20 max-w-screen-xl py-10">
      <div className="mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">Manage your account settings.</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-red-500 hover:text-red-600"
          >
            <LogOut className="h-5 w-5 mr-1" />
            Logout
          </button>
        </div>
        <div className="rounded-lg border shadow-sm">
            <ProfileForm />
        </div>
      </div>
    </div>
  )
}
