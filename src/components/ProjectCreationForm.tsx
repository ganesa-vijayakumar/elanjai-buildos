import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { CalendarBlank, Buildings, CaretLeft, CheckCircle } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { toast } from 'sonner'
import { Quotation, Project, BuildingType, BUILDING_TYPE_LABELS, CONSTRUCTION_STAGES } from '../lib/types'
import { format, addDays } from 'date-fns'

interface Block {
  blockId: string
  name: string
  units: Unit[]
}

interface Unit {
  unitId: string
  name: string
  ownerName: string
  status: 'active' | 'inactive'
}

interface StageConfig {
  stageId: number
  name: string
  costPercentage: number
  estimatedDays: number
  isShared: boolean
}

interface ProjectCreationFormProps {
  quotation: Quotation
  onCancel: () => void
  onProjectCreated: (projectId: string) => void
}

export function ProjectCreationForm({ quotation, onCancel, onProjectCreated }: ProjectCreationFormProps) {
  const [projects, setProjects] = useKV<Project[]>('construction-projects', [])
  const [quotations, setQuotations] = useKV<Quotation[]>('quotations', [])

  const [projectName, setProjectName] = useState(`${quotation.clientName} - ${quotation.location}`)
  const [projectType, setProjectType] = useState<BuildingType>(quotation.buildingType)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [expectedCompletion, setExpectedCompletion] = useState('')

  const [numBlocks, setNumBlocks] = useState(1)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [stages, setStages] = useState<StageConfig[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const isIndividualHome = projectType === 'individual_home'
  const isApartment = projectType === 'apartment'

  useEffect(() => {
    const totalDays = stages.reduce((sum, stage) => sum + stage.estimatedDays, 0)
    if (startDate) {
      const completion = addDays(new Date(startDate), totalDays)
      setExpectedCompletion(format(completion, 'yyyy-MM-dd'))
    }
  }, [startDate, stages])

  useEffect(() => {
    // Fetch building-specific stage template
    const stageKey = `stage-template-${projectType}`
    const buildingStageTemplate = localStorage.getItem(`kv:${stageKey}`)
    let stageTemplate = CONSTRUCTION_STAGES

    if (buildingStageTemplate) {
      try {
        stageTemplate = JSON.parse(buildingStageTemplate)
      } catch {
        stageTemplate = CONSTRUCTION_STAGES
      }
    }

    const defaultStages: StageConfig[] = stageTemplate.map((stage, index) => ({
      stageId: index + 1,
      name: stage.name,
      costPercentage: stage.percentage,
      estimatedDays: Math.ceil(stage.percentage * 1.5) + 5,
      isShared: ['Foundation', 'Plinth Beam', 'Column', 'Brickwork', 'Slab'].includes(stage.name),
    }))
    setStages(defaultStages)
  }, [projectType])

  useEffect(() => {
    if (isIndividualHome) {
      setBlocks([
        {
          blockId: 'main',
          name: 'Main',
          units: [
            {
              unitId: 'unit_1',
              name: 'Unit 1',
              ownerName: quotation.clientName,
              status: 'active',
            },
          ],
        },
      ])
    } else if (isApartment) {
      const newBlocks: Block[] = []
      const blockLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

      for (let i = 0; i < numBlocks; i++) {
        const blockLabel = blockLabels[i] || `Block ${i + 1}`
        newBlocks.push({
          blockId: `block_${blockLabel.toLowerCase()}`,
          name: `Block ${blockLabel}`,
          units: [],
        })
      }

      setBlocks(newBlocks)
    } else {
      setBlocks([
        {
          blockId: 'main',
          name: 'Main',
          units: [
            {
              unitId: 'unit_1',
              name: 'Unit 1',
              ownerName: quotation.clientName,
              status: 'active',
            },
          ],
        },
      ])
    }
  }, [projectType, numBlocks, quotation.clientName, isIndividualHome, isApartment])

  const handleBlockUnitsChange = (blockIndex: number, numUnits: number) => {
    setBlocks((currentBlocks) => {
      const updatedBlocks = [...currentBlocks]
      const block = updatedBlocks[blockIndex]
      const newUnits: Unit[] = []

      for (let i = 0; i < numUnits; i++) {
        const unitNumber = (i + 1).toString().padStart(2, '0')
        const blockLetter = block.name.split(' ')[1]
        newUnits.push({
          unitId: `${block.blockId}_unit_${i + 1}`,
          name: `${blockLetter}${unitNumber}${i + 1}`,
          ownerName: '',
          status: 'active',
        })
      }

      updatedBlocks[blockIndex] = { ...block, units: newUnits }
      return updatedBlocks
    })
  }

  const handleStageSharedToggle = (stageIndex: number) => {
    setStages((currentStages) => {
      const updatedStages = [...currentStages]
      updatedStages[stageIndex] = {
        ...updatedStages[stageIndex],
        isShared: !updatedStages[stageIndex].isShared,
      }
      return updatedStages
    })
  }

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name')
      return
    }

    if (!startDate) {
      toast.error('Please select a start date')
      return
    }

    if (isApartment && blocks.some((block) => block.units.length === 0)) {
      toast.error('Please configure units for all blocks')
      return
    }

    setIsCreating(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 800))

      const projectNumber = `P-${new Date().getFullYear()}-${String((projects?.length || 0) + 1).padStart(3, '0')}`

      const projectStages = stages.map((stage, index) => ({
        id: `stage-${index + 1}`,
        name: stage.name,
        percentage: stage.costPercentage,
        budgetAmount: (quotation.estimatedTotal * stage.costPercentage) / 100,
        actualSpent: 0,
        status: index === 0 ? ('pending' as const) : ('pending' as const),
        expenses: [],
        budgetAlerts: [],
      }))

      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: projectName,
        clientName: quotation.clientName,
        location: quotation.location,
        type: projectType === 'individual_home' ? 'villa' : (projectType as 'villa' | 'apartment' | 'duplex' | 'commercial'),
        squareFootage: quotation.sqft,
        packageType: quotation.selectedPackage,
        totalCost: quotation.estimatedTotal,
        status: 'pre-construction',
        currentStage: stages[0]?.name || 'Foundation',
        currentStageIndex: 0,
        completionPercentage: 0,
        stages: projectStages,
        totalExpenses: 0,
        totalCollected: 0,
        createdAt: new Date().toISOString(),
        sitePhotos: [],
        materialUsage: {},
        collections: [],
      }

      setProjects((currentProjects) => [...(currentProjects || []), newProject])

      setQuotations((currentQuotations) =>
        (currentQuotations || []).map((q) =>
          q.id === quotation.id
            ? {
              ...q,
              status: 'converted' as const,
              convertedToProjectId: newProject.id,
              updatedAt: new Date().toISOString(),
            }
            : q
        )
      )

      toast.success(`Project ${projectNumber} created successfully!`)
      onProjectCreated(newProject.id)
    } catch (error) {
      toast.error('Failed to create project. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onCancel} className="mb-2">
            <CaretLeft className="mr-2" />
            Back to Quotations
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create Project from Quotation</h1>
          <p className="text-gray-600 mt-1">
            Convert signed quotation {quotation.quotationNumber} into a construction project
          </p>
        </div>
      </div>

      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle weight="fill" className="text-green-600" size={24} />
            Linked Quotation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Quotation ID:</span>
              <p className="font-semibold text-gray-900">{quotation.quotationNumber}</p>
            </div>
            <div>
              <span className="text-gray-600">Contract Value:</span>
              <p className="font-semibold text-gray-900">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(quotation.estimatedTotal)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Package:</span>
              <p className="font-semibold text-gray-900 capitalize">{quotation.selectedPackage}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Basic information about the construction project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="project-name">
                Project Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
              <p className="text-xs text-gray-500">
                Auto-suggested: {quotation.clientName} - {quotation.location}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-type">
                Project Type <span className="text-red-600">*</span>
              </Label>
              <Select value={projectType} onValueChange={(value) => setProjectType(value as BuildingType)}>
                <SelectTrigger id="project-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BUILDING_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Inherited from quotation</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">
                Planned Start Date <span className="text-red-600">*</span>
              </Label>
              <div className="relative">
                <CalendarBlank className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="completion-date">Expected Completion</Label>
              <div className="relative">
                <CalendarBlank className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  id="completion-date"
                  type="date"
                  value={expectedCompletion}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500">
                Auto-calculated from stages (~{stages.reduce((sum, s) => sum + s.estimatedDays, 0)} days)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isApartment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Buildings size={24} />
              Apartment Configuration
            </CardTitle>
            <CardDescription>Define blocks and units for the apartment project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="num-blocks">
                Number of Blocks <span className="text-red-600">*</span>
              </Label>
              <Input
                id="num-blocks"
                type="number"
                min="1"
                max="8"
                value={numBlocks}
                onChange={(e) => setNumBlocks(Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))}
                className="w-32"
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Block Configuration</h3>
              {blocks.map((block, index) => (
                <div key={block.blockId} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Block Name</Label>
                      <Input value={block.name} disabled className="bg-gray-50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Units <span className="text-red-600">*</span></Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={block.units.length}
                        onChange={(e) => handleBlockUnitsChange(index, parseInt(e.target.value) || 0)}
                        placeholder="Enter number of units"
                      />
                    </div>
                  </div>

                  {block.units.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Unit Preview:</Label>
                      <div className="flex flex-wrap gap-2">
                        {block.units.slice(0, 10).map((unit) => (
                          <Badge key={unit.unitId} variant="outline" className="font-mono">
                            {unit.name}
                          </Badge>
                        ))}
                        {block.units.length > 10 && (
                          <Badge variant="secondary">+{block.units.length - 10} more</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm">Stage Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700">
                  Choose which stages are shared across all units vs tracked per unit:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stages.slice(0, 8).map((stage, index) => (
                    <div key={stage.stageId} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm font-medium">{stage.name}</span>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`stage-${index}`} className="text-xs text-gray-600">
                          {stage.isShared ? 'Shared' : 'Per Unit'}
                        </Label>
                        <Switch
                          id={`stage-${index}`}
                          checked={stage.isShared}
                          onCheckedChange={() => handleStageSharedToggle(index)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 italic">
                  Shared stages: Foundation, Structure. Individual: Flooring, Painting, Electrical.
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {isIndividualHome && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="py-4">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> For Individual Home projects, the system defaults to 1 Block ("Main") with 1 Unit ("Unit 1").
              These are configured automatically for data consistency.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Project Status</CardTitle>
          <CardDescription>Initial project status and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Initial Status</Label>
            <div className="flex items-center gap-3">
              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Pre-Construction</Badge>
              <span className="text-sm text-gray-500">
                Status will update as project progresses through stages
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isCreating}>
          Cancel
        </Button>
        <Button onClick={handleCreateProject} className="bg-red-600 hover:bg-red-700" disabled={isCreating}>
          {isCreating ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating Project...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2" weight="bold" />
              Create Project
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
