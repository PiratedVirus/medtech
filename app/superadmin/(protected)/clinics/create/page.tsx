'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, ArrowLeft, Palette, Globe, Mail, Phone, Upload, X } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

interface SocialLinks {
  facebook?: string
  instagram?: string
  youtube?: string
  twitter?: string
  linkedin?: string
}

interface ClinicFormData {
  name: string
  subdomain: string
  domain: string
  address: string
  contactInfo: string
  timings: string
  subtitle: string
  logo: string           // Square logo for prescription headers
  footerLogo: string     // Rectangular/wide logo for footer display
  // New branding fields
  email: string
  phone: string
  footerTagline: string
  socialLinks: SocialLinks
  primaryColor: string
  secondaryColor: string
  copyrightText: string
}

export default function CreateClinicPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFooterLogo, setUploadingFooterLogo] = useState(false)
  const [formData, setFormData] = useState<ClinicFormData>({
    name: '',
    subdomain: '',
    domain: '',
    address: '',
    contactInfo: '',
    timings: '',
    subtitle: '',
    logo: '',
    footerLogo: '',
    // New branding fields
    email: '',
    phone: '',
    footerTagline: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      youtube: '',
      twitter: '',
      linkedin: '',
    },
    primaryColor: '#134F30',
    secondaryColor: '#F28A2E',
    copyrightText: '',
  })
  
  // Get the current base domain for subdomain preview
  const [baseDomain, setBaseDomain] = useState('localhost:3000')
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const port = window.location.port
      // Extract the base domain (e.g., carediabetics.com from cd.carediabetics.com)
      const parts = hostname.split('.')
      if (parts.length >= 2) {
        // Remove subdomain if present
        const base = parts.slice(-2).join('.')
        setBaseDomain(port ? `${base}:${port}` : base)
      } else {
        setBaseDomain(port ? `${hostname}:${port}` : hostname)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Clean up social links - remove empty ones
      const cleanedSocialLinks = Object.fromEntries(
        Object.entries(formData.socialLinks).filter(([_, v]) => v && v.trim() !== '')
      )

      const submitData = {
        ...formData,
        socialLinks: Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : null,
      }

      const response = await axios.post('/api/superadmin/clinics', submitData)
      
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

  const handleSocialLinkChange = (platform: keyof SocialLinks, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, logoType: 'logo' | 'footerLogo' = 'logo') => {
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

    if (logoType === 'logo') {
      setUploadingLogo(true)
    } else {
      setUploadingFooterLogo(true)
    }

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('logoType', logoType)

      const response = await axios.post('/api/upload/clinic-logo', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          [logoType]: response.data.url
        }))
        setError('')
      } else {
        throw new Error(response.data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Logo upload failed:', error)
      setError(`Failed to upload ${logoType === 'logo' ? 'logo' : 'footer logo'}`)
    } finally {
      if (logoType === 'logo') {
        setUploadingLogo(false)
      } else {
        setUploadingFooterLogo(false)
      }
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
          <p className="text-gray-600 mt-2">Set up a new clinic instance with branding</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Fill in the basic details for the new clinic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <Label htmlFor="subtitle">Subtitle / Tagline</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  placeholder="Brief description or tagline"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain *</Label>
                <Input
                  id="subdomain"
                  value={formData.subdomain}
                  onChange={(e) => handleInputChange('subdomain', e.target.value.toLowerCase().trim())}
                  placeholder="clinic1"
                  required
                  disabled={loading}
                  pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
                  title="3-63 characters, alphanumeric with hyphens only"
                />
                <p className="text-xs text-gray-500">
                  Used for patient portal URL (e.g., clinic1.{baseDomain})
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Website URL</Label>
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

            {/* Square Logo Section */}
            <div className="space-y-2">
              <Label htmlFor="logo" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Square Logo (for Prescriptions)
              </Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => handleLogoUpload(e, 'logo')}
                disabled={loading || uploadingLogo}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Square logo used in prescription headers (max 5MB, JPG/PNG)
              </p>
              {uploadingLogo && (
                <p className="text-sm text-blue-600">Uploading logo...</p>
              )}
              {formData.logo && (
                <div className="mt-2 flex items-center gap-4">
                  <img
                    src={formData.logo}
                    alt="Clinic logo preview"
                    className="h-20 w-20 rounded-lg object-contain border bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {/* Footer Logo Section */}
            <div className="space-y-2">
              <Label htmlFor="footerLogo" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Footer Logo (Rectangular)
              </Label>
              <Input
                id="footerLogo"
                type="file"
                accept="image/*"
                onChange={(e) => handleLogoUpload(e, 'footerLogo')}
                disabled={loading || uploadingFooterLogo}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Wide/rectangular logo for footer display (recommended: 250x50px)
              </p>
              {uploadingFooterLogo && (
                <p className="text-sm text-blue-600">Uploading footer logo...</p>
              )}
              {formData.footerLogo && (
                <div className="mt-2 flex items-center gap-4">
                  <img
                    src={formData.footerLogo}
                    alt="Footer logo preview"
                    className="h-16 w-auto max-w-[200px] rounded-lg object-contain border bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, footerLogo: '' }))}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer & Branding Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Footer & Branding
            </CardTitle>
            <CardDescription>
              Customize how the clinic appears in the footer and throughout the portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contact@clinic.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Phone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 9876543210"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerTagline">Footer Tagline</Label>
              <Input
                id="footerTagline"
                value={formData.footerTagline}
                onChange={(e) => handleInputChange('footerTagline', e.target.value)}
                placeholder="Connecting Patients with Doctors, Seamlessly"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Displayed below the logo in the footer
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    disabled={loading}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    placeholder="#134F30"
                    disabled={loading}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500">Used for footer background and accents</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    disabled={loading}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    placeholder="#F28A2E"
                    disabled={loading}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500">Used for highlights and CTAs</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="copyrightText">Custom Copyright Text</Label>
              <Input
                id="copyrightText"
                value={formData.copyrightText}
                onChange={(e) => handleInputChange('copyrightText', e.target.value)}
                placeholder="Leave empty for default"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Social Media Links
            </CardTitle>
            <CardDescription>
              Add social media links to display in the footer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={formData.socialLinks.facebook}
                  onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/clinic"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/clinic"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                  placeholder="https://youtube.com/@clinic"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <Input
                  id="twitter"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/clinic"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/clinic"
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button asChild variant="outline" disabled={loading}>
            <Link href="/superadmin/clinics">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Clinic'}
          </Button>
        </div>
      </form>
    </div>
  )
}
