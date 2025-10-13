'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSuperAdminAuth } from '@/hooks/use-superadmin-auth'
import CdLoader from '@/components/ui/custom/cd-loader'
import { SuperAdminSidebar } from '@/components/superadmin/SuperAdminSidebar'
import { SuperAdminHeader } from '@/components/superadmin/SuperAdminHeader'

interface SuperAdminLayoutProps {
  children: React.ReactNode
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const { superAdmin, loading: superAdminLoading, isAuthenticated, logout } = useSuperAdminAuth()
  const error = !superAdminLoading && !isAuthenticated
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!superAdminLoading && !isAuthenticated) {
      router.push('/superadmin/login')
    }
  }, [superAdminLoading, isAuthenticated, router])

  if (superAdminLoading) {
    return <CdLoader />
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-2xl font-semibold text-red-600">
          Oops! Something went wrong.
        </h2>
        <p className="text-gray-600 mt-2">{error}</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar 
        logout={logout} 
        collapsed={collapsed} 
        onCollapsedChange={setCollapsed}
      />
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'md:ml-16' : ''}`}>
        <SuperAdminHeader />
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}

export default SuperAdminLayout
