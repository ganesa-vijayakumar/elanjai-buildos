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
import { Plus, PencilSimple, Trash, MagnifyingGlass } from '@phosphor-icons/react'

interface Material {
  id: string
  name: string
  category: string
  unit: string
  rateBasic: number
  rateStandard: number
  ratePremium: number
  brands: string[]
  createdAt: string
}

const CATEGORIES = [
  'Basement & Concrete',
  'Brick Layer',
  'Plastering',
  'Flooring & Tiles',
  'Iron & Steel',
  'Carpentry & Joinery',
  'Painting',
  'Electrical',
  'Plumbing & Sanitary'
]

const UNITS = ['sq.ft', 'cum', 'kg', 'nos', 'RFT', 'liter', 'bag', 'bundle']

const DEFAULT_MATERIALS: Material[] = [
  {
    id: 'mat-001',
    name: 'Vitrified Tiles',
    category: 'Flooring & Tiles',
    unit: 'sq.ft',
    rateBasic: 60,
    rateStandard: 70,
    ratePremium: 80,
    brands: ['KAG', 'Anuj', 'Kajaria'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-002',
    name: 'Cement',
    category: 'Basement & Concrete',
    unit: 'bag',
    rateBasic: 350,
    rateStandard: 380,
    ratePremium: 420,
    brands: ['Zuari', 'Dalmia', 'Coromandel', 'Ultratech'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-003',
    name: 'TMT Steel Bars',
    category: 'Iron & Steel',
    unit: 'kg',
    rateBasic: 65,
    rateStandard: 68,
    ratePremium: 72,
    brands: ['Kamachi', 'ARS', 'ARUN', 'I Steel'],
    createdAt: new Date().toISOString()
  }
]

export function MaterialMaster() {
  const [materials, setMaterials] = useKV<Material[]>('materials-master', DEFAULT_MATERIALS)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  
  const [formData, setFormData] = useState<Omit<Material, 'id' | 'createdAt'>>({
    name: '',
    category: CATEGORIES[0],
    unit: UNITS[0],
    rateBasic: 0,
    rateStandard: 0,
    ratePremium: 0,
    brands: []
  })

  const filteredMaterials = (materials || DEFAULT_MATERIALS).filter(mat => {
    const matchesSearch = mat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mat.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || mat.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleAdd = () => {
    setEditingMaterial(null)
    setFormData({
      name: '',
      category: CATEGORIES[0],
      unit: UNITS[0],
      rateBasic: 0,
      rateStandard: 0,
      ratePremium: 0,
      brands: []
    })
    setDialogOpen(true)
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      name: material.name,
      category: material.category,
      unit: material.unit,
      rateBasic: material.rateBasic,
      rateStandard: material.rateStandard,
      ratePremium: material.ratePremium,
      brands: material.brands
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter material name')
      return
    }

    if (editingMaterial) {
      setMaterials(prev =>
        (prev || []).map(mat =>
          mat.id === editingMaterial.id
            ? { ...mat, ...formData }
            : mat
        )
      )
      toast.success('Material updated successfully')
    } else {
      const newMaterial: Material = {
        id: `mat-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString()
      }
      setMaterials(prev => [...(prev || []), newMaterial])
      toast.success('Material added successfully')
    }

    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      setMaterials(prev => (prev || []).filter(mat => mat.id !== id))
      toast.success('Material deleted successfully')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Material Master</CardTitle>
              <CardDescription>
                Manage construction materials with rates across all package tiers
              </CardDescription>
            </div>
            <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2" size={18} />
              Add Material
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">Standard</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                  <TableHead>Brands</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No materials found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials.map(material => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{material.category}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{material.unit}</TableCell>
                      <TableCell className="text-right font-mono">₹{material.rateBasic}</TableCell>
                      <TableCell className="text-right font-mono">₹{material.rateStandard}</TableCell>
                      <TableCell className="text-right font-mono">₹{material.ratePremium}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {material.brands.slice(0, 2).map(brand => (
                            <Badge key={brand} variant="secondary" className="text-xs">
                              {brand}
                            </Badge>
                          ))}
                          {material.brands.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{material.brands.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(material)}
                          >
                            <PencilSimple size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(material.id)}
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
            <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add New Material'}</DialogTitle>
            <DialogDescription>
              Configure material details and rates for all package tiers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="name">Material Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Vitrified Tiles"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
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
            </div>

            <div className="space-y-2">
              <Label>Rates per Tier</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="rateBasic" className="text-xs text-muted-foreground">Basic (₹)</Label>
                  <Input
                    id="rateBasic"
                    type="number"
                    value={formData.rateBasic}
                    onChange={(e) => setFormData(prev => ({ ...prev, rateBasic: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rateStandard" className="text-xs text-muted-foreground">Standard (₹)</Label>
                  <Input
                    id="rateStandard"
                    type="number"
                    value={formData.rateStandard}
                    onChange={(e) => setFormData(prev => ({ ...prev, rateStandard: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ratePremium" className="text-xs text-muted-foreground">Premium (₹)</Label>
                  <Input
                    id="ratePremium"
                    type="number"
                    value={formData.ratePremium}
                    onChange={(e) => setFormData(prev => ({ ...prev, ratePremium: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brands">Associated Brands (comma-separated)</Label>
              <Input
                id="brands"
                value={formData.brands.join(', ')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  brands: e.target.value.split(',').map(b => b.trim()).filter(Boolean) 
                }))}
                placeholder="e.g., KAG, Anuj, Kajaria"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">
              {editingMaterial ? 'Update' : 'Add'} Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
