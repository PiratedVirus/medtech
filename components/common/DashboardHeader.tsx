"use client";

import Link from "next/link";
import {
  LogOut,
  User,
  Home,
  LayoutGrid,
  Clipboard,
  FileText,
  ShieldPlus,
  TestTubeDiagonal,
  MoreHorizontal as MoreIcon,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/store/userSlice";
import { useProfile } from "@/hooks/context/ProfileContext";
import { useRouter, usePathname } from "next/navigation";
import type { AppDispatch } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useDecryptedProfile } from "@/hooks/use-profile";

const fullNavigation = [
  { name: "Home", href: "/dashboard", current: true, icon: Home },
  { name: "Doctors", href: "/dashboard/doctors", current: false, icon: ShieldPlus },
  { name: "Dieticians", href: "/dashboard/dieticians", current: false, icon: ShieldPlus },
  { name: "Lab", href: "/dashboard/labs", current: false, icon: Clipboard },
  { name: "Prescriptions", href: "/dashboard/prescriptions", current: false, icon: FileText },
  { name: "Appointments", href: "/dashboard/appointments", current: false, icon: TestTubeDiagonal },
  { name: "Plans", href: "/dashboard/plans", current: false, icon: LayoutGrid },
];

const mobileNavigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Doctors", href: "/dashboard/doctors", icon: ShieldPlus },
  { name: "Plans", href: "/dashboard/plans", icon: LayoutGrid },
  { name: "Labs", href: "/dashboard/labs", icon: TestTubeDiagonal },
  { name: "Profile", href: "/dashboard/profile", icon: User }, // we'll replace this one
];

export function DashboardHeader() {
  const { profile } = useProfile();
  const { isDoctor } = useDecryptedProfile();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push("/login");
  };

  const navigationItems = fullNavigation.map((item) => ({
    ...item,
    current:
      (item.href === "/dashboard/appointments" || item.href === "/dashboard/labs")
        ? pathname.startsWith(item.href)
        : pathname === item.href,
  }));

  const mobileNavigationItems = mobileNavigation.map((item) => ({
    ...item,
    current: pathname === item.href,
  }));

  const handleProfileClick = () => {
    if (isDoctor) {
      router.push("/dashboard/profile");
    } else {
      router.push("/dashboard/patient-profile");
    }
  };

  return (
    <>
      {/* Top Header for Non-Mobile Screens */}
      <header className="hidden md:flex w-full h-16 bg-background border-b">
        <div className="container flex items-center justify-between h-full gap-4">
          <div className="pl-20">
            <nav className="flex items-center gap-9">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative text-sm font-medium hover:text-secondary ${
                    item.current ? "text-secondary" : "text-foreground"
                  } hover:text-primary transition-colors`}
                >
                  {item.name}
                  {item.current && (
                    <span className="absolute bottom-[-2px] right-[1px] w-1/3 h-[1.5px] rounded-full bg-secondary" />
                  )}
                </Link>
              ))}
            </nav>
          </div>
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 px-4 py-2 w-32 rounded-xl border border-border cursor-pointer">
                <User className="h-6 w-6" />
                <span className="text-sm text-foreground">
                  {profile?.name?.trim().split(/\s+/)[0] ?? ""}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white text-black w-32">
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4 text-red-500" />
                <span className="text-red-500">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Bottom Navigation for Mobile Screens */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-background border-t">
        {/* Render first four items as before */}
        {mobileNavigationItems.slice(0, -1).map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 ${
              item.current ? "text-secondary" : "text-foreground"
            } hover:text-primary transition-colors`}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs">{item.name}</span>
          </Link>
        ))}

        {/* "More" dropdown in place of Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex-1 flex flex-col items-center justify-center py-2 text-foreground hover:text-primary transition-colors"
            >
              <MoreIcon className="h-6 w-6" />
              <span className="text-xs">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white text-black" align="center">
            <DropdownMenuItem onClick={() => router.push("/dashboard/appointments")}>
              Appointments
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/dieticians")}>
              Dieticians
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleProfileClick}>
              Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </>
  );
}