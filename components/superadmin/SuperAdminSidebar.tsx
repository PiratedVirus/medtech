'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  Users, 
  UserPlus, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  Brain,
  Bell
} from 'lucide-react'

interface SuperAdminSidebarProps {
  logout: () => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

const navigation = [
  { name: 'Dashboard', href: '/superadmin', icon: Home },
  { name: 'Clinics', href: '/superadmin/clinics', icon: Building2 },
  { name: 'Admins', href: '/superadmin/admins', icon: Users },
  { name: 'Analytics', href: '/superadmin/analytics', icon: BarChart3 },
  { name: 'LLM Playground', href: '/superadmin/llm-playground', icon: Brain },
  { name: 'Push Notifications', href: '/superadmin/push-notifications', icon: Bell },
  { name: 'Settings', href: '/superadmin/settings', icon: Settings },
]

export function SuperAdminSidebar({ 
  logout, 
  collapsed, 
  onCollapsedChange 
}: SuperAdminSidebarProps) {
  const pathname = usePathname()

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">Super Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange(!collapsed)}
            className="p-1"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={`w-full justify-start ${
                    collapsed ? 'px-2' : 'px-3'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${collapsed ? '' : 'mr-3'}`} />
                  {!collapsed && item.name}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={logout}
            className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 ${
              collapsed ? 'px-2' : 'px-3'
            }`}
          >
            <LogOut className={`h-4 w-4 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </div>
    </div>
  )
}
