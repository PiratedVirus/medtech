import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, LogOut, User } from "lucide-react";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/store/userSlice";
import { useProfile } from "@/hooks/context/ProfileContext";
import { useRouter, usePathname } from "next/navigation";
import type { AppDispatch, RootState } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

const navigation = [
  { name: "Home", href: "/dashboard", current: true },
  { name: "Doctors", href: "/dashboard/doctors", current: false },
  { name: "Dieticians", href: "/dashboard/dieticians", current: false },
  { name: "Lab", href: "/dashboard/labs", current: false },
  { name: "Prescriptions", href: "/dashboard/prescriptions", current: false },
  { name: "Appointments", href: "/dashboard/appointments", current: false },
  { name: "Plans", href: "/dashboard/plans", current: false },
];

export function DashboardHeader() {
  const { profile } = useProfile();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const handleLogout = () => {
    dispatch(logoutUser());
    router.push("/login");
  };
  const navigationItems = navigation.map((item) => ({
    ...item,
    current:
    (item.href === "/dashboard/appointments" || item.href === "/dashboard/labs") ? pathname.startsWith(item.href) : pathname === item.href,
  }));
  return (
    <header className="w-full h-28 bg-background border-b">
      <div className="container flex items-center justify-between h-full gap-4">

<div className="pl-20">
        <nav className="flex items-center gap-9">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`relative text-sm font-medium mb-2 hover:text-secondary ${
                item.current ? "text-secondary" : "text-foreground"
              } hover:text-primary transition-colors`}
            >
              {item.name}
              {item.current && (
                <span className="absolute bottom-[-2px] right-[1px] w-1/3 h-[1.5px] rounded-full bg-secondary"></span>
              )}
            </Link>
          ))}
        </nav>
        </div>

        {/* profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 px-4 py-2 w-32 rounded-xl border border-border cursor-pointer">
              <User className="h-6 w-6" />
              <span className="text-sm text-foreground">{profile?.name}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white text-black w-32">
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
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
  );
}
