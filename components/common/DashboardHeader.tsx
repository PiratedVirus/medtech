import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/store/userSlice";
import { useProfile } from "@/hooks/context/ProfileContext";
import { useRouter, usePathname } from "next/navigation";
import type { AppDispatch, RootState } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { name: "Home", href: "/dashboard", current: true },
  { name: "Doctors", href: "/dashboard/doctors", current: false },
  { name: "Dietician", href: "/dashboard/dietician", current: false },
  { name: "Lab Reports", href: "/dashboard/lab-reports", current: false },
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
    current: pathname === item.href,
  }));
  return (
    <header className="w-full h-28 bg-background border-b">
      <div className="container flex items-center justify-between h-full gap-4">
        <div className="pl-20">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search"
              className="pl-12 bg-input h-12 text-muted-foreground rounded-lg"
            />
          </div>
        </div>

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

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-border">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://c.animaapp.com/2DuHYCg5/img/ellipse-38-1@2x.png" />
              <AvatarFallback>MP</AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{profile?.name}</span>
          </div>
          <LogOut
            onClick={handleLogout}
            className="h-6 w-6 text-foreground cursor-pointer"
          />
        </div>
      </div>
    </header>
  );
}
