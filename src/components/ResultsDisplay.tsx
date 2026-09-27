import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Cube, Drop, Mountains, Circle, SquaresFour } from '@phosphor-icons/react'
import { CalculationResults } from '@/lib/types'
import { getScaleLevel, getProgressPercentage } from '@/lib/calculations'

interface ResultsDisplayProps {
  results: CalculationResults
}

interface MaterialItem {
  name: string
  value: number
  unit: string
  icon: React.ReactNode
  key: keyof CalculationResults
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  const materials: MaterialItem[] = []

  if (results.bricks !== undefined) {
    materials.push({
      name: 'Bricks',
      value: results.bricks,
      unit: 'pieces',
      icon: <SquaresFour size={24} weight="duotone" className="text-primary" />,
      key: 'bricks',
    })
  }

  materials.push({
    name: 'Cement',
    value: results.cement,
    unit: 'bags (50kg)',
    icon: <Drop size={24} weight="duotone" className="text-primary" />,
    key: 'cement',
  })

  materials.push({
    name: 'Sand',
    value: results.sand,
    unit: results.sand > 1 ? 'cubic ft' : 'cubic ft',
    icon: <Mountains size={24} weight="duotone" className="text-primary" />,
    key: 'sand',
  })

  if (results.aggregate !== undefined) {
    materials.push({
      name: 'Aggregate',
      value: results.aggregate,
      unit: 'm³',
      icon: <Cube size={24} weight="duotone" className="text-primary" />,
      key: 'aggregate',
    })
  }

  if (results.tiles !== undefined) {
    materials.push({
      name: 'Tiles',
      value: results.tiles,
      unit: 'pieces (incl. 10% wastage)',
      icon: <Circle size={24} weight="duotone" className="text-primary" />,
      key: 'tiles',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Card className="p-6 shadow-md">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Material Requirements</h2>
          </div>

          <Separator />

          <div className="space-y-4">
            {materials.map((material, index) => {
              const scaleLevel = getScaleLevel(material.key, material.value)
              const progress = getProgressPercentage(material.key, material.value)

              return (
                <motion.div
                  key={material.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">{material.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-base">{material.name}</p>
                          <Badge
                            variant={
                              scaleLevel === 'large'
                                ? 'destructive'
                                : scaleLevel === 'medium'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-xs"
                          >
                            {scaleLevel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {material.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold font-mono tabular-nums">
                        {material.value.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                  >
                    <Progress
                      value={progress}
                      className={`h-2 ${
                        scaleLevel === 'large'
                          ? '[&>div]:bg-destructive'
                          : scaleLevel === 'medium'
                          ? '[&>div]:bg-primary'
                          : '[&>div]:bg-accent'
                      }`}
                    />
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
