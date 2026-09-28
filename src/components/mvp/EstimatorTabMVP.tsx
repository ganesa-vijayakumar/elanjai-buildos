import { useState } from 'react'
import { useEstimatorHistory } from '../../hooks/useEstimator'
import { CalculatorForm } from '../CalculatorForm'
import { CalculationHistory } from '../CalculationHistory'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import { TaskType, Dimensions, CalculationResults, MaterialCalculation } from '../../lib/types'

export function EstimatorTabMVP({ siteId }: { siteId: string }) {
    const { history, save } = useEstimatorHistory(siteId)
    const [results, setResults] = useState<CalculationResults | null>(null)
    const [activeTab, setActiveTab] = useState('calculator')

    const handleCalculate = async (taskType: TaskType, dimensions: Dimensions, res: CalculationResults) => {
        setResults(res)
        const { error } = await save(taskType, dimensions as Record<string, unknown>, res as unknown as Record<string, unknown>)
        if (error) toast.error('Calculated, but failed to save history')
        else toast.success('Calculation saved')
    }

    // map backend rows into the legacy MaterialCalculation shape for CalculationHistory
    const mapped: MaterialCalculation[] = history.map(h => {
        let dims: Dimensions = {}, res: CalculationResults = { cement: 0, sand: 0 }
        try { dims = JSON.parse(h.dimensions) } catch { /* bad json */ }
        try { res = JSON.parse(h.results) } catch { /* bad json */ }
        return {
            id: h.id,
            projectId: siteId,
            taskType: h.taskType as TaskType,
            dimensions: dims,
            results: res,
            calculatedBy: h.calculatedBy?.fullName || 'User',
            calculatedAt: h.calculatedAt || '',
        }
    })

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
                <TabsTrigger value="calculator">Calculator</TabsTrigger>
                <TabsTrigger value="history">History ({history.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="calculator">
                <div className="grid md:grid-cols-2 gap-6">
                    <CalculatorForm onCalculate={handleCalculate} />
                    <Card>
                        <CardHeader><CardTitle className="text-base">Results</CardTitle></CardHeader>
                        <CardContent>
                            {results ? (
                                <div className="space-y-2 text-sm">
                                    {Object.entries(results).map(([k, v]) => (
                                        <div key={k} className="flex justify-between border-b pb-1">
                                            <span className="capitalize text-gray-600">{k.replace(/_/g, ' ')}</span>
                                            <span className="font-medium">{typeof v === 'number' ? v.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : String(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">Enter dimensions and calculate to see material requirements.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            <TabsContent value="history">
                <CalculationHistory calculations={mapped} />
            </TabsContent>
        </Tabs>
    )
}
