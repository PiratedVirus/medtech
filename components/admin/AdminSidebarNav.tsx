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
  FlaskConical,
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
  IndianRupee,
  LogOut,
  Link as LinkIcon,
  Brain,
  Bot,
  Cpu,
  Sparkles,
  Activity,
  TrendingUp,
  Zap,
  Code,
  Layers,
  Workflow
} from "lucide-react"
import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"


interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  logout: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (next: boolean) => void;
}

export function SidebarNav({ className, logout, collapsed: collapsedProp, onCollapsedChange, ...props }: SidebarNavProps) {
  const pathname = usePathname()
  const [internalCollapsed, setInternalCollapsed] = useState(false) // Default expanded
  const [clinicName, setClinicName] = useState('Loading...')
  const collapsed = typeof collapsedProp === 'boolean' ? collapsedProp : internalCollapsed
  const setCollapsed = (next: boolean) => {
    if (typeof onCollapsedChange === 'function') onCollapsedChange(next)
    if (typeof collapsedProp !== 'boolean') setInternalCollapsed(next)
  }

  // Fetch clinic name on component mount
  useEffect(() => {
    const fetchClinicName = async () => {
      try {
        const response = await fetch('/api/admin/auth/me', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        const data = await response.json()
        console.log('AdminSidebar - API Response:', data)
        if (data.success && data.user?.clinic?.name) {
          console.log('AdminSidebar - Setting clinic name to:', data.user.clinic.name)
          setClinicName(data.user.clinic.name)
        } else if (data.success && data.user && !data.user.clinic) {
          console.log('AdminSidebar - No clinic data found')
          setClinicName('⚠️ Please Re-login')
        } else {
          console.log('AdminSidebar - API failed or no user data')
          setClinicName('Clinic')
        }
      } catch (error) {
        console.error('AdminSidebar - Failed to fetch clinic name:', error)
        setClinicName('Clinic')
      }
    }
    fetchClinicName()
  }, [])
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
      href: "/admin/patients/analysis",
      icon: Brain,
      title: "AI Analysis",
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
      href: "/admin/doctors/referral-links",
      icon: LinkIcon,
      title: "Referral Links",
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
      href: "/admin/lab-bookings",
      icon: FlaskConical,
      title: "Lab Bookings",
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
                <h2 className="text-lg font-semibold tracking-tight">{clinicName}</h2>
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
            <Button onClick={logout} variant="outline" className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
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
              {!collapsed && <h2 className="text-lg font-semibold text-primary tracking-tight">{clinicName}</h2>}
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
            <Button onClick={logout} variant="outline" className="w-full justify-start">
              <LogOut className={cn("h-4 w-4", !collapsed && "mr-1")} />
              {!collapsed && "Sign Out"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
