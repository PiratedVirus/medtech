'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2, 
  Mail,
  Phone,
  Calendar,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

interface Admin {
  id: number
  name: string
  email: string
  phoneNumber: string
  status: string
  createdAt: string
  clinic: {
    id: number
    name: string
  }
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axios.get('/api/superadmin/admins')
        setAdmins(response.data.admins || [])
      } catch (error) {
        console.error('Failed to fetch admins:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdmins()
  }, [])

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.clinic.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800'
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admins Management</h1>
          <p className="text-gray-600 mt-2">Manage admin users across all clinics</p>
        </div>
        <Button asChild>
          <Link href="/superadmin/admins/create">
            <Plus className="h-4 w-4 mr-2" />
            Add New Admin
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search admins by name, email, or clinic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Admins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAdmins.map((admin) => (
          <Card key={admin.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{admin.name}</CardTitle>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(admin.status)}>
                  {admin.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{admin.clinic.name}</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{admin.phoneNumber}</span>
              </div>

              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                Created {new Date(admin.createdAt).toLocaleDateString()}
              </div>

              <div className="flex space-x-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/superadmin/admins/${admin.id}`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/superadmin/admins/${admin.id}/permissions`}>
                    <Shield className="h-4 w-4 mr-1" />
                    Permissions
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAdmins.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No admins found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first admin user'}
          </p>
          {!searchTerm && (
            <Button asChild>
              <Link href="/superadmin/admins/create">
                <Plus className="h-4 w-4 mr-2" />
                Create First Admin
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
