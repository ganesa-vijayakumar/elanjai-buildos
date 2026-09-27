import { useState, useEffect } from 'react'
// UI Components
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { ArrowLeft, WarningCircle, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Quotation } from '../lib/types'

export interface ConstructionStageConfig {
  stageId: number
  name: string
  costPercentage: number
  amount: number
  estimatedDays: number
  paymentMilestone: 'on_completion' | 'on_handover'
}

export interface StagesConfiguration {
  stages: ConstructionStageConfig[]
  advancePercentage: number
  retentionPercentage: number
  totalDays: number
  projectCost: number
}

const DEFAULT_STAGES: Omit<ConstructionStageConfig, 'amount'>[] = [
  { stageId: 1, name: 'Foundation / Excavation', costPercentage: 8, estimatedDays: 15, paymentMilestone: 'on_completion' },
  { stageId: 2, name: 'Plinth Beam / PCC', costPercentage: 5, estimatedDays: 10, paymentMilestone: 'on_completion' },
  { stageId: 3, name: 'Basement / Sump', costPercentage: 5, estimatedDays: 7, paymentMilestone: 'on_completion' },
  { stageId: 4, name: 'Ground Floor Columns', costPercentage: 7, estimatedDays: 10, paymentMilestone: 'on_completion' },
  { stageId: 5, name: 'Ground Floor Slab', costPercentage: 10, estimatedDays: 12, paymentMilestone: 'on_completion' },
  { stageId: 6, name: 'First Floor Columns', costPercentage: 7, estimatedDays: 10, paymentMilestone: 'on_completion' },
  { stageId: 7, name: 'First Floor Slab', costPercentage: 10, estimatedDays: 12, paymentMilestone: 'on_completion' },
  { stageId: 8, name: 'Roof Slab / Terrace', costPercentage: 8, estimatedDays: 12, paymentMilestone: 'on_completion' },
  { stageId: 9, name: 'Brickwork / Blockwork', costPercentage: 8, estimatedDays: 20, paymentMilestone: 'on_completion' },
  { stageId: 10, name: 'Plastering', costPercentage: 7, estimatedDays: 15, paymentMilestone: 'on_completion' },
  { stageId: 11, name: 'Flooring / Tiling', costPercentage: 7, estimatedDays: 15, paymentMilestone: 'on_completion' },
  { stageId: 12, name: 'Electrical & Plumbing', costPercentage: 6, estimatedDays: 12, paymentMilestone: 'on_completion' },
  { stageId: 13, name: 'Doors & Windows', costPercentage: 5, estimatedDays: 10, paymentMilestone: 'on_completion' },
  { stageId: 14, name: 'Painting', costPercentage: 5, estimatedDays: 12, paymentMilestone: 'on_completion' },
  { stageId: 15, name: 'Final Finishing / Handover', costPercentage: 2, estimatedDays: 7, paymentMilestone: 'on_handover' },
]

interface Props {
  projectCost?: number
  quotation?: Quotation | null
  onBack?: () => void
  onProceed?: (config: StagesConfiguration) => void
}


export function ConstructionStagesConfig({ projectCost: propProjectCost, quotation, onBack, onProceed }: Props) {
  // Determine project cost from quotation or prop
  const projectCost = quotation?.estimatedTotal || propProjectCost || 3600000

  const [stages, setStages] = useState<ConstructionStageConfig[]>([])
  const [advancePercentage, setAdvancePercentage] = useState(10)
  const [retentionPercentage, setRetentionPercentage] = useState(5)

  // Load building-specific stage template when quotation changes
  useEffect(() => {
    if (quotation) {
      // Fetch building-specific stage template
      const stageKey = `stage-template-${quotation.buildingType}`
      const buildingStageTemplate = localStorage.getItem(`kv:${stageKey}`)
      let stageTemplate = DEFAULT_STAGES

      if (buildingStageTemplate) {
        try {
          const parsed = JSON.parse(buildingStageTemplate)
          // Map to include stageId and paymentMilestone
          stageTemplate = parsed.map((stage: any, index: number) => ({
            stageId: index + 1,
            name: stage.name,
            costPercentage: stage.percentage,
            estimatedDays: stage.estimatedDays || Math.ceil(stage.percentage * 1.5) + 5,
            paymentMilestone: index === parsed.length - 1 ? 'on_handover' : 'on_completion',
          }))
        } catch {
          stageTemplate = DEFAULT_STAGES
        }
      }

      setStages(stageTemplate.map(stage => ({
        ...stage,
        amount: Math.round((stage.costPercentage / 100) * projectCost),
      })))
    } else {
      // Default stages
      setStages(DEFAULT_STAGES.map(stage => ({
        ...stage,
        amount: Math.round((stage.costPercentage / 100) * projectCost),
      })))
    }
  }, [quotation, projectCost])

  const totalPercentage = stages.reduce((sum, stage) => sum + stage.costPercentage, 0)
  const totalDays = stages.reduce((sum, stage) => sum + stage.estimatedDays, 0)
  const totalAmount = stages.reduce((sum, stage) => sum + stage.amount, 0)

  const handleStageUpdate = (stageId: number, field: keyof ConstructionStageConfig, value: string | number) => {
    setStages(prev => prev.map(stage => {
      if (stage.stageId === stageId) {
        const updated = { ...stage, [field]: value }
        if (field === 'costPercentage') {
          updated.amount = Math.round((Number(value) / 100) * projectCost)
        }
        return updated
      }
      return stage
    }))
  }

  const handleResetDefaults = () => {
    setStages(DEFAULT_STAGES.map(stage => ({
      ...stage,
      amount: Math.round((stage.costPercentage / 100) * projectCost),
    })))
    setAdvancePercentage(10)
    setRetentionPercentage(5)
    toast.success('Reset to default configuration')
  }

  const handleProceed = () => {
    if (totalPercentage !== 100) {
      toast.error(`Total percentage is ${totalPercentage}%. Must equal 100%.`)
      return
    }

    const config: StagesConfiguration = {
      stages,
      advancePercentage,
      retentionPercentage,
      totalDays,
      projectCost,
    }

    onProceed?.(config)
    toast.success('Construction stages configured successfully')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft />
            Back
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Construction Stages & Payment Schedule</h1>
          {quotation ? (
            <p className="text-muted-foreground mt-1">
              For Quotation {quotation.quotationNumber} - {quotation.clientName} ({quotation.buildingType.replace('_', ' ')})
            </p>
          ) : (
            <p className="text-muted-foreground mt-1">Define the 15 construction stages with cost percentages and payment milestones</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Stage Configuration</h2>
              <div className="flex items-center gap-2">
                {totalPercentage === 100 ? (
                  <Badge variant="default" className="gap-1 bg-accent text-accent-foreground">
                    <CheckCircle weight="fill" />
                    Valid (100%)
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <WarningCircle weight="fill" />
                    {totalPercentage}% (Must be 100%)
                  </Badge>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium w-12">#</th>
                    <th className="pb-3 font-medium">Stage Name</th>
                    <th className="pb-3 font-medium w-24 text-right">% of Cost</th>
                    <th className="pb-3 font-medium w-32 text-right">Amount (₹)</th>
                    <th className="pb-3 font-medium w-24 text-right">Est. Days</th>
                    <th className="pb-3 font-medium w-32">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stages.map((stage) => (
                    <tr key={stage.stageId} className="text-sm">
                      <td className="py-3 text-muted-foreground">{stage.stageId}</td>
                      <td className="py-3">
                        <Input
                          value={stage.name}
                          onChange={(e) => handleStageUpdate(stage.stageId, 'name', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="py-3 text-right">
                        <Input
                          type="number"
                          value={stage.costPercentage}
                          onChange={(e) => handleStageUpdate(stage.stageId, 'costPercentage', Number(e.target.value))}
                          className="h-8 text-sm text-right w-20 ml-auto"
                          min="0"
                          max="100"
                          step="0.5"
                        />
                      </td>
                      <td className="py-3 text-right font-mono text-muted-foreground">
                        {formatCurrency(stage.amount)}
                      </td>
                      <td className="py-3 text-right">
                        <Input
                          type="number"
                          value={stage.estimatedDays}
                          onChange={(e) => handleStageUpdate(stage.stageId, 'estimatedDays', Number(e.target.value))}
                          className="h-8 text-sm text-right w-20 ml-auto"
                          min="1"
                        />
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-xs">
                          {stage.paymentMilestone === 'on_completion' ? 'On completion' : 'On handover'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-t-2 font-semibold">
                  <tr className="text-sm">
                    <td className="pt-3" colSpan={2}>Total</td>
                    <td className="pt-3 text-right">{totalPercentage}%</td>
                    <td className="pt-3 text-right font-mono">{formatCurrency(totalAmount)}</td>
                    <td className="pt-3 text-right">~{totalDays} days</td>
                    <td className="pt-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Payment Terms</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="advance" className="text-sm">Advance Payment (%)</Label>
                <p className="text-xs text-muted-foreground mb-2">Payment due upon agreement signing</p>
                <Input
                  id="advance"
                  type="number"
                  value={advancePercentage}
                  onChange={(e) => setAdvancePercentage(Number(e.target.value))}
                  min="0"
                  max="50"
                  step="5"
                />
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  = {formatCurrency((advancePercentage / 100) * projectCost)}
                </p>
              </div>

              <div>
                <Label htmlFor="retention" className="text-sm">Retention (%)</Label>
                <p className="text-xs text-muted-foreground mb-2">Amount held until final handover</p>
                <Input
                  id="retention"
                  type="number"
                  value={retentionPercentage}
                  onChange={(e) => setRetentionPercentage(Number(e.target.value))}
                  min="0"
                  max="20"
                  step="5"
                />
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  = {formatCurrency((retentionPercentage / 100) * projectCost)}
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-1">Payment Structure</div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div>• Advance: {advancePercentage}% on signing</div>
                  <div>• Stage Payments: On completion of each stage</div>
                  <div>• Retention: {retentionPercentage}% on handover</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Timeline Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Project Duration</span>
                <span className="font-semibold">{totalDays} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Months</span>
                <span className="font-semibold">{Math.ceil(totalDays / 30)} months</span>
              </div>
              <Progress value={(totalDays / 365) * 100} className="h-2" />
              <div className="text-xs text-muted-foreground text-center">
                ~{((totalDays / 365) * 100).toFixed(1)}% of a year
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={handleProceed}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={totalPercentage !== 100}
            >
              Proceed to Agreement Generation
            </Button>
            <Button
              onClick={handleResetDefaults}
              variant="outline"
              className="w-full"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-4">Visual Timeline (Gantt View)</h3>
        <div className="space-y-2">
          {stages.map((stage, index) => {
            const startDay = stages.slice(0, index).reduce((sum, s) => sum + s.estimatedDays, 0)
            const widthPercent = (stage.estimatedDays / totalDays) * 100
            const leftPercent = (startDay / totalDays) * 100

            return (
              <div key={stage.stageId} className="flex items-center gap-4">
                <div className="w-48 text-sm text-muted-foreground truncate" title={stage.name}>
                  {stage.stageId}. {stage.name}
                </div>
                <div className="flex-1 relative h-8 bg-background rounded">
                  <div
                    className="absolute h-full bg-primary rounded flex items-center justify-center text-xs text-primary-foreground font-medium"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                  >
                    {stage.estimatedDays}d
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Day 0</span>
          <span>Day {totalDays} (End)</span>
        </div>
      </Card>
    </div>
  )
}
