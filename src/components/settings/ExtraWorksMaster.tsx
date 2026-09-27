import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, PencilSimple, Trash, FloppyDisk } from '@phosphor-icons/react'

interface ExtraWorkItem {
  id: string
  itemCode: string
  name: string
  unit: string
  rate: number | string
  scope: 'extra' | 'client-scope' | 'lumpsum'
  description?: string
  defaultEnabled: boolean
}

const DEFAULT_EXTRA_WORKS: ExtraWorkItem[] = [
  { id: 'ew-001', itemCode: 'A', name: 'Drawing & Approval', unit: 'lumpsum', rate: 'Client scope', scope: 'client-scope', defaultEnabled: false },
  { id: 'ew-002', itemCode: 'B', name: 'Elevation Design', unit: 'lumpsum', rate: 'Client scope', scope: 'client-scope', defaultEnabled: false },
  { id: 'ew-003', itemCode: 'C', name: 'Lift', unit: 'nos', rate: 'Extra', scope: 'extra', defaultEnabled: false },
  { id: 'ew-004', itemCode: 'D', name: 'Sump (RCC)', unit: 'liter', rate: 0.25, scope: 'extra', defaultEnabled: true },
  { id: 'ew-005', itemCode: 'E', name: 'Septic Tank (Brick)', unit: 'liter', rate: 0.20, scope: 'extra', defaultEnabled: true },
  { id: 'ew-006', itemCode: 'F', name: 'OHT (RCC)', unit: 'liter', rate: 0.25, scope: 'extra', defaultEnabled: true },
  { id: 'ew-007', itemCode: 'G', name: 'Compound Wall', unit: 'RFT', rate: 2000, scope: 'extra', defaultEnabled: true },
  { id: 'ew-008', itemCode: 'H', name: 'Bore Well', unit: 'nos', rate: 'Extra', scope: 'extra', defaultEnabled: false },
  { id: 'ew-009', itemCode: 'I', name: 'Weathering Tiles', unit: 'sq.ft', rate: 140, scope: 'extra', defaultEnabled: false },
  { id: 'ew-010', itemCode: 'J', name: 'EB Connection', unit: 'lumpsum', rate: 'Client scope', scope: 'client-scope', defaultEnabled: false },
  { id: 'ew-011', itemCode: 'K', name: 'Electrical Fittings', unit: 'lumpsum', rate: 'Client scope', scope: 'client-scope', defaultEnabled: false },
  { id: 'ew-012', itemCode: 'L', name: 'Interior Work', unit: 'lumpsum', rate: 'Client scope', scope: 'client-scope', defaultEnabled: false },
  { id: 'ew-013', itemCode: 'M', name: 'Parapet Wall 9"', unit: 'RFT', rate: 150, scope: 'extra', defaultEnabled: false },
  { id: 'ew-014', itemCode: 'N', name: 'Choke Pits, Drainage', unit: 'lumpsum', rate: 'Extra', scope: 'extra', defaultEnabled: false },
  { id: 'ew-015', itemCode: 'O', name: 'Water Purchase', unit: 'lumpsum', rate: 'Extra', scope: 'extra', defaultEnabled: false },
  { id: 'ew-016', itemCode: 'P', name: 'GST', unit: '%', rate: 18, scope: 'lumpsum', description: 'Additional to quoted amount', defaultEnabled: true },
  { id: 'ew-017', itemCode: 'Q', name: 'Setback Area Filling', unit: 'lumpsum', rate: 'Extra', scope: 'extra', defaultEnabled: false }
]

const UNITS = ['sq.ft', 'cum', 'kg', 'nos', 'RFT', 'liter', 'lumpsum', '%', 'bag']

export function ExtraWorksMaster() {
  const [extraWorks, setExtraWorks] = useKV<ExtraWorkItem[]>('extra-works-master', DEFAULT_EXTRA_WORKS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ExtraWorkItem | null>(null)
  
  const [formData, setFormData] = useState<Omit<ExtraWorkItem, 'id'>>({
    itemCode: '',
    name: '',
    unit: UNITS[0],
    rate: 0,
    scope: 'extra',
    defaultEnabled: false,
    description: ''
  })

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      itemCode: '',
      name: '',
      unit: UNITS[0],
      rate: 0,
      scope: 'extra',
      defaultEnabled: false,
      description: ''
    })
    setDialogOpen(true)
  }

  const handleEdit = (item: ExtraWorkItem) => {
    setEditingItem(item)
    setFormData({
      itemCode: item.itemCode,
      name: item.name,
      unit: item.unit,
      rate: item.rate,
      scope: item.scope,
      defaultEnabled: item.defaultEnabled,
      description: item.description || ''
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter item name')
      return
    }

    if (editingItem) {
      setExtraWorks(prev =>
        (prev || []).map(item =>
          item.id === editingItem.id
            ? { ...item, ...formData }
            : item
        )
      )
      toast.success('Extra work item updated successfully')
    } else {
      const newItem: ExtraWorkItem = {
        id: `ew-${Date.now()}`,
        ...formData
      }
      setExtraWorks(prev => [...(prev || []), newItem])
      toast.success('Extra work item added successfully')
    }

    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this extra work item?')) {
      setExtraWorks(prev => (prev || []).filter(item => item.id !== id))
      toast.success('Extra work item deleted successfully')
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to default extra works? This will discard all changes.')) {
      setExtraWorks(DEFAULT_EXTRA_WORKS)
      toast.success('Extra works reset to defaults')
    }
  }

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'client-scope': return 'bg-blue-500'
      case 'lumpsum': return 'bg-purple-500'
      default: return 'bg-green-500'
    }
  }

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'client-scope': return 'Client Scope'
      case 'lumpsum': return 'Lumpsum'
      default: return 'Extra'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Extra Works Master</CardTitle>
              <CardDescription>
                Configure default extra work items and rates for quotations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset to Defaults
              </Button>
              <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2" size={18} />
                Add Extra Work
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead className="text-center">Default</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(extraWorks || DEFAULT_EXTRA_WORKS).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No extra work items configured
                    </TableCell>
                  </TableRow>
                ) : (
                  (extraWorks || DEFAULT_EXTRA_WORKS).map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold text-center">{item.itemCode}</TableCell>
                      <TableCell className="font-medium">
                        {item.name}
                        {item.description && (
                          <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.unit}</TableCell>
                      <TableCell className="text-right font-mono">
                        {typeof item.rate === 'number' ? (
                          item.unit === '%' ? `${item.rate}%` : `₹${item.rate.toLocaleString('en-IN')}`
                        ) : (
                          <span className="text-muted-foreground">{item.rate}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getScopeColor(item.scope)} text-white`}>
                          {getScopeLabel(item.scope)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.defaultEnabled ? (
                          <Badge className="bg-green-500">Enabled</Badge>
                        ) : (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <PencilSimple size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash size={18} className="text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Extra Work Item' : 'Add New Extra Work Item'}</DialogTitle>
            <DialogDescription>
              Configure extra work item details and default rates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemCode">Item Code</Label>
                <Input
                  id="itemCode"
                  value={formData.itemCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))}
                  placeholder="e.g., A, B, C"
                  maxLength={3}
                />
              </div>

              <div className="space-y-2 col-span-3">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sump (RCC), Compound Wall"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Rate</Label>
                <Input
                  id="rate"
                  value={formData.rate}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '' || !isNaN(Number(val))) {
                      setFormData(prev => ({ ...prev, rate: val === '' ? 0 : parseFloat(val) }))
                    } else {
                      setFormData(prev => ({ ...prev, rate: val }))
                    }
                  }}
                  placeholder="Enter rate or 'Client scope', 'Extra'"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Scope</Label>
              <Select
                value={formData.scope}
                onValueChange={(value: 'extra' | 'client-scope' | 'lumpsum') => 
                  setFormData(prev => ({ ...prev, scope: value }))
                }
              >
                <SelectTrigger id="scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="extra">Extra (Builder Scope)</SelectItem>
                  <SelectItem value="client-scope">Client Scope</SelectItem>
                  <SelectItem value="lumpsum">Lumpsum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional notes or clarifications"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="defaultEnabled"
                checked={formData.defaultEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultEnabled: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <Label htmlFor="defaultEnabled" className="font-normal cursor-pointer">
                Enable by default in new quotations
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">
              <FloppyDisk className="mr-2" size={16} />
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
