import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calculator } from '@phosphor-icons/react'
import { TaskType, Dimensions, CalculationResults } from '@/lib/types'
import { TASK_OPTIONS, getRequiredFields, getFieldLabel, calculateMaterials } from '@/lib/calculations'

interface CalculatorFormProps {
  onCalculate: (taskType: TaskType, dimensions: Dimensions, results: CalculationResults) => void
}

export function CalculatorForm({ onCalculate }: CalculatorFormProps) {
  const [taskType, setTaskType] = useState<TaskType>('brickwork-9')
  const [dimensions, setDimensions] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const requiredFields = getRequiredFields(taskType)

  const handleInputChange = (field: string, value: string) => {
    setDimensions((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    requiredFields.forEach((field) => {
      const value = parseFloat(dimensions[field] || '')
      if (!dimensions[field] || isNaN(value) || value <= 0) {
        newErrors[field] = 'Please enter a value greater than 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCalculate = () => {
    if (!validateForm()) return

    const parsedDimensions: Dimensions = {}
    requiredFields.forEach((field) => {
      parsedDimensions[field as keyof Dimensions] = parseFloat(dimensions[field])
    })

    const results = calculateMaterials(taskType, parsedDimensions)
    onCalculate(taskType, parsedDimensions, results)
  }

  const handleTaskTypeChange = (value: string) => {
    setTaskType(value as TaskType)
    setDimensions({})
    setErrors({})
  }

  return (
    <Card className="p-6 shadow-md">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Calculate Materials</h2>
          <p className="text-sm text-muted-foreground">
            Enter dimensions to estimate material requirements
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-type" className="text-base font-semibold">
              Task Type
            </Label>
            <Select value={taskType} onValueChange={handleTaskTypeChange}>
              <SelectTrigger id="task-type" className="h-12 text-base w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-2rem)]">
                {TASK_OPTIONS.reduce((acc, option) => {
                  const lastCategory = acc[acc.length - 1]?.category
                  if (lastCategory !== option.category) {
                    acc.push({
                      category: option.category,
                      items: [option],
                    })
                  } else {
                    acc[acc.length - 1].items.push(option)
                  }
                  return acc
                }, [] as { category: string; items: typeof TASK_OPTIONS }[]).map((group) => (
                  <SelectGroup key={group.category}>
                    <SelectLabel>{group.category}</SelectLabel>
                    {group.items.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="truncate"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiredFields.map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field} className="text-base font-semibold break-words">
                {getFieldLabel(field)}
              </Label>
              <Input
                id={field}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={dimensions[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className={`h-12 text-base ${errors[field] ? 'border-destructive' : ''}`}
                placeholder="0"
              />
              {errors[field] && (
                <p className="text-sm text-destructive break-words">{errors[field]}</p>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={handleCalculate}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          <Calculator className="mr-2" size={20} weight="bold" />
          Calculate Materials
        </Button>
      </div>
    </Card>
  )
}
