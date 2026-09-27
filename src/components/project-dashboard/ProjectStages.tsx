import { useState } from 'react'
import { Project, ConstructionStage, StageStatus, StageCompletion } from '../../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { 
  Play,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  StickyNote,
  IndianRupee,
  Calendar,
  Image
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ProjectStagesProps {
  project: Project
  onProjectUpdate: (project: Project) => void
}

export function ProjectStages({ project, onProjectUpdate }: ProjectStagesProps) {
  const [selectedStage, setSelectedStage] = useState<ConstructionStage | null>(null)
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [completionForm, setCompletionForm] = useState<StageCompletion>({
    actualStartDate: '',
    actualEndDate: '',
    actualCost: 0,
    notes: '',
    photos: [],
  })

  const getStatusConfig = (status: StageStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          icon: CheckCircle2,
        }
      case 'in-progress':
        return {
          label: 'In Progress',
          color: 'bg-amber-500',
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50',
          icon: Clock,
        }
      case 'delayed':
        return {
          label: 'Delayed',
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          icon: AlertTriangle,
        }
      default:
        return {
          label: 'Not Started',
          color: 'bg-gray-400',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          icon: Circle,
        }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleStartStage = (stage: ConstructionStage) => {
    const updatedStages = project.stages.map(s =>
      s.id === stage.id
        ? {
            ...s,
            status: 'in-progress' as StageStatus,
            actualStartDate: new Date().toISOString(),
            progress: 0,
          }
        : s
    )

    const updatedProject = {
      ...project,
      stages: updatedStages,
      currentStage: stage.name,
    }

    onProjectUpdate(updatedProject)
    toast.success(`${stage.name} started`)
  }

  const handleOpenCompletionForm = (stage: ConstructionStage) => {
    setSelectedStage(stage)
    setCompletionForm({
      actualStartDate: stage.actualStartDate || new Date().toISOString().split('T')[0],
      actualEndDate: new Date().toISOString().split('T')[0],
      actualCost: stage.actualSpent || stage.budgetAmount,
      notes: '',
      photos: [],
    })
    setCompletionDialogOpen(true)
  }

  const handleCompleteStage = () => {
    if (!selectedStage) return

    const completion: StageCompletion = {
      ...completionForm,
      completedBy: 'Site Manager',
      completedAt: new Date().toISOString(),
    }

    const updatedStages = project.stages.map(s =>
      s.id === selectedStage.id
        ? {
            ...s,
            status: 'completed' as StageStatus,
            actualEndDate: completionForm.actualEndDate,
            actualCost: completionForm.actualCost,
            completion,
            progress: 100,
          }
        : s
    )

    const completedCount = updatedStages.filter(s => s.status === 'completed').length
    const completionPercentage = (completedCount / updatedStages.length) * 100

    const nextStageInProgress = updatedStages.find(s => s.status === 'in-progress')
    const nextStage = nextStageInProgress || updatedStages.find(s => s.status === 'not-started' || s.status === 'pending')

    const updatedProject = {
      ...project,
      stages: updatedStages,
      completionPercentage,
      currentStage: nextStage?.name || selectedStage.name,
      currentStageIndex: nextStage ? updatedStages.findIndex(s => s.id === nextStage.id) : project.currentStageIndex,
    }

    onProjectUpdate(updatedProject)
    setCompletionDialogOpen(false)
    toast.success(`${selectedStage.name} marked as complete`)
  }

  const handleAddNotes = (stage: ConstructionStage) => {
    setSelectedStage(stage)
    setNotesDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Construction Stages</h2>
        <div className="text-sm text-gray-600">
          {project.stages.filter(s => s.status === 'completed').length} of {project.stages.length} completed
        </div>
      </div>

      <div className="space-y-3">
        {project.stages.map((stage, index) => {
          const statusConfig = getStatusConfig(stage.status)
          const StatusIcon = statusConfig.icon

          return (
            <Card key={stage.id} className={`${statusConfig.bgColor} border-l-4 ${statusConfig.color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-full ${statusConfig.color} text-white flex-shrink-0`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {index + 1}. {stage.name}
                        </h3>
                        <Badge variant="outline" className={statusConfig.textColor}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Budget: {formatCurrency(stage.budgetAmount)} • {stage.percentage}% of total
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {(stage.status === 'not-started' || stage.status === 'pending') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartStage(stage)}
                        className="whitespace-nowrap"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start Stage
                      </Button>
                    )}
                    {stage.status === 'in-progress' && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenCompletionForm(stage)}
                        className="bg-red-600 hover:bg-red-700 whitespace-nowrap"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddNotes(stage)}
                    >
                      <StickyNote className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {stage.status === 'in-progress' && stage.progress !== undefined && (
                  <div className="space-y-1">
                    <Progress value={stage.progress} className="h-2" />
                    <p className="text-xs text-gray-600">{stage.progress}% complete</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Planned Start
                    </div>
                    <div className="font-medium text-gray-900">
                      {stage.plannedStartDate
                        ? format(new Date(stage.plannedStartDate), 'dd MMM yyyy')
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Planned End
                    </div>
                    <div className="font-medium text-gray-900">
                      {stage.plannedEndDate
                        ? format(new Date(stage.plannedEndDate), 'dd MMM yyyy')
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Actual Start
                    </div>
                    <div className="font-medium text-gray-900">
                      {stage.actualStartDate
                        ? format(new Date(stage.actualStartDate), 'dd MMM yyyy')
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Actual End
                    </div>
                    <div className="font-medium text-gray-900">
                      {stage.actualEndDate
                        ? format(new Date(stage.actualEndDate), 'dd MMM yyyy')
                        : '-'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-2 border-t">
                  <div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      Budgeted Cost
                    </div>
                    <div className="font-medium text-gray-900">
                      {formatCurrency(stage.budgetAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      Actual Cost
                    </div>
                    <div className={`font-medium ${
                      (stage.actualCost || stage.actualSpent) > stage.budgetAmount
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {formatCurrency(stage.actualCost || stage.actualSpent || 0)}
                    </div>
                  </div>
                </div>

                {stage.completion?.notes && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-600 mb-1">Completion Notes:</div>
                    <p className="text-sm text-gray-900">{stage.completion.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Stage: {selectedStage?.name}</DialogTitle>
            <DialogDescription>
              Fill in the actual completion details for this stage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actualStartDate">Actual Start Date</Label>
                <Input
                  id="actualStartDate"
                  type="date"
                  value={completionForm.actualStartDate?.split('T')[0] || ''}
                  onChange={(e) =>
                    setCompletionForm({ ...completionForm, actualStartDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualEndDate">Actual End Date</Label>
                <Input
                  id="actualEndDate"
                  type="date"
                  value={completionForm.actualEndDate?.split('T')[0] || ''}
                  onChange={(e) =>
                    setCompletionForm({ ...completionForm, actualEndDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualCost">Actual Cost (₹)</Label>
              <Input
                id="actualCost"
                type="number"
                value={completionForm.actualCost || ''}
                onChange={(e) =>
                  setCompletionForm({ ...completionForm, actualCost: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Remarks</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this stage completion..."
                value={completionForm.notes || ''}
                onChange={(e) =>
                  setCompletionForm({ ...completionForm, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteStage} className="bg-red-600 hover:bg-red-700">
              Mark as Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stage Notes: {selectedStage?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add notes about this stage..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success('Notes added')
                setNotesDialogOpen(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
