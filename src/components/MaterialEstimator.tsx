import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Calculator, ClockCounterClockwise } from '@phosphor-icons/react'
import { CalculatorForm } from './CalculatorForm'
import { ResultsDisplay } from './ResultsDisplay'
import { CalculationHistory } from './CalculationHistory'
import { TaskType, Dimensions, CalculationResults, MaterialCalculation, UserRole } from '@/lib/types'

interface MaterialEstimatorProps {
  currentRole: UserRole
}

export function MaterialEstimator({ currentRole }: MaterialEstimatorProps) {
  const [calculations, setCalculations] = useKV<MaterialCalculation[]>('material-calculations', [])
  const [currentResults, setCurrentResults] = useState<CalculationResults | null>(null)
  const [activeTab, setActiveTab] = useState('calculator')

  const handleCalculate = (
    taskType: TaskType,
    dimensions: Dimensions,
    results: CalculationResults
  ) => {
    const roleMap: Record<UserRole, string> = {
      'admin': 'Admin',
      'owner': 'Owner',
      'site-manager': 'Site Manager',
      'client': 'Client'
    }

    const newCalculation: MaterialCalculation = {
      id: `calc-${Date.now()}`,
      taskType,
      dimensions,
      results,
      calculatedBy: roleMap[currentRole],
      calculatedAt: new Date().toISOString(),
    }

    setCalculations((current) => [newCalculation, ...(current || [])])
    setCurrentResults(results)

    toast.success('Calculation complete', {
      description: 'Material requirements have been calculated and saved to history.',
    })
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calculator size={28} weight="bold" className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Material Quantity Estimator
            </h1>
            <p className="text-gray-600 mt-1">
              Calculate construction material requirements on-site
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12">
          <TabsTrigger value="calculator" className="text-base font-semibold">
            <Calculator size={20} weight="bold" className="mr-2" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="history" className="text-base font-semibold">
            <ClockCounterClockwise size={20} weight="bold" className="mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div>
              <CalculatorForm onCalculate={handleCalculate} />
            </div>
            
            {currentResults && (
              <div>
                <ResultsDisplay results={currentResults} />
              </div>
            )}
          </div>

          {!currentResults && (
            <div className="lg:col-span-2">
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center bg-white">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Calculator size={32} weight="duotone" className="text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">Ready to calculate</h3>
                    <p className="text-sm text-gray-600 max-w-md mx-auto">
                      Select a task type and enter dimensions to calculate material requirements.
                      Results will appear here.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <CalculationHistory calculations={calculations || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
