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

interface Brand {
  id: string
  name: string
  category: string
  tier: 'basic' | 'standard' | 'premium' | 'all'
  usageCount: number
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

const DEFAULT_BRANDS: Brand[] = [
  {
    id: 'brand-001',
    name: 'Ultratech',
    category: 'Basement & Concrete',
    tier: 'premium',
    usageCount: 15,
    createdAt: new Date().toISOString()
  },
  {
    id: 'brand-002',
    name: 'Coromandel',
    category: 'Basement & Concrete',
    tier: 'standard',
    usageCount: 23,
    createdAt: new Date().toISOString()
  },
  {
    id: 'brand-003',
    name: 'Zuari',
    category: 'Basement & Concrete',
    tier: 'basic',
    usageCount: 18,
    createdAt: new Date().toISOString()
  },
  {
    id: 'brand-004',
    name: 'KAG',
    category: 'Flooring & Tiles',
    tier: 'all',
    usageCount: 42,
    createdAt: new Date().toISOString()
  },
  {
    id: 'brand-005',
    name: 'Kajaria',
    category: 'Flooring & Tiles',
    tier: 'premium',
    usageCount: 12,
    createdAt: new Date().toISOString()
  },
  {
    id: 'brand-006',
    name: 'Legrand',
    category: 'Electrical',
    tier: 'premium',
    usageCount: 8,
    createdAt: new Date().toISOString()
  },
  {
    id: 'brand-007',
    name: 'Anchor Roma',
    category: 'Electrical',
    tier: 'standard',
    usageCount: 25,
    createdAt: new Date().toISOString()
  },
  {
    id: 'brand-008',
    name: 'Orbit',
    category: 'Electrical',
    tier: 'basic',
    usageCount: 19,
    createdAt: new Date().toISOString()
  },
  {
    id: 'brand-009',
    name: 'I Steel',
    category: 'Iron & Steel',
    tier: 'premium',
    usageCount: 10,
    createdAt: new Date().toISOString()
  },
  {
    id: 'brand-010',
    name: 'ARS',
    category: 'Iron & Steel',
    tier: 'standard',
    usageCount: 28,
    createdAt: new Date().toISOString()
  }
]

export function BrandMaster() {
  const [brands, setBrands] = useKV<Brand[]>('brands-master', DEFAULT_BRANDS)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  
  const [formData, setFormData] = useState<Omit<Brand, 'id' | 'usageCount' | 'createdAt'>>({
    name: '',
    category: CATEGORIES[0],
    tier: 'all'
  })

  const filteredBrands = (brands || DEFAULT_BRANDS).filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || brand.category === filterCategory
    const matchesTier = filterTier === 'all' || brand.tier === filterTier
    return matchesSearch && matchesCategory && matchesTier
  })

  const handleAdd = () => {
    setEditingBrand(null)
    setFormData({
      name: '',
      category: CATEGORIES[0],
      tier: 'all'
    })
    setDialogOpen(true)
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setFormData({
      name: brand.name,
      category: brand.category,
      tier: brand.tier
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter brand name')
      return
    }

    if (editingBrand) {
      setBrands(prev =>
        (prev || []).map(brand =>
          brand.id === editingBrand.id
            ? { ...brand, ...formData }
            : brand
        )
      )
      toast.success('Brand updated successfully')
    } else {
      const newBrand: Brand = {
        id: `brand-${Date.now()}`,
        ...formData,
        usageCount: 0,
        createdAt: new Date().toISOString()
      }
      setBrands(prev => [...(prev || []), newBrand])
      toast.success('Brand added successfully')
    }

    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      setBrands(prev => (prev || []).filter(brand => brand.id !== id))
      toast.success('Brand deleted successfully')
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-gray-500'
      case 'standard': return 'bg-blue-500'
      case 'premium': return 'bg-amber-500'
      default: return 'bg-green-500'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Brand Master</CardTitle>
              <CardDescription>
                Manage construction material brands and their tier associations
              </CardDescription>
            </div>
            <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2" size={18} />
              Add Brand
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search brands..."
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
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Usage Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No brands found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBrands.map(brand => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{brand.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTierColor(brand.tier)} text-white capitalize`}>
                          {brand.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{brand.usageCount} projects</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(brand)}
                          >
                            <PencilSimple size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(brand.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
            <DialogDescription>
              Configure brand details and category association
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name *</Label>
              <Input
                id="brandName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Ultratech, KAG, Legrand"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandCategory">Material Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="brandCategory">
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
              <Label htmlFor="brandTier">Tier Association *</Label>
              <Select
                value={formData.tier}
                onValueChange={(value: 'basic' | 'standard' | 'premium' | 'all') => 
                  setFormData(prev => ({ ...prev, tier: value }))
                }
              >
                <SelectTrigger id="brandTier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="basic">Basic Only</SelectItem>
                  <SelectItem value="standard">Standard Only</SelectItem>
                  <SelectItem value="premium">Premium Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select which package tier(s) this brand is available in
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">
              {editingBrand ? 'Update' : 'Add'} Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
