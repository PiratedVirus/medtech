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
  ArrowLeft,
  Palette,
  Globe,
  Mail,
  Phone
} from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'react-toastify'

interface SocialLinks {
  facebook?: string
  instagram?: string
  youtube?: string
  twitter?: string
  linkedin?: string
}

interface ClinicFormData {
  name: string
  subdomain?: string
  domain?: string
  address?: string
  contactInfo?: string
  timings?: string
  subtitle?: string
  logo?: string           // Square logo for prescription headers
  footerLogo?: string     // Rectangular/wide logo for footer display
  // New branding fields
  email?: string
  phone?: string
  footerTagline?: string
  socialLinks?: SocialLinks
  primaryColor?: string
  secondaryColor?: string
  copyrightText?: string
}

export default function EditClinicPage() {
  const { clinicId } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
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
  const [uploadingFooterLogo, setUploadingFooterLogo] = useState(false)
  
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

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const response = await axios.get(`/api/superadmin/clinics/${clinicId}`)
        const clinic = response.data
        
        // Parse socialLinks if it's a string
        let socialLinks = clinic.socialLinks
        if (typeof socialLinks === 'string') {
          try {
            socialLinks = JSON.parse(socialLinks)
          } catch {
            socialLinks = {}
          }
        }

        setFormData({
          name: clinic.name || '',
          subdomain: clinic.subdomain || '',
          domain: clinic.domain || '',
          address: clinic.address || '',
          contactInfo: clinic.contactInfo || '',
          timings: clinic.timings || '',
          subtitle: clinic.subtitle || '',
          logo: clinic.logo || '',
          footerLogo: clinic.footerLogo || '',
          email: clinic.email || '',
          phone: clinic.phone || '',
          footerTagline: clinic.footerTagline || '',
          socialLinks: {
            facebook: socialLinks?.facebook || '',
            instagram: socialLinks?.instagram || '',
            youtube: socialLinks?.youtube || '',
            twitter: socialLinks?.twitter || '',
            linkedin: socialLinks?.linkedin || '',
          },
          primaryColor: clinic.primaryColor || '#134F30',
          secondaryColor: clinic.secondaryColor || '#F28A2E',
          copyrightText: clinic.copyrightText || '',
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
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
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
      uploadFormData.append('clinicId', clinicId as string)
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
        toast.success(`${logoType === 'logo' ? 'Logo' : 'Footer logo'} uploaded successfully`)
      } else {
        throw new Error(response.data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Logo upload failed:', error)
      toast.error(`Failed to upload ${logoType === 'logo' ? 'logo' : 'footer logo'}`)
    } finally {
      if (logoType === 'logo') {
        setUploadingLogo(false)
      } else {
        setUploadingFooterLogo(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Clean up social links - remove empty ones
      const cleanedSocialLinks = formData.socialLinks 
        ? Object.fromEntries(
            Object.entries(formData.socialLinks).filter(([_, v]) => v && v.trim() !== '')
          )
        : null

      const submitData = {
        ...formData,
        socialLinks: cleanedSocialLinks && Object.keys(cleanedSocialLinks).length > 0 
          ? cleanedSocialLinks 
          : null,
      }

      const response = await axios.put(`/api/superadmin/clinics/${clinicId}`, submitData)
      
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/superadmin/clinics">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clinics
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Clinic</h1>
          <p className="text-gray-600 mt-1">Update clinic information and branding</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview Card */}
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
              <div className="w-32 h-32 rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
                {formData.logo ? (
                  <img
                    src={formData.logo}
                    alt="Clinic logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="h-16 w-16 text-gray-400" />
                )}
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formData.name || 'Clinic Name'}
                </h3>
                {formData.subdomain && (
                  <p className="text-sm text-green-600 font-mono bg-green-50 px-2 py-1 rounded">
                    {formData.subdomain}.{baseDomain}
                  </p>
                )}
                {formData.subtitle && (
                  <p className="text-sm text-gray-600">
                    {formData.subtitle}
                  </p>
                )}
              </div>
              
              {/* Color Preview */}
              <div className="w-full pt-4 border-t">
                <p className="text-sm font-medium mb-2">Brand Colors</p>
                <div className="flex gap-2">
                  <div 
                    className="w-10 h-10 rounded-lg border"
                    style={{ backgroundColor: formData.primaryColor }}
                    title="Primary Color"
                  />
                  <div 
                    className="w-10 h-10 rounded-lg border"
                    style={{ backgroundColor: formData.secondaryColor }}
                    title="Secondary Color"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Card */}
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
                    <Label htmlFor="subdomain">Subdomain *</Label>
                    <Input
                      id="subdomain"
                      name="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().trim();
                        handleInputChange({ target: { name: 'subdomain', value } } as React.ChangeEvent<HTMLInputElement>);
                      }}
                      placeholder="clinic1"
                      required
                      pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
                      title="3-63 characters, alphanumeric with hyphens only"
                    />
                    <p className="text-xs text-gray-500">
                      Used for patient portal URL
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain">Website URL</Label>
                    <Input
                      id="domain"
                      name="domain"
                      value={formData.domain}
                      onChange={handleInputChange}
                      placeholder="clinic.com"
                    />
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

            {/* Logo Card - Square Logo for Prescriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Clinic Logo (Square)
                </CardTitle>
                <CardDescription>
                  Square logo used in prescription headers (max 5MB, JPG/PNG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.logo && (
                  <div className="flex items-center gap-4">
                    <img
                      src={formData.logo}
                      alt="Current logo"
                      className="h-20 w-20 rounded-lg object-contain border bg-gray-50"
                    />
                    <div>
                      <p className="text-sm text-gray-600">Current square logo</p>
                      <p className="text-xs text-gray-500">Used in prescriptions</p>
                      <Button
                        type="button"
                        variant="destructive"
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
                  <Label htmlFor="logo">Upload Square Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'logo')}
                    disabled={uploadingLogo}
                    className="cursor-pointer"
                  />
                  {uploadingLogo && (
                    <p className="text-sm text-blue-600">Uploading logo...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Footer Logo Card - Rectangular/Wide Logo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Footer Logo (Rectangular)
                </CardTitle>
                <CardDescription>
                  Wide/rectangular logo displayed in the footer (max 5MB, JPG/PNG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.footerLogo && (
                  <div className="flex items-center gap-4">
                    <img
                      src={formData.footerLogo}
                      alt="Current footer logo"
                      className="h-16 w-auto max-w-[200px] rounded-lg object-contain border bg-gray-50"
                    />
                    <div>
                      <p className="text-sm text-gray-600">Current footer logo</p>
                      <p className="text-xs text-gray-500">Used in website footer</p>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, footerLogo: '' }))}
                        className="mt-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="footerLogo">Upload Footer Logo</Label>
                  <Input
                    id="footerLogo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'footerLogo')}
                    disabled={uploadingFooterLogo}
                    className="cursor-pointer"
                  />
                  {uploadingFooterLogo && (
                    <p className="text-sm text-blue-600">Uploading footer logo...</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Recommended: 250x50px or similar wide format
                  </p>
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
                  Customize how the clinic appears in the footer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="contact@clinic.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footerTagline">Footer Tagline</Label>
                  <Input
                    id="footerTagline"
                    name="footerTagline"
                    value={formData.footerTagline}
                    onChange={handleInputChange}
                    placeholder="Connecting Patients with Doctors, Seamlessly"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        name="primaryColor"
                        type="color"
                        value={formData.primaryColor}
                        onChange={handleInputChange}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleInputChange}
                        placeholder="#134F30"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        name="secondaryColor"
                        type="color"
                        value={formData.secondaryColor}
                        onChange={handleInputChange}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        name="secondaryColor"
                        value={formData.secondaryColor}
                        onChange={handleInputChange}
                        placeholder="#F28A2E"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="copyrightText">Custom Copyright Text</Label>
                  <Input
                    id="copyrightText"
                    name="copyrightText"
                    value={formData.copyrightText}
                    onChange={handleInputChange}
                    placeholder="Leave empty for default"
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
                  Add social media links to display in the footer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={formData.socialLinks?.facebook || ''}
                      onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/clinic"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.socialLinks?.instagram || ''}
                      onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                      placeholder="https://instagram.com/clinic"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={formData.socialLinks?.youtube || ''}
                      onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                      placeholder="https://youtube.com/@clinic"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter / X</Label>
                    <Input
                      id="twitter"
                      value={formData.socialLinks?.twitter || ''}
                      onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                      placeholder="https://twitter.com/clinic"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={formData.socialLinks?.linkedin || ''}
                      onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/clinic"
                    />
                  </div>
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
