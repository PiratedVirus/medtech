'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

interface Clinic {
  id: number
  name: string
}

interface AdminFormData {
  name: string
  email: string
  phoneNumber: string
  password: string
  clinicId: string
}

export default function CreateAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [formData, setFormData] = useState<AdminFormData>({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    clinicId: '',
  })

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await axios.get('/api/superadmin/clinics')
        setClinics(response.data.clinics || [])
      } catch (error) {
        console.error('Failed to fetch clinics:', error)
      }
    }

    fetchClinics()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/superadmin/admins', formData)
      
      if (response.data.success) {
        router.push('/superadmin/admins')
      } else {
        setError(response.data.error || 'Failed to create admin')
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create admin')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof AdminFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/superadmin/admins">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admins
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Admin</h1>
          <p className="text-gray-600 mt-2">Create an admin user for a specific clinic</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Admin Details
          </CardTitle>
          <CardDescription>
            Fill in the details for the new admin user. This admin will have access to manage their assigned clinic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter admin's full name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="admin@clinic.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter secure password"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicId">Assign to Clinic *</Label>
              <Select
                value={formData.clinicId}
                onValueChange={(value) => handleInputChange('clinicId', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a clinic" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {clinic.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                This admin will have access to manage the selected clinic
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Button asChild variant="outline" disabled={loading}>
                <Link href="/superadmin/admins">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Admin'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
