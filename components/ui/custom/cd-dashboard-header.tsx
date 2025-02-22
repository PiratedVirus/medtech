import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, LogOut } from "lucide-react"

const navigation = [
  { name: "Home", href: "/", current: true },
  { name: "Doctors", href: "/doctors", current: false },
  { name: "Dietician", href: "/dietician", current: false },
  { name: "Lab Reports", href: "/lab-reports", current: false },
  { name: "Prescriptions", href: "/prescriptions", current: false },
  { name: "Appointments", href: "/appointments", current: false },
  { name: "Plans", href: "/plans", current: false },
]

export function DashboardHeader() {
  return (
    <header className="w-full h-28 bg-background border-b">
      <div className="container flex items-center justify-between h-full gap-4">
        <div className="pl-20">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input type="search" placeholder="Search" className="pl-12 bg-input h-12 text-muted-foreground rounded-lg" />
          </div>
        </div>


        <nav className="flex items-center gap-9">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`relative text-sm font-medium mb-2 ${item.current ? "text-secondary" : "text-foreground"
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
            <span className="text-sm text-foreground">My profile</span>
          </div>
          <LogOut className="h-6 w-6 text-foreground cursor-pointer" />
        </div>
      </div>
    </header>
  )
}