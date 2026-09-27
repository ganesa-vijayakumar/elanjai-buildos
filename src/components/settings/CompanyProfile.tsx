import { useState, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, FloppyDisk } from '@phosphor-icons/react'

interface CompanyProfileData {
  companyName: string
  contractorName: string
  contact: string
  address: string
  email: string
  website: string
  logo?: string
  gstPercentage: number
}

const DEFAULT_PROFILE: CompanyProfileData = {
  companyName: 'Elanjai Buildos',
  contractorName: 'Er. P. Sathish Kumar',
  contact: '9677265045',
  address: 'No.19, Pillayar Kovil Street, Old Pallavaram, Chennai – 600117',
  email: 'elanjaibuildos@gmail.com',
  website: 'www.elanjaibuildos.com',
  gstPercentage: 18,
}

export function CompanyProfile() {
  const [profile, setProfile] = useKV<CompanyProfileData>('company-profile', DEFAULT_PROFILE)
  const [localProfile, setLocalProfile] = useState<CompanyProfileData>(profile || DEFAULT_PROFILE)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (field: keyof CompanyProfileData, value: string | number) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setProfile(localProfile)
    toast.success('Company profile updated successfully')
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setLocalProfile(prev => ({ ...prev, logo: base64 }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Profile</CardTitle>
        <CardDescription>
          This information will be used in quotations, agreements, and official documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={localProfile.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractorName">Contractor Name</Label>
              <Input
                id="contractorName"
                value={localProfile.contractorName}
                onChange={(e) => handleChange('contractorName', e.target.value)}
                placeholder="Enter contractor name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  value={localProfile.contact}
                  onChange={(e) => handleChange('contact', e.target.value)}
                  placeholder="Enter contact number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={localProfile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={localProfile.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="Enter website URL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstPercentage">GST Percentage (%)</Label>
                <Input
                  id="gstPercentage"
                  type="number"
                  value={localProfile.gstPercentage}
                  onChange={(e) => handleChange('gstPercentage', Number(e.target.value))}
                  placeholder="18"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={localProfile.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Enter company address"
                rows={3}
              />
            </div>
          </div>

          <div className="w-full md:w-64 space-y-4">
            <div>
              <Label>Company Logo</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Upload your company logo (used in agreements)
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center gap-4 bg-gray-50">
              {localProfile.logo ? (
                <img
                  src={localProfile.logo}
                  alt="Company Logo"
                  className="max-w-full max-h-40 object-contain"
                />
              ) : (
                <div className="text-center">
                  <Upload size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No logo uploaded</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2" size={16} />
                {localProfile.logo ? 'Change Logo' : 'Upload Logo'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">
            <FloppyDisk className="mr-2" size={18} />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
