'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'react-toastify'

interface Clinic {
  id: number
  name: string
  subdomain?: string
  domain?: string
  address?: string
  contactInfo?: string
  logo?: string
  timings?: string
  subtitle?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  _count: {
    users: number
  }
}

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingClinicId, setDeletingClinicId] = useState<number | null>(null)

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await axios.get('/api/superadmin/clinics')
        setClinics(response.data.clinics || [])
      } catch (error) {
        console.error('Failed to fetch clinics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClinics()
  }, [])

  const filteredClinics = clinics.filter(clinic =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.subdomain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteClinic = async (clinicId: number, clinicName: string) => {
    const confirmed = window.confirm(
      `Delete clinic "${clinicName}"? This action will hide the clinic from active lists.`
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingClinicId(clinicId)
      await axios.delete(`/api/superadmin/clinics/${clinicId}`)
      setClinics((prevClinics) => prevClinics.filter((clinic) => clinic.id !== clinicId))
      toast.success('Clinic deleted successfully')
    } catch (error) {
      console.error('Failed to delete clinic:', error)
      toast.error('Failed to delete clinic')
    } finally {
      setDeletingClinicId(null)
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
          <h1 className="text-3xl font-bold text-gray-900">Clinics Management</h1>
          <p className="text-gray-600 mt-2">Manage all client clinics in your platform</p>
        </div>
        <Button asChild>
          <Link href="/superadmin/clinics/create">
            <Plus className="h-4 w-4 mr-2" />
            Add New Clinic
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search clinics by name or subdomain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clinics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClinics.map((clinic) => (
          <Card key={clinic.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {clinic.logo ? (
                    <img
                      src={clinic.logo}
                      alt={clinic.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{clinic.name}</CardTitle>
                    {clinic.subtitle && (
                      <p className="text-sm text-gray-600">{clinic.subtitle}</p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary">
                  {clinic._count.users} users
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {clinic.subdomain && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">Subdomain:</span>
                  <span className="ml-2 font-mono bg-green-100 text-green-700 px-2 py-1 rounded">
                    {clinic.subdomain}
                  </span>
                </div>
              )}

              {clinic.address && (
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="truncate">{clinic.address}</span>
                </div>
              )}

              {clinic.contactInfo && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{clinic.contactInfo}</span>
                </div>
              )}

              {clinic.timings && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{clinic.timings}</span>
                </div>
              )}

              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                Created {new Date(clinic.createdAt).toLocaleDateString()}
              </div>

              <div className="flex space-x-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/superadmin/clinics/${clinic.id}/edit`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href="/superadmin/clinics/admins">
                    <Users className="h-4 w-4 mr-1" />
                    Admins
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClinic(clinic.id, clinic.name)}
                  disabled={deletingClinicId === clinic.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClinics.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clinics found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first clinic'}
          </p>
          {!searchTerm && (
            <Button asChild>
              <Link href="/superadmin/clinics/create">
                <Plus className="h-4 w-4 mr-2" />
                Create First Clinic
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
