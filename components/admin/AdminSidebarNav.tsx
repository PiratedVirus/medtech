"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Settings,
  Stethoscope,
  Users,
  X,
  Home,
  BriefcaseMedical,
  HeartPulse,
  Hospital,
  Leaf,
  IndianRupee

} from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarNav({ className, ...props }: SidebarNavProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(true) // Set to true for default collapsed state

  const routes = [
    {
      href: "/admin",
      icon: Home,
      title: "Home",
    },
    {
      href: "/admin/users",
      icon: Users,
      title: "Users",
    },

    {
      href: "/admin/patients",
      icon: HeartPulse,
      title: "Patients",
    },

    {
      href: "/admin/dieticians",
      icon: Leaf,
      title: "Dieticians",
    },
    {
      href: "/admin/doctors",
      icon: Stethoscope,
      title: "Doctors",
    },
    {
      href: "/admin/appointments",
      icon: Calendar,
      title: "Appointments",
    },
    {
      href: "/admin/labs",
      icon: ClipboardList,
      title: "Labs",
    },
    {
      href: "/admin/clinics",
      icon: Hospital,
      title: "Clinics",
    },
    {
      href: "/admin/payments",
      icon: IndianRupee,
      title: "Payments",
    },
    {
      href: "/admin/slots",
      icon: Calendar,
      title: "Slots",
    },
    {
      href: "/admin/plans",
      icon: Settings,
      title: "Plans",
    },
  ]
  return (
    <>
      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="space-y-4 py-4">
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold tracking-tight">CareDiabetics Clinic</h2>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </div>
              <div className="space-y-1">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      pathname === route.href ? "bg-primary text-primary-foreground" : "transparent",
                    )}
                  >
                    <route.icon className="h-5 w-5" />
                    {route.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="px-3 py-2 border-t">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/logout">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation - Fixed and Collapsible */}
      <div
        className={cn(
          "hidden md:flex md:flex-col fixed top-0 left-0 h-screen border-r bg-background z-30 transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          className,
        )}
        {...props}
      >
        <div className="space-y-4 py-4 flex flex-col h-full">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-6 px-2">
              {!collapsed && <h2 className="text-lg font-semibold text-primary tracking-tight">CareDiabetics Clinic</h2>}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className={cn("ml-auto", collapsed && "mx-auto")}
              >
                {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </Button>
            </div>
            <div className="space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === route.href ? "bg-primary text-primary-foreground" : "transparent",
                  )}
                  title={collapsed ? route.title : undefined}
                >
                  <route.icon className="h-5 w-5" />
                  {!collapsed && route.title}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-auto px-3 py-2 border-t">
            <Button variant="outline" className={cn("w-full", collapsed ? "justify-center" : "justify-start")} asChild>
              <Link href="/logout" title={collapsed ? "Sign Out" : undefined}>
                <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
                {!collapsed && "Sign Out"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function LogOut(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  )
}
