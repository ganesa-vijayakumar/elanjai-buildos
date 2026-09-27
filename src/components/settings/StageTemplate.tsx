import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { ArrowCounterClockwise, FloppyDisk, PencilSimple, Check, X } from '@phosphor-icons/react'
import { BuildingType, BUILDING_TYPE_LABELS } from '@/lib/types'

interface StageTemplateData {
  id: number
  name: string
  percentage: number
  estimatedDays: number
}

const DEFAULT_STAGES: StageTemplateData[] = [
  { id: 1, name: 'Foundation / Excavation', percentage: 8, estimatedDays: 15 },
  { id: 2, name: 'Plinth Beam / PCC', percentage: 5, estimatedDays: 10 },
  { id: 3, name: 'Basement / Sump', percentage: 5, estimatedDays: 7 },
  { id: 4, name: 'Ground Floor Columns', percentage: 7, estimatedDays: 10 },
  { id: 5, name: 'Ground Floor Slab', percentage: 10, estimatedDays: 12 },
  { id: 6, name: 'First Floor Columns', percentage: 7, estimatedDays: 10 },
  { id: 7, name: 'First Floor Slab', percentage: 10, estimatedDays: 12 },
  { id: 8, name: 'Roof Slab / Terrace', percentage: 8, estimatedDays: 12 },
  { id: 9, name: 'Brickwork / Blockwork', percentage: 8, estimatedDays: 20 },
  { id: 10, name: 'Plastering', percentage: 7, estimatedDays: 15 },
  { id: 11, name: 'Flooring / Tiling', percentage: 7, estimatedDays: 15 },
  { id: 12, name: 'Electrical & Plumbing', percentage: 6, estimatedDays: 12 },
  { id: 13, name: 'Doors & Windows', percentage: 5, estimatedDays: 10 },
  { id: 14, name: 'Painting', percentage: 5, estimatedDays: 12 },
  { id: 15, name: 'Final Finishing / Handover', percentage: 2, estimatedDays: 7 }
]

export function StageTemplate() {
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType>('individual_home')
  const stageKey = `stage-template-${selectedBuildingType}`
  const [stages, setStages] = useKV<StageTemplateData[]>(stageKey, DEFAULT_STAGES)
  const [localStages, setLocalStages] = useState<StageTemplateData[]>(stages || DEFAULT_STAGES)
  const [editingId, setEditingId] = useState<number | null>(null)

  const totalPercentage = localStages.reduce((sum, stage) => sum + stage.percentage, 0)
  const totalDays = localStages.reduce((sum, stage) => sum + stage.estimatedDays, 0)
  const isValid = totalPercentage === 100

  const handleEdit = (id: number) => {
    setEditingId(id)
  }

  const handleCancel = () => {
    setLocalStages(stages || DEFAULT_STAGES)
    setEditingId(null)
  }

  const handleUpdate = (id: number, field: 'name' | 'percentage' | 'estimatedDays', value: string | number) => {
    setLocalStages(prev =>
      prev.map(stage => {
        if (stage.id === id) {
          return {
            ...stage,
            [field]: typeof value === 'string' ? value : value
          }
        }
        return stage
      })
    )
  }

  const handleSave = () => {
    if (!isValid) {
      toast.error('Total percentage must equal 100%')
      return
    }

    setStages(localStages)
    setEditingId(null)
    toast.success('Stage template updated successfully')
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to default stages? This will discard all changes.')) {
      setLocalStages(DEFAULT_STAGES)
      setStages(DEFAULT_STAGES)
      setEditingId(null)
      toast.success('Stages reset to defaults')
    }
  }

  // Sync local stages when building type or KV stages change
  const handleBuildingTypeChange = (buildingType: BuildingType) => {
    setSelectedBuildingType(buildingType)
    setEditingId(null)
  }

  // Update local stages when KV stages change (e.g., after building type switch)
  useEffect(() => {
    setLocalStages(stages || DEFAULT_STAGES)
  }, [stages])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Construction Stage Template</CardTitle>
              <CardDescription>
                Configure construction stages for each building type with cost percentages and timelines
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <ArrowCounterClockwise className="mr-2" size={16} />
                Reset to Defaults
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-red-600 hover:bg-red-700" disabled={!isValid}>
                <FloppyDisk className="mr-2" size={16} />
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Building Type Selector */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">Building Type</Label>
            <Tabs value={selectedBuildingType} onValueChange={(value) => handleBuildingTypeChange(value as BuildingType)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="individual_home">Individual Home</TabsTrigger>
                <TabsTrigger value="villa">Villa</TabsTrigger>
                <TabsTrigger value="duplex">Duplex</TabsTrigger>
                <TabsTrigger value="apartment">Apartment</TabsTrigger>
                <TabsTrigger value="commercial">Commercial</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Total Percentage</div>
              <div className={`text-2xl font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                {totalPercentage}%
                {isValid ? (
                  <Badge className="ml-2 bg-green-500">Valid</Badge>
                ) : (
                  <Badge className="ml-2 bg-red-500">Must be 100%</Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Estimated Days</div>
              <div className="text-2xl font-bold text-blue-600">
                {totalDays} days
                <span className="text-sm text-muted-foreground ml-2">
                  (~{Math.round(totalDays / 30)} months)
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Stages</div>
              <div className="text-2xl font-bold text-gray-700">
                {localStages.length}
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Stage Name</TableHead>
                  <TableHead className="text-right w-32">% of Cost</TableHead>
                  <TableHead className="text-right w-32">Est. Days</TableHead>
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localStages.map((stage) => (
                  <TableRow key={stage.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {stage.id}
                    </TableCell>
                    <TableCell>
                      {editingId === stage.id ? (
                        <Input
                          value={stage.name}
                          onChange={(e) => handleUpdate(stage.id, 'name', e.target.value)}
                          className="max-w-md"
                        />
                      ) : (
                        <span className="font-medium">{stage.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === stage.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            value={stage.percentage}
                            onChange={(e) => handleUpdate(stage.id, 'percentage', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right font-mono"
                            min="0"
                            max="100"
                            step="0.5"
                          />
                          <span className="text-sm">%</span>
                        </div>
                      ) : (
                        <span className="font-mono font-semibold">{stage.percentage}%</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === stage.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            value={stage.estimatedDays}
                            onChange={(e) => handleUpdate(stage.id, 'estimatedDays', parseInt(e.target.value) || 0)}
                            className="w-20 text-right font-mono"
                            min="1"
                          />
                          <span className="text-sm text-muted-foreground">d</span>
                        </div>
                      ) : (
                        <span className="font-mono">{stage.estimatedDays} days</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === stage.id ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingId(null)}
                          >
                            <Check size={18} className="text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancel}
                          >
                            <X size={18} className="text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(stage.id)}
                        >
                          <PencilSimple size={18} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!isValid && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-red-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800">Invalid Configuration</h4>
                  <p className="text-sm text-red-700 mt-1">
                    The total percentage is currently {totalPercentage}%. Please adjust the stage percentages so they total exactly 100%.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
