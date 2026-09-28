import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ClockCounterClockwise } from '@phosphor-icons/react'
import { MaterialCalculation } from '@/lib/types'
import { TASK_OPTIONS } from '@/lib/calculations'
import { format } from 'date-fns'

interface CalculationHistoryProps {
  calculations: MaterialCalculation[]
}

export function CalculationHistory({ calculations }: CalculationHistoryProps) {
  const getTaskLabel = (taskType: string) => {
    const task = TASK_OPTIONS.find((t) => t.value === taskType)
    return task ? `${task.category} - ${task.label}` : taskType
  }

  const getAreaOrVolume = (calc: MaterialCalculation) => {
    if (calc.dimensions.area) {
      return `${calc.dimensions.area.toFixed(0)} sq.ft`
    }
    if (calc.dimensions.length && calc.dimensions.width && calc.dimensions.depth) {
      const volume =
        calc.dimensions.length * calc.dimensions.width * (calc.dimensions.depth / 12)
      return `${volume.toFixed(2)} cu.ft`
    }
    if (calc.dimensions.length && calc.dimensions.height) {
      const area = calc.dimensions.length * calc.dimensions.height
      return `${area.toFixed(0)} sq.ft`
    }
    if (calc.dimensions.length && calc.dimensions.width) {
      const area = calc.dimensions.length * calc.dimensions.width
      return `${area.toFixed(0)} sq.ft`
    }
    return '-'
  }

  const getPrimaryMaterial = (calc: MaterialCalculation) => {
    if (calc.results.bricks) {
      return `${calc.results.bricks.toLocaleString()} bricks`
    }
    if (calc.results.tiles) {
      return `${calc.results.tiles.toLocaleString()} tiles`
    }
    if (calc.results.aggregate) {
      return `${calc.results.cement.toFixed(1)} bags cement`
    }
    return `${calc.results.cement.toFixed(1)} bags cement`
  }

  if (calculations.length === 0) {
    return (
      <Card className="p-12 shadow-md">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ClockCounterClockwise size={32} weight="duotone" className="text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">No calculations yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your calculation history will appear here. Start by calculating material
              requirements in the Calculator tab.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="shadow-md overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Task Type</TableHead>
              <TableHead className="font-bold">Area/Volume</TableHead>
              <TableHead className="font-bold">Primary Material</TableHead>
              <TableHead className="font-bold text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculations.map((calc) => (
              <TableRow key={calc.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">
                  {format(new Date(calc.calculatedAt), 'MMM d, yyyy')}
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(calc.calculatedAt), 'h:mm a')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{getTaskLabel(calc.taskType)}</div>
                </TableCell>
                <TableCell>
                  <div className="font-mono font-semibold tabular-nums whitespace-nowrap">
                    {getAreaOrVolume(calc)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{getPrimaryMaterial(calc)}</div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="font-medium">
                    Completed
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden divide-y">
        {calculations.map((calc) => (
          <div key={calc.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{getTaskLabel(calc.taskType)}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {format(new Date(calc.calculatedAt), 'MMM d, yyyy • h:mm a')}
                </div>
              </div>
              <Badge variant="outline" className="font-medium flex-shrink-0">
                Completed
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="min-w-0">
                <div className="text-muted-foreground text-xs">Area/Volume</div>
                <div className="font-mono font-semibold tabular-nums mt-1 break-words">
                  {getAreaOrVolume(calc)}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-muted-foreground text-xs">Primary Material</div>
                <div className="font-medium mt-1 break-words">{getPrimaryMaterial(calc)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
