import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Plus, Check, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { WORK_CATEGORIES, MaterialSelection, CustomMaterialItem, MaterialCustomizationData, MaterialTier, MaterialItem, MaterialOption } from '@/lib/materialData'
import { ExtraWorksConfiguration, ExtraWorkItem, EXTRA_WORKS_ITEMS, DEFAULT_INCLUDED_ITEMS, DEFAULT_QUANTITIES } from './ExtraWorksConfiguration'

interface MaterialCustomizationProps {
  quotationData: {
    id: string
    clientName: string
    location: string
    sqft: number
    selectedPackage: 'basic' | 'standard' | 'premium' | 'custom'
    baseRatePerSqft: number
    estimatedTotal: number
  }
  onBack: () => void
  onComplete: (data: MaterialCustomizationData) => void
}

const formatIndianCurrency = (amount: number): string => {
  // Round to 2 decimal places
  const fixed = amount.toFixed(2)
  const [intPart, decPart] = fixed.split('.')

  // Format the integer part with Indian number system (lakh, crore)
  const lastThree = intPart.slice(-3)
  const otherNumbers = intPart.slice(0, -3)
  const formattedInt = otherNumbers !== ''
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree

  return `${formattedInt}.${decPart}`
}

// Determine the package type for a category based on selected tiers
const getCategoryPackageType = (selections: MaterialSelection[], customItemsCount: number): 'basic' | 'standard' | 'premium' | 'custom' | null => {
  if (selections.length === 0 && customItemsCount === 0) return null

  // If there are custom items, it's always "custom"
  if (customItemsCount > 0) return 'custom'

  if (selections.length === 0) return null

  const firstTier = selections[0].selectedTier
  const allSameTier = selections.every(sel => sel.selectedTier === firstTier)

  if (allSameTier) {
    return firstTier
  }

  return 'custom'
}

// Get package badge color
const getPackageBadgeVariant = (packageType: 'basic' | 'standard' | 'premium' | 'custom' | null): string => {
  switch (packageType) {
    case 'basic': return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'standard': return 'bg-green-100 text-green-800 border-green-300'
    case 'premium': return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'custom': return 'bg-purple-100 text-purple-800 border-purple-300'
    default: return ''
  }
}

// Get package display name
const getPackageDisplayName = (packageType: 'basic' | 'standard' | 'premium' | 'custom' | null): string => {
  switch (packageType) {
    case 'basic': return 'Basic'
    case 'standard': return 'Standard'
    case 'premium': return 'Premium'
    case 'custom': return 'Custom'
    default: return ''
  }
}

export function MaterialCustomization({ quotationData, onBack, onComplete }: MaterialCustomizationProps) {
  const [customizationData, setCustomizationData] = useKV<MaterialCustomizationData[]>('material-customizations', [])
  const [profile] = useKV<any>('company-profile', { gstPercentage: 18 })

  const [materialSelections, setMaterialSelections] = useState<MaterialSelection[]>([])
  const [customItems, setCustomItems] = useState<CustomMaterialItem[]>([])
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false)
  const [selectedCategoryForCustom, setSelectedCategoryForCustom] = useState('')
  const [activeTab, setActiveTab] = useState('materials')

  // Extra Works state
  const [extraWorkItems, setExtraWorkItems] = useState<ExtraWorkItem[]>(() =>
    EXTRA_WORKS_ITEMS.map(item => ({
      ...item,
      included: DEFAULT_INCLUDED_ITEMS.includes(item.itemId),
      quantity: DEFAULT_QUANTITIES[item.itemId] || 0,
      total: DEFAULT_INCLUDED_ITEMS.includes(item.itemId) && typeof item.rate === 'number'
        ? (DEFAULT_QUANTITIES[item.itemId] || 0) * item.rate
        : 0,
    }))
  )
  const [includeGST, setIncludeGST] = useState(true)

  const [customItemForm, setCustomItemForm] = useState({
    name: '',
    description: '',
    rate: 0,
    unit: 'sq.ft',
    brand: '',
  })

  useEffect(() => {
    const initialSelections: MaterialSelection[] = []
    WORK_CATEGORIES.forEach(category => {
      category.items.forEach(item => {
        // For 'custom' package, default to 'standard' tier for initial selections
        const defaultTier: MaterialTier = quotationData.selectedPackage === 'custom' ? 'standard' : quotationData.selectedPackage
        const option = item.options[defaultTier]

        if (option) {
          initialSelections.push({
            itemId: item.itemId,
            name: item.name,
            selectedTier: defaultTier,
            rate: option.rate,
            unit: option.unit,
            brand: option.brands?.[0] || 'Standard',
            categoryId: category.categoryId,
          })
        }
      })
    })
    setMaterialSelections(initialSelections)
  }, [quotationData.selectedPackage])

  const handleMaterialChange = (itemId: string, categoryId: string, tier: MaterialTier, item: MaterialItem) => {
    const option = item.options[tier]
    if (!option) return

    setMaterialSelections(prev =>
      prev.map(sel =>
        sel.itemId === itemId
          ? {
            ...sel,
            selectedTier: tier,
            rate: option.rate,
            unit: option.unit,
            brand: option.brands?.[0] || 'Standard',
          }
          : sel
      )
    )
  }

  const handleBrandChange = (itemId: string, brand: string) => {
    setMaterialSelections(prev =>
      prev.map(sel =>
        sel.itemId === itemId ? { ...sel, brand } : sel
      )
    )
  }

  const handleAddCustomItem = () => {
    const newCustomItem: CustomMaterialItem = {
      itemId: `custom_${Date.now()}`,
      categoryId: selectedCategoryForCustom,
      name: customItemForm.name,
      description: customItemForm.description,
      rate: customItemForm.rate,
      unit: customItemForm.unit,
      brand: customItemForm.brand || 'Custom',
      isCustom: true,
    }

    setCustomItems(prev => [...prev, newCustomItem])

    toast.success('Custom item added', {
      description: `${customItemForm.name} added to ${WORK_CATEGORIES.find(c => c.categoryId === selectedCategoryForCustom)?.name}`,
    })

    setCustomItemForm({ name: '', description: '', rate: 0, unit: 'sq.ft', brand: '' })
    setIsCustomDialogOpen(false)
  }

  const handleRemoveCustomItem = (itemId: string) => {
    setCustomItems(prev => prev.filter(item => item.itemId !== itemId))
    toast.info('Custom item removed')
  }

  const getTierBadgeColor = (tier: 'basic' | 'standard' | 'premium' | 'custom') => {
    switch (tier) {
      case 'basic':
        return 'bg-gray-500'
      case 'standard':
        return 'bg-blue-500'
      case 'premium':
        return 'bg-amber-500'
      case 'custom':
        return 'bg-purple-600'
    }
  }

  const getTierLabel = (tier: 'basic' | 'standard' | 'premium' | 'custom') => {
    if (tier === 'custom') return 'Custom'
    return tier.charAt(0).toUpperCase() + tier.slice(1)
  }

  const calculateAdjustment = () => {
    let totalAdjust = 0

    materialSelections.forEach(selection => {
      const category = WORK_CATEGORIES.find(c => c.categoryId === selection.categoryId)
      const item = category?.items.find(i => i.itemId === selection.itemId)

      if (item) {
        const baseOption = item.options[quotationData.selectedPackage]
        if (baseOption) {
          const rateDiff = selection.rate - baseOption.rate
          totalAdjust += rateDiff * item.factor * quotationData.sqft
        } else if (selection.selectedTier !== quotationData.selectedPackage) {
          totalAdjust += selection.rate * item.factor * quotationData.sqft
        }
      }
    })

    customItems.forEach(item => {
      if (item.unit === 'sq.ft') {
        totalAdjust += item.rate * quotationData.sqft
      } else {
        totalAdjust += item.rate
      }
    })

    return Math.round(totalAdjust)
  }

  const isCustomized = () => {
    if (customItems.length > 0) return true

    return materialSelections.some(sel => sel.selectedTier !== quotationData.selectedPackage)
  }

  const currentPackageName = isCustomized() ? 'Custom' : getTierLabel(quotationData.selectedPackage)

  const adjustmentTotal = calculateAdjustment()
  const finalEstimatedCost = quotationData.estimatedTotal + adjustmentTotal

  // Extra Works and GST calculations
  const extraWorksTotal = extraWorkItems
    .filter(item => item.included && typeof item.rate === 'number')
    .reduce((sum, item) => sum + item.total, 0)
  const subTotal = finalEstimatedCost + extraWorksTotal
  const gstPercentage = profile?.gstPercentage || 18
  const gstAmount = includeGST ? subTotal * (gstPercentage / 100) : 0
  const grandTotal = subTotal + gstAmount

  const handleProceed = () => {
    const data: MaterialCustomizationData = {
      quotationId: quotationData.id,
      basePackage: isCustomized() ? 'custom' : quotationData.selectedPackage,
      baseSqft: quotationData.sqft,
      baseTotal: quotationData.estimatedTotal,
      materialSelections,
      customItems,
      adjustmentTotal,
      finalEstimatedCost: grandTotal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setCustomizationData(prev => [...(prev || []), data])

    toast.success('Material customization saved', {
      description: 'Your customized quotation is ready',
    })

    onComplete(data)
  }

  const handleSaveDraft = () => {
    const data: MaterialCustomizationData = {
      quotationId: quotationData.id,
      basePackage: isCustomized() ? 'custom' : quotationData.selectedPackage,
      baseSqft: quotationData.sqft,
      baseTotal: quotationData.estimatedTotal,
      materialSelections,
      customItems,
      adjustmentTotal,
      finalEstimatedCost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setCustomizationData(prev => [...(prev || []), data])

    toast.success('Draft saved', {
      description: 'Your material selections have been saved',
    })
  }

  return (
    <div className="max-w-7xl mx-auto pb-40">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2" />
          Back to Package Selection
        </Button>

        <div className="bg-card rounded-lg border p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Material Customization</h1>
              <p className="text-sm text-muted-foreground">
                {quotationData.clientName} • {quotationData.location} • {quotationData.sqft.toLocaleString()} sq.ft
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn('text-white', isCustomized() ? 'bg-purple-600' : getTierBadgeColor(quotationData.selectedPackage))}>
                {currentPackageName} Package
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="materials">Material Selection</TabsTrigger>
              <TabsTrigger value="extras">Extra Works</TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="space-y-4">
              <Accordion type="multiple" className="space-y-4">
                {WORK_CATEGORIES.map((category) => {
                  const categorySelections = materialSelections.filter(sel => sel.categoryId === category.categoryId)
                  const categoryCustomItems = customItems.filter(item => item.categoryId === category.categoryId)

                  return (
                    <AccordionItem key={category.categoryId} value={category.categoryId} className="border rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <h3 className="text-base md:text-lg font-semibold text-left">{category.name}</h3>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const packageType = getCategoryPackageType(categorySelections, categoryCustomItems.length)
                              if (packageType) {
                                return (
                                  <Badge
                                    variant="outline"
                                    className={cn("text-xs font-medium", getPackageBadgeVariant(packageType))}
                                  >
                                    {getPackageDisplayName(packageType)}
                                  </Badge>
                                )
                              }
                              return null
                            })()}
                            <Badge variant="outline" className="ml-1">
                              {categorySelections.length + categoryCustomItems.length} items
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 md:px-6 pb-4">
                        <div className="space-y-4 mt-2">
                          {category.items.map((item) => {
                            const selection = materialSelections.find(sel => sel.itemId === item.itemId)
                            if (!selection) return null

                            const currentOption = item.options[selection.selectedTier]
                            const availableBrands = currentOption?.brands || []

                            return (
                              <Card key={item.itemId} className="bg-muted/30">
                                <CardContent className="p-4 space-y-3">
                                  <div>
                                    <h4 className="font-medium text-sm md:text-base">{item.name}</h4>
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">Material Tier</Label>
                                      <Select
                                        value={selection.selectedTier}
                                        onValueChange={(value: MaterialTier) => handleMaterialChange(item.itemId, category.categoryId, value, item)}
                                      >
                                        <SelectTrigger className="h-9">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {item.options.basic && (
                                            <SelectItem value="basic">
                                              <div className="flex flex-col">
                                                <span className="font-medium">Basic - ₹{item.options.basic.rate}/{item.options.basic.unit}</span>
                                                <span className="text-xs text-muted-foreground">{item.options.basic.description}</span>
                                              </div>
                                            </SelectItem>
                                          )}
                                          {item.options.standard && (
                                            <SelectItem value="standard">
                                              <div className="flex flex-col">
                                                <span className="font-medium">Standard - ₹{item.options.standard.rate}/{item.options.standard.unit}</span>
                                                <span className="text-xs text-muted-foreground">{item.options.standard.description}</span>
                                              </div>
                                            </SelectItem>
                                          )}
                                          {item.options.premium && (
                                            <SelectItem value="premium">
                                              <div className="flex flex-col">
                                                <span className="font-medium">Premium - ₹{item.options.premium.rate}/{item.options.premium.unit}</span>
                                                <span className="text-xs text-muted-foreground">{item.options.premium.description}</span>
                                              </div>
                                            </SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {availableBrands.length > 0 && (
                                      <div className="space-y-1.5">
                                        <Label className="text-xs">Brand</Label>
                                        <Select
                                          value={selection.brand}
                                          onValueChange={(value) => handleBrandChange(item.itemId, value)}
                                        >
                                          <SelectTrigger className="h-9">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableBrands.map((brand) => (
                                              <SelectItem key={brand} value={brand}>
                                                {brand}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t">
                                    <Badge className={cn('text-white text-xs', getTierBadgeColor(selection.selectedTier))}>
                                      {getTierLabel(selection.selectedTier)}
                                    </Badge>
                                    <div className="text-sm font-semibold text-primary">
                                      ₹{selection.rate.toLocaleString()}/{selection.unit}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}

                          {categoryCustomItems.map((customItem) => (
                            <Card key={customItem.itemId} className="bg-accent/20 border-accent">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-sm md:text-base">{customItem.name}</h4>
                                      <Badge variant="outline" className="text-xs">Custom</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">{customItem.description}</p>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                      <span className="text-muted-foreground">Brand: {customItem.brand}</span>
                                      <span className="text-primary font-semibold">₹{customItem.rate.toLocaleString()}/{customItem.unit}</span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveCustomItem(customItem.itemId)}
                                    className="h-8 w-8 p-0 text-destructive"
                                  >
                                    <X size={16} />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                          <Dialog open={isCustomDialogOpen && selectedCategoryForCustom === category.categoryId} onOpenChange={setIsCustomDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setSelectedCategoryForCustom(category.categoryId)}
                              >
                                <Plus className="mr-2" size={16} />
                                Add Custom Item
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Add Custom Item</DialogTitle>
                                <DialogDescription>
                                  Add a custom material to {category.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="custom-name">Item Name *</Label>
                                  <Input
                                    id="custom-name"
                                    placeholder="e.g., French Window"
                                    value={customItemForm.name}
                                    onChange={(e) => setCustomItemForm(prev => ({ ...prev, name: e.target.value }))}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="custom-description">Description</Label>
                                  <Textarea
                                    id="custom-description"
                                    placeholder="Brief description"
                                    rows={2}
                                    value={customItemForm.description}
                                    onChange={(e) => setCustomItemForm(prev => ({ ...prev, description: e.target.value }))}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label htmlFor="custom-rate">Rate (₹) *</Label>
                                    <Input
                                      id="custom-rate"
                                      type="number"
                                      placeholder="0"
                                      value={customItemForm.rate || ''}
                                      onChange={(e) => setCustomItemForm(prev => ({ ...prev, rate: Number(e.target.value) }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="custom-unit">Unit</Label>
                                    <Select
                                      value={customItemForm.unit}
                                      onValueChange={(value) => setCustomItemForm(prev => ({ ...prev, unit: value }))}
                                    >
                                      <SelectTrigger id="custom-unit">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="sq.ft">sq.ft</SelectItem>
                                        <SelectItem value="rft">rft</SelectItem>
                                        <SelectItem value="nos">nos</SelectItem>
                                        <SelectItem value="cum">cum</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="set">set</SelectItem>
                                        <SelectItem value="point">point</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="custom-brand">Brand</Label>
                                  <Input
                                    id="custom-brand"
                                    placeholder="e.g., Premium Brand"
                                    value={customItemForm.brand}
                                    onChange={(e) => setCustomItemForm(prev => ({ ...prev, brand: e.target.value }))}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleAddCustomItem}
                                  disabled={!customItemForm.name || !customItemForm.rate}
                                >
                                  <Check className="mr-2" size={16} />
                                  Add Item
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </TabsContent>

            <TabsContent value="extras" className="space-y-6">
              <ExtraWorksConfiguration
                extraWorkItems={extraWorkItems}
                setExtraWorkItems={setExtraWorkItems}
                includeGST={includeGST}
                onGSTToggle={setIncludeGST}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Cost Summary - visible on both tabs */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4 shadow-lg border-2">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg">Cost Summary</CardTitle>
              <CardDescription>Estimated project cost</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Base Package Total:</span>
                  <span className="font-semibold">₹{formatIndianCurrency(quotationData.estimatedTotal)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Material Adjustments:</span>
                  <span className={cn('font-semibold', adjustmentTotal >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {adjustmentTotal >= 0 ? '+' : ''}₹{formatIndianCurrency(Math.abs(adjustmentTotal))}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Extra Works:</span>
                  <span className={cn('font-semibold', extraWorksTotal > 0 ? 'text-amber-600' : 'text-muted-foreground')}>
                    {extraWorksTotal > 0 ? `+₹${formatIndianCurrency(extraWorksTotal)}` : '₹0.00'}
                  </span>
                </div>

                {customItems.length > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Custom Items:</span>
                    <Badge variant="outline">{customItems.length} items</Badge>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Sub-Total:</span>
                  <span className="font-semibold">₹{formatIndianCurrency(subTotal)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="include-gst-summary"
                      checked={includeGST}
                      onCheckedChange={(checked) => setIncludeGST(checked as boolean)}
                    />
                    <Label htmlFor="include-gst-summary" className="text-muted-foreground cursor-pointer">
                      GST ({gstPercentage}%)
                    </Label>
                  </div>
                  <span className={cn('font-semibold', includeGST ? 'text-blue-600' : 'text-muted-foreground')}>
                    {includeGST ? `+₹${formatIndianCurrency(gstAmount)}` : 'Excluded'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-base font-semibold">Grand Total:</span>
                </div>
                <div className="text-3xl font-bold text-primary">
                  ₹{formatIndianCurrency(grandTotal)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ₹{Math.round(grandTotal / quotationData.sqft).toLocaleString()}/sq.ft
                </div>
              </div>

              <div className="pt-4 space-y-2">
                {activeTab === 'materials' ? (
                  <Button onClick={() => setActiveTab('extras')} className="w-full" size="lg">
                    Continue to Extra Works
                  </Button>
                ) : (
                  <Button onClick={handleProceed} className="w-full" size="lg">
                    Proceed to Stages
                  </Button>
                )}
                <Button onClick={handleSaveDraft} variant="outline" className="w-full">
                  Save Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
