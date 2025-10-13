'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Building2, 
  Upload, 
  X, 
  Save,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'react-toastify'

interface ClinicFormData {
  name: string
  domain?: string
  address?: string
  contactInfo?: string
  timings?: string
  subtitle?: string
  logo?: string
}

export default function EditClinicPage() {
  const { clinicId } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [formData, setFormData] = useState<ClinicFormData>({
    name: '',
    domain: '',
    address: '',
    contactInfo: '',
    timings: '',
    subtitle: '',
    logo: ''
  })

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const response = await axios.get(`/api/superadmin/clinics/${clinicId}`)
        const clinic = response.data
        setFormData({
          name: clinic.name || '',
          domain: clinic.domain || '',
          address: clinic.address || '',
          contactInfo: clinic.contactInfo || '',
          timings: clinic.timings || '',
          subtitle: clinic.subtitle || '',
          logo: clinic.logo || ''
        })
      } catch (error) {
        console.error('Failed to fetch clinic:', error)
        toast.error('Failed to fetch clinic details')
      } finally {
        setLoading(false)
      }
    }

    if (clinicId) {
      fetchClinic()
    }
  }, [clinicId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clinicId', clinicId as string)

      const response = await axios.post('/api/upload/clinic-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          logo: response.data.url
        }))
        toast.success('Logo uploaded successfully')
      } else {
        throw new Error(response.data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Logo upload failed:', error)
      toast.error('Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await axios.put(`/api/superadmin/clinics/${clinicId}`, formData)
      
      if (response.data.success) {
        toast.success('Clinic updated successfully')
        router.push('/superadmin/clinics')
      } else {
        throw new Error(response.data.error || 'Update failed')
      }
    } catch (error) {
      console.error('Failed to update clinic:', error)
      toast.error('Failed to update clinic')
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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/superadmin/clinics">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clinics
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Clinic</h1>
          <p className="text-gray-600 mt-1">Update clinic information and settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo Preview Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Clinic Preview
              </CardTitle>
              <CardDescription>
                How your clinic will appear
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-50">
                {formData.logo ? (
                  <img
                    src={formData.logo}
                    alt="Clinic logo"
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <Building2 className="h-16 w-16 text-gray-400" />
                )}
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formData.name || 'Clinic Name'}
                </h3>
                {formData.domain && (
                  <p className="text-sm text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">
                    {formData.domain}
                  </p>
                )}
                {formData.subtitle && (
                  <p className="text-sm text-gray-600">
                    {formData.subtitle}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update the basic details of the clinic
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Clinic Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter clinic name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  placeholder="clinic.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                placeholder="Brief description of the clinic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter clinic address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactInfo">Contact Information</Label>
                <Input
                  id="contactInfo"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleInputChange}
                  placeholder="Phone number or email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timings">Operating Hours</Label>
                <Input
                  id="timings"
                  name="timings"
                  value={formData.timings}
                  onChange={handleInputChange}
                  placeholder="e.g., Mon-Fri 9AM-5PM"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Clinic Logo
            </CardTitle>
            <CardDescription>
              Upload a logo for the clinic (max 5MB, JPG/PNG)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.logo && (
              <div className="flex items-center gap-4">
                <img
                  src={formData.logo}
                  alt="Current logo"
                  className="h-20 w-20 rounded-lg object-cover border"
                />
                <div>
                  <p className="text-sm text-gray-600">Current logo</p>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                    className="mt-2"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="logo">Upload New Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="cursor-pointer"
              />
              {uploadingLogo && (
                <p className="text-sm text-blue-600">Uploading logo...</p>
              )}
            </div>
          </CardContent>
        </Card>

            <div className="flex justify-end gap-4">
              <Button asChild variant="outline">
                <Link href="/superadmin/clinics">Cancel</Link>
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
      </div>
    </div>
  )
}
