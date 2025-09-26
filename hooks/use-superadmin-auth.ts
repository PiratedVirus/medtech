import { useState, useEffect } from 'react'
import axios from 'axios'

interface SuperAdminUser {
  id: number
  name: string
  email: string
  role: string
}

export function useSuperAdminAuth() {
  const [superAdmin, setSuperAdmin] = useState<SuperAdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/superadmin/auth/me')
        if (response.data.success) {
          setSuperAdmin(response.data.user)
          setIsAuthenticated(true)
        } else {
          setSuperAdmin(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        // Don't log errors for unauthenticated requests
        if (error.response?.status !== 401) {
          console.error('Super admin auth error:', error)
        }
        setSuperAdmin(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const logout = async () => {
    try {
      await axios.post('/api/superadmin/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setSuperAdmin(null)
      setIsAuthenticated(false)
    }
  }

  return {
    superAdmin,
    loading,
    isAuthenticated,
    logout,
  }
}
