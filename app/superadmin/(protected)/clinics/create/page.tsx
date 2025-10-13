'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

interface ClinicFormData {
  name: string
  domain: string
  address: string
  contactInfo: string
  timings: string
  subtitle: string
  logo: string
}

export default function CreateClinicPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<ClinicFormData>({
    name: '',
    domain: '',
    address: '',
    contactInfo: '',
    timings: '',
    subtitle: '',
    logo: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/superadmin/clinics', formData)
      
      if (response.data.success) {
        router.push('/superadmin/clinics')
      } else {
        setError(response.data.error || 'Failed to create clinic')
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create clinic')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ClinicFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

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
        setError('')
      } else {
        throw new Error(response.data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Logo upload failed:', error)
      setError('Failed to upload logo')
    }
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/superadmin/clinics">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clinics
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Clinic</h1>
          <p className="text-gray-600 mt-2">Set up a new clinic instance for your client</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Clinic Details
          </CardTitle>
          <CardDescription>
            Fill in the details for the new clinic. This will create a completely separate instance.
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
                <Label htmlFor="name">Clinic Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter clinic name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  placeholder="Brief description or tagline"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Custom Domain</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                placeholder="clinic.com"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Optional: Custom domain for the clinic
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter clinic address"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contactInfo">Contact Information</Label>
                <Input
                  id="contactInfo"
                  value={formData.contactInfo}
                  onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                  placeholder="Phone number or contact details"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timings">Operating Hours</Label>
                <Input
                  id="timings"
                  value={formData.timings}
                  onChange={(e) => handleInputChange('timings', e.target.value)}
                  placeholder="e.g., 9:00 AM - 6:00 PM"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Clinic Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={loading}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Upload a logo for the clinic (max 5MB, JPG/PNG)
              </p>
              {formData.logo && (
                <div className="mt-2">
                  <img
                    src={formData.logo}
                    alt="Clinic logo preview"
                    className="h-20 w-20 rounded-lg object-cover border"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button asChild variant="outline" disabled={loading}>
                <Link href="/superadmin/clinics">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Clinic'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
