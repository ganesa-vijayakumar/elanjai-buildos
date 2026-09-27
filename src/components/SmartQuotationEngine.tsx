import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, House, Buildings, Crown, Star } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { MaterialCustomization } from './MaterialCustomization'
import { MaterialCustomizationData } from '@/lib/materialData'
import { ConstructionAgreement } from './ConstructionAgreement'
import { Project, CONSTRUCTION_STAGES, Quotation } from '@/lib/types'

interface QuotationData {
  id: string
  quotationNumber: string
  clientName: string
  mobileNumber?: string
  email?: string
  projectDescription: string
  location: string
  sqft: number
  buildingType: 'individual_home' | 'villa' | 'apartment' | 'duplex' | 'commercial'
  floors: number
  selectedPackage: 'basic' | 'standard' | 'premium' | 'custom' | null
  baseRatePerSqft: number
  estimatedTotal: number
  status: 'draft' | 'sent' | 'approved' | 'rejected'
  createdAt: string
}

interface PackageData {
  id: 'basic' | 'standard' | 'premium'
  name: string
  rate: number
  tagline: string
  badge?: string
  badgeColor?: string
  highlights: string[]
  icon: 'house' | 'buildings' | 'crown'
}

const PACKAGES: PackageData[] = [
  {
    id: 'basic',
    name: 'Basic Package',
    rate: 2200,
    tagline: 'Essential quality with standard finishes',
    icon: 'house',
    highlights: [
      'Vitrified Tiles @ ₹60/sq.ft',
      'Parryware/Hindware bathroom fittings @ ₹20,000/bathroom',
      'Teak wood main door @ ₹20,000',
      'Orbit/GM electrical switches',
      'Kamachi or equivalent steel',
    ],
  },
  {
    id: 'standard',
    name: 'Standard Package',
    rate: 2400,
    tagline: 'Enhanced quality with better brands',
    badge: 'Most Popular',
    badgeColor: 'bg-blue-500',
    icon: 'buildings',
    highlights: [
      'Vitrified Tiles @ ₹70/sq.ft',
      'Wall-mounted commode (Parryware Indus)',
      'Bathroom fittings @ ₹30,000/bathroom',
      'Teak wood main door @ ₹30,000',
      'Anchor Roma switches',
      'ARS/ARUN branded steel',
      'River sand for plastering',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Package',
    rate: 2600,
    tagline: 'Top-tier materials, premium brands, luxury finishes',
    icon: 'crown',
    highlights: [
      'Anti-termite treatment included',
      'Granite staircase flooring @ ₹150/sq.ft',
      'Jaguar bathroom fittings @ ₹40,000/bathroom',
      'Legrand electrical switches',
      'Ultratech/Coromandel cement',
      'Fe550D TMT bars (I Steel)',
      'Fosroc waterproofing',
      'UPVC Venesta/Etti windows @ ₹600/sq.ft',
    ],
  },
]

const formatIndianCurrency = (amount: number): string => {
  const x = amount.toString()
  const lastThree = x.substring(x.length - 3)
  const otherNumbers = x.substring(0, x.length - 3)
  if (otherNumbers !== '') {
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
  }
  return lastThree
}

interface SmartQuotationEngineProps {
  quotationToEdit?: Quotation | null
  onClearEdit?: () => void
}

export function SmartQuotationEngine({ quotationToEdit, onClearEdit }: SmartQuotationEngineProps) {
  const [quotations, setQuotations] = useKV<QuotationData[]>('quotations', [])
  const clientNameInputRef = useRef<HTMLInputElement>(null)

  const [clientName, setClientName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [email, setEmail] = useState('')

  const [projectDescription, setProjectDescription] = useState('')
  const [location, setLocation] = useState('')
  const [sqft, setSqft] = useState<number>(0)
  const [buildingType, setBuildingType] = useState<QuotationData['buildingType']>('individual_home')
  const [floors, setFloors] = useState<number>(2)
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'standard' | 'premium' | 'custom' | null>(null)
  const [showMaterialCustomization, setShowMaterialCustomization] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)
  const [currentQuotationForCustomization, setCurrentQuotationForCustomization] = useState<QuotationData | null>(null)
  const [currentProjectForAgreement, setCurrentProjectForAgreement] = useState<Project | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isContinuing, setIsContinuing] = useState(false)
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null)

  // Pre-populate form when editing a quotation
  useEffect(() => {
    if (quotationToEdit) {
      setClientName(quotationToEdit.clientName || '')
      setMobileNumber(quotationToEdit.mobileNumber || '')
      setEmail(quotationToEdit.email || '')
      setProjectDescription(quotationToEdit.projectDescription || '')
      setLocation(quotationToEdit.location || '')
      setSqft(quotationToEdit.sqft || 0)
      setBuildingType(quotationToEdit.buildingType || 'individual_home')
      setFloors(quotationToEdit.floors || 2)
      setSelectedPackage(quotationToEdit.selectedPackage || null)
      setEditingQuotationId(quotationToEdit.id)
    }
  }, [quotationToEdit])

  useEffect(() => {
    // Focus the client name input on mount only if not editing
    if (clientNameInputRef.current && !quotationToEdit) {
      clientNameInputRef.current.focus()
    }
  }, [])

  const selectedPackageData = PACKAGES.find((p) => p.id === selectedPackage)
  const estimatedTotal = selectedPackageData ? sqft * selectedPackageData.rate : 0

  const isFormValid = clientName.trim() !== '' && mobileNumber.trim() !== '' && email.trim() !== '' && location.trim() !== '' && sqft > 0 && selectedPackage !== null

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 600))

      const currentQuotations = quotations || []
      const newQuotation: QuotationData = {
        id: `q_${Date.now()}`,
        quotationNumber: `QTN-${Math.floor(1000 + Math.random() * 9000)}`,
        clientName,
        mobileNumber,
        email,
        projectDescription: projectDescription || `New Residential Building for ${clientName}`,
        location,
        sqft,
        buildingType,
        floors,
        selectedPackage,
        baseRatePerSqft: selectedPackageData?.rate || 0,
        estimatedTotal,
        status: 'draft',
        createdAt: new Date().toISOString().split('T')[0],
      }

      setQuotations((current) => [...(current || []), newQuotation])

      toast.success('Quotation saved as draft', {
        description: `${newQuotation.id} - ${clientName}`,
      })

      resetForm()
    } catch (error) {
      toast.error('Failed to save draft. Please try again.')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleContinue = async () => {
    setIsContinuing(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const currentQuotations = quotations || []
      const newQuotation: QuotationData = {
        id: `q_${Date.now()}`,
        quotationNumber: `QTN-${Math.floor(1000 + Math.random() * 9000)}`,
        clientName,
        mobileNumber,
        email,
        projectDescription: projectDescription || `New Residential Building for ${clientName}`,
        location,
        sqft,
        buildingType,
        floors,
        selectedPackage,
        baseRatePerSqft: selectedPackageData?.rate || 0,
        estimatedTotal,
        status: 'draft',
        createdAt: new Date().toISOString().split('T')[0],
      }

      setCurrentQuotationForCustomization(newQuotation)
      setShowMaterialCustomization(true)
    } catch (error) {
      toast.error('Failed to continue. Please try again.')
    } finally {
      setIsContinuing(false)
    }
  }

  const handleBackToPackageSelection = () => {
    setShowMaterialCustomization(false)
    setCurrentQuotationForCustomization(null)
  }

  const handleMaterialCustomizationComplete = (data: MaterialCustomizationData) => {
    const currentQuotations = quotations || []

    if (currentQuotationForCustomization) {
      const finalizedQuotation: QuotationData = {
        ...currentQuotationForCustomization,
        estimatedTotal: data.finalEstimatedCost,
        status: 'sent',
      }

      setQuotations((current) => [...(current || []), finalizedQuotation])

      const projectTypeMap: Record<typeof buildingType, 'villa' | 'apartment' | 'duplex' | 'commercial'> = {
        'individual_home': 'villa',
        'duplex': 'duplex',
        'villa': 'villa',
        'apartment': 'apartment',
        'commercial': 'commercial',
      }

      // Fetch building-specific stage template
      const stageKey = `stage-template-${buildingType}`
      const buildingStageTemplate = localStorage.getItem(`kv:${stageKey}`)
      let stageTemplate = CONSTRUCTION_STAGES

      if (buildingStageTemplate) {
        try {
          stageTemplate = JSON.parse(buildingStageTemplate)
        } catch {
          stageTemplate = CONSTRUCTION_STAGES
        }
      }

      const stages = stageTemplate.map((stage, index) => ({
        id: `stage-${index + 1}`,
        name: stage.name,
        percentage: stage.percentage,
        budgetAmount: Math.round((data.finalEstimatedCost * stage.percentage) / 100),
        actualSpent: 0,
        status: 'pending' as const,
        expenses: [],
        budgetAlerts: [],
      }))

      const tempProject: Project = {
        id: finalizedQuotation.id,
        name: finalizedQuotation.projectDescription,
        clientName: finalizedQuotation.clientName,
        location: finalizedQuotation.location,
        type: projectTypeMap[finalizedQuotation.buildingType] || 'villa',
        squareFootage: finalizedQuotation.sqft,
        packageType: finalizedQuotation.selectedPackage || 'standard',
        totalCost: data.finalEstimatedCost,
        status: 'on-track',
        currentStage: stages[0].name,
        currentStageIndex: 0,
        completionPercentage: 0,
        stages,
        totalExpenses: 0,
        totalCollected: 0,
        createdAt: finalizedQuotation.createdAt,
        sitePhotos: [],
        materialUsage: {},
        collections: [],
      }

      setCurrentProjectForAgreement(tempProject)
      setShowMaterialCustomization(false)
      setShowAgreement(true)
    }
  }

  const handleBackFromAgreement = () => {
    setShowAgreement(false)
    setShowMaterialCustomization(true)
  }

  const resetForm = () => {
    setClientName('')
    setMobileNumber('')
    setEmail('')
    setProjectDescription('')
    setLocation('')
    setSqft(0)
    setBuildingType('individual_home')
    setFloors(2)
    setSelectedPackage(null)
  }

  const getPackageIcon = (iconType: 'house' | 'buildings' | 'crown') => {
    switch (iconType) {
      case 'house':
        return <House size={48} weight="duotone" className="text-primary" />
      case 'buildings':
        return <Buildings size={48} weight="duotone" className="text-primary" />
      case 'crown':
        return <Crown size={48} weight="duotone" className="text-primary" />
    }
  }

  if (showAgreement && currentProjectForAgreement) {
    return (
      <ConstructionAgreement
        project={currentProjectForAgreement}
        onBack={handleBackFromAgreement}
        onMarkSigned={() => {
          toast.success('Agreement signed!', {
            description: 'Project has been created successfully.',
          })
          resetForm()
          setShowAgreement(false)
          setCurrentProjectForAgreement(null)
          setCurrentQuotationForCustomization(null)
        }}
      />
    )
  }

  if (showMaterialCustomization && currentQuotationForCustomization && currentQuotationForCustomization.selectedPackage) {
    return (
      <MaterialCustomization
        quotationData={{
          id: currentQuotationForCustomization.id,
          clientName: currentQuotationForCustomization.clientName,
          location: currentQuotationForCustomization.location,
          sqft: currentQuotationForCustomization.sqft,
          selectedPackage: currentQuotationForCustomization.selectedPackage,
          baseRatePerSqft: currentQuotationForCustomization.baseRatePerSqft,
          estimatedTotal: currentQuotationForCustomization.estimatedTotal,
        }}
        onBack={handleBackToPackageSelection}
        onComplete={handleMaterialCustomizationComplete}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-32">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Smart Quotation Engine</h1>
        <p className="text-sm md:text-base text-muted-foreground">Create detailed quotations with real package rates</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotation Details</CardTitle>
          <CardDescription>Enter project information and client details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-sm font-medium">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-name"
                ref={clientNameInputRef}
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-number" className="text-sm font-medium">
                Mobile Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mobile-number"
                placeholder="Enter mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description" className="text-sm font-medium">
                Project Description
              </Label>
              <Input
                id="project-description"
                placeholder="New Residential Building for [Client]"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Site Location / Address <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="location"
                placeholder="Enter complete site address"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sqft" className="text-sm font-medium">
                Total Built-Up Area (Sq.ft) <span className="text-destructive">*</span>
              </Label>
              <div className="text-xs text-muted-foreground mb-1">Outer to Outer roof area measurement</div>
              <Input
                id="sqft"
                type="number"
                placeholder="e.g., 1500"
                value={sqft || ''}
                onChange={(e) => setSqft(Number(e.target.value))}
                min={0}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="building-type" className="text-sm font-medium">
                Building Type
              </Label>
              <Select value={buildingType} onValueChange={(value: QuotationData['buildingType']) => setBuildingType(value)}>
                <SelectTrigger id="building-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual_home">Individual Home</SelectItem>
                  <SelectItem value="duplex">Duplex</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floors" className="text-sm font-medium">
                Number of Floors
              </Label>
              <Input
                id="floors"
                type="number"
                placeholder="e.g., 2 for G+1"
                value={floors || ''}
                onChange={(e) => setFloors(Number(e.target.value))}
                min={1}
              />
              <div className="text-xs text-muted-foreground">e.g., G+1, G+2</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">Select Package</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg relative',
                selectedPackage === pkg.id && 'ring-2 ring-primary shadow-lg'
              )}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              {pkg.badge && (
                <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
                  <Badge className={cn('text-white text-xs', pkg.badgeColor)}>{pkg.badge}</Badge>
                </div>
              )}
              <CardHeader className="space-y-3 md:space-y-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="scale-75 md:scale-100 origin-left">{getPackageIcon(pkg.icon)}</div>
                  {selectedPackage === pkg.id && (
                    <CheckCircle size={28} weight="fill" className="text-primary md:scale-110" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg md:text-xl mb-2">{pkg.name}</CardTitle>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl md:text-3xl font-bold text-primary">
                      ₹{formatIndianCurrency(pkg.rate)}
                    </span>
                    <span className="text-sm md:text-base font-normal text-muted-foreground">/sq.ft</span>
                  </div>
                  <CardDescription className="text-xs md:text-sm">{pkg.tagline}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3">Key Highlights:</div>
                  <ul className="space-y-1.5 md:space-y-2">
                    {pkg.highlights.map((highlight, idx) => (
                      <li key={idx} className="text-xs md:text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                        <span className="break-words leading-relaxed">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1 w-full">
              {sqft > 0 && selectedPackageData ? (
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0 text-xs md:text-base">
                  <div className="flex items-center flex-wrap gap-1">
                    <span className="text-muted-foreground">Built-Up Area: </span>
                    <span className="font-semibold text-foreground whitespace-nowrap">{formatIndianCurrency(sqft)} sq.ft</span>
                    <span className="text-muted-foreground">×</span>
                    <span className="font-semibold text-primary whitespace-nowrap">₹{formatIndianCurrency(selectedPackageData.rate)}</span>
                    <span className="text-muted-foreground">=</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground">Estimated Total: </span>
                    <span className="text-xl md:text-2xl font-bold text-primary whitespace-nowrap">₹{formatIndianCurrency(estimatedTotal)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Enter area and select a package to see estimate</div>
              )}
            </div>
            <div className="flex gap-2 md:gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                size="lg"
                onClick={handleSaveDraft}
                disabled={!isFormValid || isSavingDraft || isContinuing}
                className="flex-1 md:flex-none text-sm md:text-base"
              >
                {isSavingDraft ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  'Save as Draft'
                )}
              </Button>
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!isFormValid || isSavingDraft || isContinuing}
                className="bg-primary hover:bg-primary/90 flex-1 md:flex-none text-sm md:text-base"
              >
                {isContinuing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Loading...
                  </>
                ) : (
                  'Continue to Material Customization'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
