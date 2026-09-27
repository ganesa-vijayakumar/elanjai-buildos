import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, FloppyDisk, PencilSimple, Trash } from '@phosphor-icons/react'
import { PackageType } from '@/lib/types'

interface PackageData {
  id: PackageType
  name: string
  ratePerSqft: number
  tagline: string
  isPopular?: boolean
  highlights: string[]
}

const DEFAULT_PACKAGES: PackageData[] = [
  {
    id: 'basic',
    name: 'Basic Package',
    ratePerSqft: 2200,
    tagline: 'Essential quality with standard finishes',
    highlights: [
      'Vitrified Tiles @ ₹60/sq.ft',
      'Parryware/Hindware bathroom fittings @ ₹20,000/bathroom',
      'Teak wood main door @ ₹20,000',
      'Orbit/GM electrical switches',
      'Kamachi or equivalent steel'
    ]
  },
  {
    id: 'standard',
    name: 'Standard Package',
    ratePerSqft: 2400,
    tagline: 'Enhanced quality with better brands',
    isPopular: true,
    highlights: [
      'Vitrified Tiles @ ₹70/sq.ft',
      'Wall-mounted commode (Parryware Indus)',
      'Bathroom fittings @ ₹30,000/bathroom',
      'Teak wood main door @ ₹30,000',
      'Anchor Roma switches',
      'ARS/ARUN branded steel',
      'River sand for plastering'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Package',
    ratePerSqft: 2600,
    tagline: 'Top-tier materials, premium brands, luxury finishes',
    highlights: [
      'Anti-termite treatment included',
      'Granite staircase flooring @ ₹150/sq.ft',
      'Jaguar bathroom fittings @ ₹40,000/bathroom',
      'Legrand electrical switches',
      'Ultratech/Coromandel cement',
      'Fe550D TMT bars (I Steel)',
      'Fosroc waterproofing',
      'UPVC Venesta/Etti windows @ ₹600/sq.ft'
    ]
  }
]

export function PackageConfiguration() {
  const [packages, setPackages] = useKV<PackageData[]>('construction-packages', DEFAULT_PACKAGES)
  const [editingId, setEditingId] = useState<PackageType | null>(null)
  const [localPackages, setLocalPackages] = useState<PackageData[]>(packages || DEFAULT_PACKAGES)

  const handleRateChange = (id: PackageType, value: string) => {
    const numValue = parseFloat(value) || 0
    setLocalPackages(prev => 
      prev.map(pkg => pkg.id === id ? { ...pkg, ratePerSqft: numValue } : pkg)
    )
  }

  const handleNameChange = (id: PackageType, value: string) => {
    setLocalPackages(prev => 
      prev.map(pkg => pkg.id === id ? { ...pkg, name: value } : pkg)
    )
  }

  const handleTaglineChange = (id: PackageType, value: string) => {
    setLocalPackages(prev => 
      prev.map(pkg => pkg.id === id ? { ...pkg, tagline: value } : pkg)
    )
  }

  const handleHighlightChange = (pkgId: PackageType, index: number, value: string) => {
    setLocalPackages(prev =>
      prev.map(pkg => {
        if (pkg.id === pkgId) {
          const newHighlights = [...pkg.highlights]
          newHighlights[index] = value
          return { ...pkg, highlights: newHighlights }
        }
        return pkg
      })
    )
  }

  const addHighlight = (pkgId: PackageType) => {
    setLocalPackages(prev =>
      prev.map(pkg => {
        if (pkg.id === pkgId) {
          return { ...pkg, highlights: [...pkg.highlights, ''] }
        }
        return pkg
      })
    )
  }

  const removeHighlight = (pkgId: PackageType, index: number) => {
    setLocalPackages(prev =>
      prev.map(pkg => {
        if (pkg.id === pkgId) {
          return { ...pkg, highlights: pkg.highlights.filter((_, i) => i !== index) }
        }
        return pkg
      })
    )
  }

  const handleSave = () => {
    setPackages(localPackages)
    setEditingId(null)
    toast.success('Package configuration updated successfully')
  }

  const handleReset = () => {
    setLocalPackages(DEFAULT_PACKAGES)
    setPackages(DEFAULT_PACKAGES)
    toast.success('Packages reset to defaults')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Package Configuration</CardTitle>
              <CardDescription>
                Configure the three construction packages with rates and default materials
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset to Defaults
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-red-600 hover:bg-red-700">
                <FloppyDisk className="mr-2" size={16} />
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {localPackages.map((pkg) => (
          <Card key={pkg.id} className={editingId === pkg.id ? 'ring-2 ring-red-500' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                {editingId === pkg.id ? (
                  <Input
                    value={pkg.name}
                    onChange={(e) => handleNameChange(pkg.id, e.target.value)}
                    className="font-bold"
                  />
                ) : (
                  <CardTitle className="flex items-center gap-2">
                    {pkg.name}
                    {pkg.isPopular && (
                      <Badge className="bg-blue-500">Most Popular</Badge>
                    )}
                  </CardTitle>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingId(editingId === pkg.id ? null : pkg.id)}
                >
                  <PencilSimple size={18} />
                </Button>
              </div>
              {editingId === pkg.id ? (
                <Input
                  value={pkg.tagline}
                  onChange={(e) => handleTaglineChange(pkg.id, e.target.value)}
                  placeholder="Tagline"
                  className="text-sm"
                />
              ) : (
                <CardDescription>{pkg.tagline}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rate per Sq.ft</Label>
                {editingId === pkg.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">₹</span>
                    <Input
                      type="number"
                      value={pkg.ratePerSqft}
                      onChange={(e) => handleRateChange(pkg.id, e.target.value)}
                      className="font-mono text-lg font-bold"
                    />
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-red-600 font-mono">
                    ₹{pkg.ratePerSqft.toLocaleString('en-IN')} / sq.ft
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Key Highlights</Label>
                  {editingId === pkg.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addHighlight(pkg.id)}
                    >
                      <Plus size={16} className="mr-1" />
                      Add
                    </Button>
                  )}
                </div>
                <ul className="space-y-2">
                  {pkg.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      {editingId === pkg.id ? (
                        <>
                          <Input
                            value={highlight}
                            onChange={(e) => handleHighlightChange(pkg.id, index, e.target.value)}
                            placeholder="Enter highlight"
                            className="text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHighlight(pkg.id, index)}
                            className="flex-shrink-0"
                          >
                            <Trash size={16} className="text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-red-600 mt-1.5">•</span>
                          <span className="text-sm text-gray-700">{highlight}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
