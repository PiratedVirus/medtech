'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  User, 
  Save,
  ArrowLeft,
  Building2
} from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'react-toastify'

interface AdminFormData {
  name: string
  email: string
  phoneNumber: string
  clinicId: string
  status: string
}

interface Clinic {
  id: number
  name: string
}

export default function EditAdminPage() {
  const { adminId } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [formData, setFormData] = useState<AdminFormData>({
    name: '',
    email: '',
    phoneNumber: '',
    clinicId: '',
    status: 'ACTIVE'
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminRes, clinicsRes] = await Promise.all([
          axios.get(`/api/superadmin/admins/${adminId}`),
          axios.get('/api/superadmin/clinics')
        ])
        
        const admin = adminRes.data
        setFormData({
          name: admin.name || '',
          email: admin.email || '',
          phoneNumber: admin.phoneNumber || '',
          clinicId: admin.clinicId?.toString() || '',
          status: admin.status || 'ACTIVE'
        })
        
        setClinics(clinicsRes.data.clinics || [])
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to fetch admin details')
      } finally {
        setLoading(false)
      }
    }

    if (adminId) {
      fetchData()
    }
  }, [adminId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await axios.put(`/api/superadmin/admins/${adminId}`, formData)
      
      if (response.data.success) {
        toast.success('Admin updated successfully')
        router.push('/superadmin/admins')
      } else {
        throw new Error(response.data.error || 'Update failed')
      }
    } catch (error) {
      console.error('Failed to update admin:', error)
      toast.error('Failed to update admin')
    } finally {
      setSaving(false)
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
    <div className="p-6 mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/superadmin/admins">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admins
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Admin</h1>
          <p className="text-gray-600 mt-1">Update admin information and settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Admin Information
            </CardTitle>
            <CardDescription>
              Update the admin's personal information and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter admin's full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@clinic.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicId">Assigned Clinic *</Label>
              <Select
                value={formData.clinicId}
                onValueChange={(value) => handleSelectChange('clinicId', value)}
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
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button asChild variant="outline">
            <Link href="/superadmin/admins">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
