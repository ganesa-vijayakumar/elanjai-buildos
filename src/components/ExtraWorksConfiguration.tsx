import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Info, CheckCircle, XCircle, Plus, CaretDown } from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface ExtraWorkItem {
  itemId: string
  serialNumber: string
  name: string
  unit: string
  rate: number | 'client_scope' | 'extra'
  included: boolean
  quantity: number
  total: number
  isPercentage?: boolean
  autoCalculated?: boolean
}

// Interface for global extra works (from ExtraWorksMaster)
interface GlobalExtraWorkItem {
  id: string
  itemCode: string
  name: string
  unit: string
  rate: number | string
  scope: 'extra' | 'client-scope' | 'lumpsum'
  description?: string
  defaultEnabled: boolean
}

interface ExtraWorksConfigurationProps {
  extraWorkItems: ExtraWorkItem[]
  setExtraWorkItems: React.Dispatch<React.SetStateAction<ExtraWorkItem[]>>
  includeGST: boolean
  onGSTToggle: (checked: boolean) => void
}

export const EXTRA_WORKS_ITEMS: Omit<ExtraWorkItem, 'included' | 'quantity' | 'total'>[] = [
  { itemId: 'drawing_approval', serialNumber: 'A', name: 'Drawing & Approval', unit: 'Lumpsum', rate: 'client_scope' },
  { itemId: 'elevation_design', serialNumber: 'B', name: 'Elevation Design', unit: 'Lumpsum', rate: 'client_scope' },
  { itemId: 'lift', serialNumber: 'C', name: 'Lift', unit: 'Nos', rate: 'extra' },
  { itemId: 'sump', serialNumber: 'D', name: 'Sump (RCC)', unit: 'Liter', rate: 0.25 },
  { itemId: 'septic_tank', serialNumber: 'E', name: 'Septic Tank (Brick)', unit: 'Liter', rate: 0.20 },
  { itemId: 'oht', serialNumber: 'F', name: 'OHT (RCC)', unit: 'Liter', rate: 0.25 },
  { itemId: 'compound_wall', serialNumber: 'G', name: 'Compound Wall', unit: 'RFT', rate: 2000 },
  { itemId: 'bore_well', serialNumber: 'H', name: 'Bore Well', unit: 'Nos', rate: 'extra' },
  { itemId: 'weathering_tiles', serialNumber: 'I', name: 'Weathering Tiles', unit: 'Sq.ft', rate: 140 },
  { itemId: 'eb_connection', serialNumber: 'J', name: 'EB Connection', unit: 'Lumpsum', rate: 'client_scope' },
  { itemId: 'electrical_fittings', serialNumber: 'K', name: 'Electrical Fittings', unit: 'Lumpsum', rate: 'client_scope' },
  { itemId: 'interior_work', serialNumber: 'L', name: 'Interior Work', unit: 'Lumpsum', rate: 'client_scope' },
  { itemId: 'parapet_wall', serialNumber: 'M', name: 'Parapet Wall 9"', unit: 'RFT', rate: 150 },
  { itemId: 'choke_pits', serialNumber: 'N', name: 'Choke Pits, Drainage', unit: 'Lumpsum', rate: 'extra' },
  { itemId: 'water_purchase', serialNumber: 'O', name: 'Water Purchase', unit: 'Lumpsum', rate: 'extra' },
  { itemId: 'setback_filling', serialNumber: 'Q', name: 'Setback Area Filling', unit: 'Lumpsum', rate: 'extra' },
]

export const DEFAULT_INCLUDED_ITEMS = ['sump', 'septic_tank', 'oht', 'compound_wall']
export const DEFAULT_QUANTITIES: Record<string, number> = {
  sump: 10000,
  septic_tank: 5000,
  oht: 5000,
  compound_wall: 50,
}

const formatIndianCurrency = (amount: number): string => {
  const x = amount.toString()
  const lastThree = x.substring(x.length - 3)
  const otherNumbers = x.substring(0, x.length - 3)
  if (otherNumbers !== '') {
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
  }
  return lastThree
}

export function ExtraWorksConfiguration({ extraWorkItems, setExtraWorkItems, includeGST, onGSTToggle }: ExtraWorksConfigurationProps) {
  // Load global extra works configuration
  const [globalExtraWorks, setGlobalExtraWorks] = useKV<GlobalExtraWorkItem[]>('extra-works-master', [])

  // Dialog states
  const [addWorkDialogOpen, setAddWorkDialogOpen] = useState(false)
  const [createCustomDialogOpen, setCreateCustomDialogOpen] = useState(false)
  const [selectedWorksToAdd, setSelectedWorksToAdd] = useState<string[]>([])

  // Custom work form state
  const [customWorkForm, setCustomWorkForm] = useState({
    name: '',
    unit: 'sq.ft',
    rateType: 'fixed' as 'fixed' | 'client-scope' | 'extra',
    rate: 0,
    description: ''
  })

  const handleToggleItem = (itemId: string, checked: boolean) => {
    setExtraWorkItems(prev =>
      prev.map(item => {
        if (item.itemId === itemId) {
          return {
            ...item,
            included: checked,
            quantity: checked ? item.quantity || 0 : 0,
            total: 0,
          }
        }
        return item
      })
    )
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setExtraWorkItems(prev =>
      prev.map(item => {
        if (item.itemId === itemId) {
          const total = typeof item.rate === 'number' ? quantity * item.rate : 0
          return { ...item, quantity, total }
        }
        return item
      })
    )
  }

  // Get available works (not already added)
  const availableWorks = (globalExtraWorks || []).filter(
    globalWork => !extraWorkItems.some(item => item.itemId === globalWork.id)
  )

  // Handle adding selected works from global list
  const handleAddSelectedWorks = () => {
    if (selectedWorksToAdd.length === 0) {
      toast.error('Please select at least one extra work to add')
      return
    }

    const worksToAdd = (globalExtraWorks || [])
      .filter(gw => selectedWorksToAdd.includes(gw.id))
      .map(gw => {
        // Convert global work format to quotation work format
        let rate: number | 'client_scope' | 'extra'
        if (gw.scope === 'client-scope') {
          rate = 'client_scope'
        } else if (gw.scope === 'extra' || typeof gw.rate === 'string') {
          rate = 'extra'
        } else {
          rate = Number(gw.rate)
        }

        const newWork: ExtraWorkItem = {
          itemId: gw.id,
          serialNumber: gw.itemCode,
          name: gw.name,
          unit: gw.unit,
          rate: rate,
          included: gw.defaultEnabled,
          quantity: 0,
          total: 0
        }
        return newWork
      })

    setExtraWorkItems(prev => [...prev, ...worksToAdd])
    setSelectedWorksToAdd([])
    setAddWorkDialogOpen(false)
    toast.success(`Added ${worksToAdd.length} extra work${worksToAdd.length > 1 ? 's' : ''}`)
  }

  // Handle creating custom work
  const handleCreateCustomWork = () => {
    if (!customWorkForm.name.trim()) {
      toast.error('Please enter a name for the custom work')
      return
    }

    // Generate IDs
    const newId = `custom-${Date.now()}`
    const existingCodes = (globalExtraWorks || []).map(w => w.itemCode)
    let nextCode = 'Z'
    for (let i = 65; i <= 90; i++) {
      const code = String.fromCharCode(i)
      if (!existingCodes.includes(code)) {
        nextCode = code
        break
      }
    }

    // Determine rate based on type
    let rate: number | string
    let scope: 'extra' | 'client-scope' | 'lumpsum'
    if (customWorkForm.rateType === 'fixed') {
      rate = customWorkForm.rate
      scope = 'extra'
    } else if (customWorkForm.rateType === 'client-scope') {
      rate = 'Client scope'
      scope = 'client-scope'
    } else {
      rate = 'Extra'
      scope = 'extra'
    }

    // Create global work item
    const globalWork: GlobalExtraWorkItem = {
      id: newId,
      itemCode: nextCode,
      name: customWorkForm.name,
      unit: customWorkForm.unit,
      rate: rate,
      scope: scope,
      description: customWorkForm.description,
      defaultEnabled: false
    }

    // Add to global configuration
    setGlobalExtraWorks(prev => [...(prev || []), globalWork])

    // Add to current quotation
    const quotationWork: ExtraWorkItem = {
      itemId: newId,
      serialNumber: nextCode,
      name: customWorkForm.name,
      unit: customWorkForm.unit,
      rate: customWorkForm.rateType === 'fixed' ? customWorkForm.rate :
        customWorkForm.rateType === 'client-scope' ? 'client_scope' : 'extra',
      included: true,
      quantity: 0,
      total: 0
    }

    setExtraWorkItems(prev => [...prev, quotationWork])

    // Reset form and close dialog
    setCustomWorkForm({
      name: '',
      unit: 'sq.ft',
      rateType: 'fixed',
      rate: 0,
      description: ''
    })
    setCreateCustomDialogOpen(false)
    toast.success(`Custom work "${customWorkForm.name}" created and added to global configuration`)
  }

  const clientScopeItems = extraWorkItems.filter(item => item.rate === 'client_scope')
  const extraItems = extraWorkItems.filter(item => item.rate === 'extra')
  const chargeableItems = extraWorkItems.filter(item => typeof item.rate === 'number')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Extra Works / Additional Costs</h2>
        <p className="text-sm text-muted-foreground">Configure additional work items not included in the base package rate</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Extra Works Checklist</CardTitle>
              <CardDescription>Toggle items on/off and specify quantities</CardDescription>
            </div>
            <div className="flex gap-2">
              <DropdownMenu open={addWorkDialogOpen} onOpenChange={setAddWorkDialogOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={availableWorks.length === 0}>
                    <Plus className="mr-2" size={16} />
                    Add from List
                    <CaretDown className="ml-2" size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Select Extra Works to Add</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {availableWorks.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        All available works have been added
                      </div>
                    ) : (
                      availableWorks.map(work => (
                        <DropdownMenuCheckboxItem
                          key={work.id}
                          checked={selectedWorksToAdd.includes(work.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedWorksToAdd(prev => [...prev, work.id])
                            } else {
                              setSelectedWorksToAdd(prev => prev.filter(id => id !== work.id))
                            }
                          }}
                        >
                          <div className="flex flex-col">
                            <div className="font-medium">{work.itemCode}. {work.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {work.unit} • {typeof work.rate === 'number' ? `₹${work.rate}` : work.rate}
                            </div>
                          </div>
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </div>
                  {availableWorks.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <Button
                          onClick={handleAddSelectedWorks}
                          disabled={selectedWorksToAdd.length === 0}
                          className="w-full"
                          size="sm"
                        >
                          Add Selected ({selectedWorksToAdd.length})
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={() => setCreateCustomDialogOpen(true)}>
                <Plus className="mr-2" size={16} />
                Create Custom
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[200px]">Item</TableHead>
                  <TableHead className="w-20">Unit</TableHead>
                  <TableHead className="w-32">Rate</TableHead>
                  <TableHead className="w-20 text-center">Include?</TableHead>
                  <TableHead className="w-32">Quantity</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chargeableItems.map(item => (
                  <TableRow key={item.itemId}>
                    <TableCell className="font-medium text-muted-foreground">{item.serialNumber}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                    <TableCell className="text-sm">
                      {typeof item.rate === 'number' ? `₹${formatIndianCurrency(item.rate)}/${item.unit}` : item.rate}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={item.included}
                          onCheckedChange={(checked) => handleToggleItem(item.itemId, checked as boolean)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.included && typeof item.rate === 'number' ? (
                        <Input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleQuantityChange(item.itemId, Number(e.target.value))}
                          placeholder="0"
                          min={0}
                          className="w-full"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.included && item.total > 0 ? (
                        <span className="text-foreground">₹{formatIndianCurrency(item.total)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {extraItems.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Info className="text-primary" />
                  Items with Variable Costs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {extraItems.map(item => (
                    <div key={item.itemId} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{item.serialNumber}.</span>
                      {item.name}
                      <Badge variant="outline" className="ml-auto">Extra</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">These items will be quoted separately based on actual requirements</p>
              </div>
            </>
          )}

          {clientScopeItems.length > 0 && (
            <>
              <Separator />
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <h4 className="font-semibold mb-2">Client Scope Items</h4>
                  <p className="text-sm mb-3">The following items are arranged by the client directly and are not included in this quotation:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {clientScopeItems.map(item => (
                      <div key={item.itemId} className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{item.serialNumber}.</span>
                        {item.name}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Custom Extra Work Dialog */}
      <Dialog open={createCustomDialogOpen} onOpenChange={setCreateCustomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Extra Work</DialogTitle>
            <DialogDescription>
              Add a new custom extra work item. It will be saved to global configuration for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-name">Name *</Label>
              <Input
                id="custom-name"
                value={customWorkForm.name}
                onChange={(e) => setCustomWorkForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Solar Panels, Swimming Pool"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-unit">Unit</Label>
              <Select
                value={customWorkForm.unit}
                onValueChange={(value) => setCustomWorkForm(prev => ({ ...prev, unit: value }))}
              >
                <SelectTrigger id="custom-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sq.ft">sq.ft</SelectItem>
                  <SelectItem value="cum">cum</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="nos">nos</SelectItem>
                  <SelectItem value="RFT">RFT</SelectItem>
                  <SelectItem value="liter">liter</SelectItem>
                  <SelectItem value="lumpsum">lumpsum</SelectItem>
                  <SelectItem value="bag">bag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rate Type *</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="rate-fixed"
                    checked={customWorkForm.rateType === 'fixed'}
                    onChange={() => setCustomWorkForm(prev => ({ ...prev, rateType: 'fixed' }))}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="rate-fixed" className="cursor-pointer font-normal">Fixed Rate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="rate-client"
                    checked={customWorkForm.rateType === 'client-scope'}
                    onChange={() => setCustomWorkForm(prev => ({ ...prev, rateType: 'client-scope' }))}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="rate-client" className="cursor-pointer font-normal">Client Scope</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="rate-extra"
                    checked={customWorkForm.rateType === 'extra'}
                    onChange={() => setCustomWorkForm(prev => ({ ...prev, rateType: 'extra' }))}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="rate-extra" className="cursor-pointer font-normal">Extra (Variable)</Label>
                </div>
              </div>
            </div>

            {customWorkForm.rateType === 'fixed' && (
              <div className="space-y-2">
                <Label htmlFor="custom-rate">Rate Amount (₹)</Label>
                <Input
                  id="custom-rate"
                  type="number"
                  value={customWorkForm.rate}
                  onChange={(e) => setCustomWorkForm(prev => ({ ...prev, rate: Number(e.target.value) }))}
                  placeholder="Enter rate per unit"
                  min={0}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="custom-description">Description (Optional)</Label>
              <Input
                id="custom-description"
                value={customWorkForm.description}
                onChange={(e) => setCustomWorkForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateCustomDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomWork} disabled={!customWorkForm.name.trim()}>
              <Plus className="mr-2" size={16} />
              Create & Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
