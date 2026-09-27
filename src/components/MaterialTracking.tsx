import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { 
  Project, 
  ProjectMaterial, 
  MaterialBrand, 
  MaterialStatus, 
  MaterialCategory,
  MATERIAL_STATUS_LABELS,
  MATERIAL_CATEGORY_LABELS,
  DEFAULT_MATERIAL_BRANDS,
  MaterialPhoto
} from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Package, Upload, Calendar, Warning, Check, X, Image as ImageIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface MaterialTrackingProps {
  project: Project
  onProjectUpdate: (project: Project) => void
}

export function MaterialTracking({ project, onProjectUpdate }: MaterialTrackingProps) {
  const [materialBrands] = useKV<MaterialBrand[]>('material-brands', DEFAULT_MATERIAL_BRANDS)
  const [materials, setMaterials] = useState<ProjectMaterial[]>(project.materials || [])
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<ProjectMaterial | null>(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [showAddBrandDialog, setShowAddBrandDialog] = useState(false)
  const [pendingBrandName, setPendingBrandName] = useState('')
  const [pendingBrandCategory, setPendingBrandCategory] = useState<MaterialCategory>('cement')
  const [selectedMaterialForBrand, setSelectedMaterialForBrand] = useState<string | null>(null)

  const [newMaterial, setNewMaterial] = useState({
    category: 'cement' as MaterialCategory,
    materialName: '',
    specifiedBrand: '',
    estimatedQuantity: 0,
    unit: 'bags'
  })

  const [statusUpdate, setStatusUpdate] = useState({
    status: 'pending' as MaterialStatus,
    notes: ''
  })

  const handleAddMaterial = () => {
    const material: ProjectMaterial = {
      id: `mat-${Date.now()}`,
      projectId: project.id,
      category: newMaterial.category,
      materialName: newMaterial.materialName,
      specifiedBrand: newMaterial.specifiedBrand,
      estimatedQuantity: newMaterial.estimatedQuantity,
      actualQuantityUsed: 0,
      unit: newMaterial.unit,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        date: new Date().toISOString(),
        changedBy: 'Current User'
      }],
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedMaterials = [...materials, material]
    setMaterials(updatedMaterials)
    onProjectUpdate({ ...project, materials: updatedMaterials })
    
    setNewMaterial({
      category: 'cement',
      materialName: '',
      specifiedBrand: '',
      estimatedQuantity: 0,
      unit: 'bags'
    })
    setIsAddMaterialOpen(false)
    toast.success('Material added successfully')
  }

  const handleBrandChange = (materialId: string, brandValue: string) => {
    if (brandValue === 'other') {
      setSelectedMaterialForBrand(materialId)
      const material = materials.find(m => m.id === materialId)
      if (material) {
        setPendingBrandCategory(material.category)
      }
      setShowAddBrandDialog(true)
    } else {
      const updatedMaterials = materials.map(m => 
        m.id === materialId 
          ? { ...m, actualBrand: brandValue, actualBrandId: brandValue, updatedAt: new Date().toISOString() }
          : m
      )
      setMaterials(updatedMaterials)
      onProjectUpdate({ ...project, materials: updatedMaterials })
    }
  }

  const handleAddNewBrand = (addToMaster: boolean) => {
    if (!pendingBrandName.trim()) {
      toast.error('Please enter a brand name')
      return
    }

    if (selectedMaterialForBrand) {
      const updatedMaterials = materials.map(m => 
        m.id === selectedMaterialForBrand 
          ? { ...m, actualBrand: pendingBrandName, updatedAt: new Date().toISOString() }
          : m
      )
      setMaterials(updatedMaterials)
      onProjectUpdate({ ...project, materials: updatedMaterials })
    }

    if (addToMaster) {
      toast.success(`${pendingBrandName} will be added to master brand list`)
    }

    setPendingBrandName('')
    setSelectedMaterialForBrand(null)
    setShowAddBrandDialog(false)
  }

  const handleStatusChange = () => {
    if (!selectedMaterial) return

    const updatedMaterials = materials.map(m => {
      if (m.id === selectedMaterial.id) {
        return {
          ...m,
          status: statusUpdate.status,
          statusHistory: [
            ...m.statusHistory,
            {
              status: statusUpdate.status,
              date: new Date().toISOString(),
              changedBy: 'Current User',
              notes: statusUpdate.notes
            }
          ],
          updatedAt: new Date().toISOString()
        }
      }
      return m
    })

    setMaterials(updatedMaterials)
    onProjectUpdate({ ...project, materials: updatedMaterials })
    setIsStatusDialogOpen(false)
    setSelectedMaterial(null)
    setStatusUpdate({ status: 'pending', notes: '' })
    toast.success('Material status updated')
  }

  const handleQuantityUpdate = (materialId: string, quantity: number) => {
    const material = materials.find(m => m.id === materialId)
    if (!material) return

    const exceedsThreshold = quantity > material.estimatedQuantity * 1.1

    const updatedMaterials = materials.map(m =>
      m.id === materialId
        ? { ...m, actualQuantityUsed: quantity, updatedAt: new Date().toISOString() }
        : m
    )

    setMaterials(updatedMaterials)
    onProjectUpdate({ ...project, materials: updatedMaterials })

    if (exceedsThreshold) {
      toast.error(`⚠️ Usage exceeds estimate by more than 10% for ${material.materialName}!`)
    }
  }

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files || !selectedMaterial) return

    const newPhotos: MaterialPhoto[] = Array.from(files).map(file => ({
      id: `photo-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      caption: file.name,
      type: 'site-photo',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Current User'
    }))

    const updatedMaterials = materials.map(m =>
      m.id === selectedMaterial.id
        ? { ...m, photos: [...m.photos, ...newPhotos], updatedAt: new Date().toISOString() }
        : m
    )

    setMaterials(updatedMaterials)
    onProjectUpdate({ ...project, materials: updatedMaterials })
    toast.success(`${newPhotos.length} photo(s) uploaded`)
  }

  const getStatusBadgeColor = (status: MaterialStatus) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      ordered: 'bg-blue-100 text-blue-700',
      delivered: 'bg-amber-100 text-amber-700',
      installed: 'bg-emerald-100 text-emerald-700'
    }
    return colors[status]
  }

  const getUsageVariance = (material: ProjectMaterial) => {
    if (material.estimatedQuantity === 0) return 0
    return ((material.actualQuantityUsed - material.estimatedQuantity) / material.estimatedQuantity) * 100
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 10) return 'text-red-600'
    if (variance > 0) return 'text-amber-600'
    return 'text-emerald-600'
  }

  const groupedMaterials = materials.reduce((acc, material) => {
    if (!acc[material.category]) {
      acc[material.category] = []
    }
    acc[material.category].push(material)
    return acc
  }, {} as Record<MaterialCategory, ProjectMaterial[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Material & Brand Tracking</h2>
          <p className="text-sm text-gray-600 mt-1">Track materials and brands used during construction</p>
        </div>
        <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2" /> Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Material</DialogTitle>
              <DialogDescription>Add a material to track for this project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={newMaterial.category}
                  onValueChange={(value) => setNewMaterial({ ...newMaterial, category: value as MaterialCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MATERIAL_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Material Name</Label>
                <Input
                  value={newMaterial.materialName}
                  onChange={(e) => setNewMaterial({ ...newMaterial, materialName: e.target.value })}
                  placeholder="e.g., Portland Cement 53 Grade"
                />
              </div>
              <div>
                <Label>Specified Brand</Label>
                <Input
                  value={newMaterial.specifiedBrand}
                  onChange={(e) => setNewMaterial({ ...newMaterial, specifiedBrand: e.target.value })}
                  placeholder="e.g., Ultratech"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estimated Quantity</Label>
                  <Input
                    type="number"
                    value={newMaterial.estimatedQuantity}
                    onChange={(e) => setNewMaterial({ ...newMaterial, estimatedQuantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Input
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    placeholder="e.g., bags, kg"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMaterialOpen(false)}>Cancel</Button>
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={handleAddMaterial}
                disabled={!newMaterial.materialName || !newMaterial.specifiedBrand}
              >
                Add Material
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No materials tracked yet</p>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => setIsAddMaterialOpen(true)}
            >
              <Plus className="mr-2" /> Add First Material
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Materials ({materials.length})</TabsTrigger>
            {Object.entries(groupedMaterials).map(([category, items]) => (
              <TabsTrigger key={category} value={category}>
                {MATERIAL_CATEGORY_LABELS[category as MaterialCategory]} ({items.length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Specified Brand</TableHead>
                        <TableHead>Actual Brand</TableHead>
                        <TableHead>Estimated Qty</TableHead>
                        <TableHead>Used Qty</TableHead>
                        <TableHead>Variance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((material) => {
                        const variance = getUsageVariance(material)
                        const brands = materialBrands?.filter(b => b.category === material.category && b.isActive) || []
                        
                        return (
                          <TableRow key={material.id}>
                            <TableCell>
                              <Badge variant="outline">{MATERIAL_CATEGORY_LABELS[material.category]}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{material.materialName}</TableCell>
                            <TableCell>{material.specifiedBrand}</TableCell>
                            <TableCell>
                              <Select
                                value={material.actualBrand || ''}
                                onValueChange={(value) => handleBrandChange(material.id, value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Select brand" />
                                </SelectTrigger>
                                <SelectContent>
                                  {brands.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                                  ))}
                                  <SelectItem value="other">+ Other (Add New)</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>{material.estimatedQuantity} {material.unit}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="w-24"
                                value={material.actualQuantityUsed}
                                onChange={(e) => handleQuantityUpdate(material.id, parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              <span className={`font-semibold ${getVarianceColor(variance)}`}>
                                {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                                {variance > 10 && <Warning className="inline ml-1 w-4 h-4" />}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(material.status)}>
                                {MATERIAL_STATUS_LABELS[material.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedMaterial(material)
                                    setIsStatusDialogOpen(true)
                                  }}
                                >
                                  <Calendar className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedMaterial(material)
                                    setIsPhotoDialogOpen(true)
                                  }}
                                >
                                  <ImageIcon className="w-4 h-4" />
                                  {material.photos.length > 0 && (
                                    <span className="ml-1 text-xs">({material.photos.length})</span>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {Object.entries(groupedMaterials).map(([category, items]) => (
            <TabsContent key={category} value={category}>
              <Card>
                <CardHeader>
                  <CardTitle>{MATERIAL_CATEGORY_LABELS[category as MaterialCategory]}</CardTitle>
                  <CardDescription>{items.length} material(s) in this category</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Specified Brand</TableHead>
                          <TableHead>Actual Brand</TableHead>
                          <TableHead>Estimated Qty</TableHead>
                          <TableHead>Used Qty</TableHead>
                          <TableHead>Variance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((material) => {
                          const variance = getUsageVariance(material)
                          const brands = materialBrands?.filter(b => b.category === material.category && b.isActive) || []
                          
                          return (
                            <TableRow key={material.id}>
                              <TableCell className="font-medium">{material.materialName}</TableCell>
                              <TableCell>{material.specifiedBrand}</TableCell>
                              <TableCell>
                                <Select
                                  value={material.actualBrand || ''}
                                  onValueChange={(value) => handleBrandChange(material.id, value)}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Select brand" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {brands.map((brand) => (
                                      <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                                    ))}
                                    <SelectItem value="other">+ Other (Add New)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>{material.estimatedQuantity} {material.unit}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="w-24"
                                  value={material.actualQuantityUsed}
                                  onChange={(e) => handleQuantityUpdate(material.id, parseFloat(e.target.value) || 0)}
                                />
                              </TableCell>
                              <TableCell>
                                <span className={`font-semibold ${getVarianceColor(variance)}`}>
                                  {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                                  {variance > 10 && <Warning className="inline ml-1 w-4 h-4" />}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusBadgeColor(material.status)}>
                                  {MATERIAL_STATUS_LABELS[material.status]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedMaterial(material)
                                      setIsStatusDialogOpen(true)
                                    }}
                                  >
                                    <Calendar className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedMaterial(material)
                                      setIsPhotoDialogOpen(true)
                                    }}
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                    {material.photos.length > 0 && (
                                      <span className="ml-1 text-xs">({material.photos.length})</span>
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Material Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedMaterial?.materialName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select
                value={statusUpdate.status}
                onValueChange={(value) => setStatusUpdate({ ...statusUpdate, status: value as MaterialStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MATERIAL_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Input
                value={statusUpdate.notes}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                placeholder="Add any notes..."
              />
            </div>
            {selectedMaterial && selectedMaterial.statusHistory.length > 0 && (
              <div>
                <Label className="text-sm text-gray-600">Status History</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {selectedMaterial.statusHistory.map((history, idx) => (
                    <div key={idx} className="text-sm border-l-2 border-gray-200 pl-3 py-1">
                      <div className="font-medium">{MATERIAL_STATUS_LABELS[history.status]}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(history.date).toLocaleDateString()} - {history.changedBy}
                      </div>
                      {history.notes && <div className="text-xs text-gray-600 mt-1">{history.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleStatusChange}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Material Photos</DialogTitle>
            <DialogDescription>
              Upload and manage photos for {selectedMaterial?.materialName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Upload Photos</Label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e.target.files)}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">Upload invoices, delivery notes, or site photos</p>
            </div>
            {selectedMaterial && selectedMaterial.photos.length > 0 && (
              <div>
                <Label>Uploaded Photos ({selectedMaterial.photos.length})</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {selectedMaterial.photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-32 object-cover rounded border"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 rounded-b opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="truncate">{photo.caption}</p>
                        <p className="text-[10px] text-gray-300">
                          {new Date(photo.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPhotoDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showAddBrandDialog} onOpenChange={setShowAddBrandDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the brand name you want to use. You can optionally add it to the master list for future use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label>Brand Name</Label>
            <Input
              value={pendingBrandName}
              onChange={(e) => setPendingBrandName(e.target.value)}
              placeholder="Enter brand name"
              className="mt-1"
            />
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => {
              setPendingBrandName('')
              setSelectedMaterialForBrand(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAddNewBrand(false)}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Use This Time Only
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleAddNewBrand(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Check className="mr-2 w-4 h-4" /> Add to Master List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
