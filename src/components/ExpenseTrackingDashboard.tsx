import { useState } from 'react';
import { Project, ConstructionStage } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChartLineUp, 
  Warning, 
  CheckCircle, 
  Receipt,
  TrendUp,
  TrendDown,
  Plus
} from '@phosphor-icons/react';
import { StageExpenseView } from './StageExpenseView';
import { ExpenseDialog } from './ExpenseDialog';

interface ExpenseTrackingDashboardProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

export function ExpenseTrackingDashboard({ project, onUpdate }: ExpenseTrackingDashboardProps) {
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ConstructionStage | undefined>();

  const handleAddExpense = (stage?: ConstructionStage) => {
    setSelectedStage(stage);
    setShowExpenseDialog(true);
  };

  const handleExpenseAdded = (proj: Project, stageId: string, expense: import('@/lib/types').ExpenseEntry) => {
    const updatedStages = proj.stages.map(stage => {
      if (stage.id === stageId) {
        const updatedExpenses = [...(stage.expenses || []), expense];
        const newActualSpent = stage.actualSpent + expense.amount;
        const budgetUsagePercent = (newActualSpent / stage.budgetAmount) * 100;

        const newAlerts = [...(stage.budgetAlerts || [])];
        
        if (budgetUsagePercent >= 100 && !newAlerts.some(a => a.type === 'critical' && !a.acknowledged)) {
          newAlerts.push({
            id: `alert-${Date.now()}-critical`,
            stageId: stage.id,
            stageName: stage.name,
            type: 'critical',
            threshold: 100,
            currentSpend: newActualSpent,
            budgetAmount: stage.budgetAmount,
            message: `Budget exceeded by ₹${(newActualSpent - stage.budgetAmount).toLocaleString()}`,
            createdAt: new Date().toISOString(),
            acknowledged: false,
          });
        } else if (budgetUsagePercent >= 85 && budgetUsagePercent < 100 && !newAlerts.some(a => a.type === 'warning' && !a.acknowledged)) {
          newAlerts.push({
            id: `alert-${Date.now()}-warning`,
            stageId: stage.id,
            stageName: stage.name,
            type: 'warning',
            threshold: 85,
            currentSpend: newActualSpent,
            budgetAmount: stage.budgetAmount,
            message: `Budget usage at ${budgetUsagePercent.toFixed(1)}% - approaching limit`,
            createdAt: new Date().toISOString(),
            acknowledged: false,
          });
        }

        return {
          ...stage,
          actualSpent: newActualSpent,
          expenses: updatedExpenses,
          budgetAlerts: newAlerts,
        };
      }
      return stage;
    });

    const newTotalExpenses = updatedStages.reduce((sum, stage) => sum + stage.actualSpent, 0);

    const updatedProject = {
      ...proj,
      stages: updatedStages,
      totalExpenses: newTotalExpenses,
    };

    onUpdate(updatedProject);
  };

  const stagesWithExpenses = project.stages.filter(s => s.expenses && s.expenses.length > 0);
  const stagesOverBudget = project.stages.filter(s => s.actualSpent > s.budgetAmount);
  const stagesNearBudget = project.stages.filter(s => {
    const percent = (s.actualSpent / s.budgetAmount) * 100;
    return percent >= 85 && percent < 100;
  });
  
  const totalBudgetAlerts = project.stages.reduce((sum, stage) => {
    return sum + (stage.budgetAlerts?.filter(a => !a.acknowledged).length || 0);
  }, 0);

  const allExpenses = project.stages.flatMap(stage => 
    (stage.expenses || []).map(exp => ({ ...exp, stage: stage.name }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt size={32} weight="fill" className="text-red-600" />
            Expense Tracking & Budget Alerts
          </h2>
          <p className="text-gray-600 mt-1">
            Monitor expenses and budget utilization across all construction stages
          </p>
        </div>
        <Button
          onClick={() => handleAddExpense()}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus size={20} weight="bold" className="mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{(project.totalCost / 100000).toFixed(2)}L
                </p>
              </div>
              <ChartLineUp size={32} weight="fill" className="text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-rose-600">
                  ₹{(project.totalExpenses / 100000).toFixed(2)}L
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((project.totalExpenses / project.totalCost) * 100).toFixed(1)}% used
                </p>
              </div>
              <TrendUp size={32} weight="fill" className="text-rose-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className={`text-2xl font-bold ${
                  project.totalCost - project.totalExpenses >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  ₹{(Math.abs(project.totalCost - project.totalExpenses) / 100000).toFixed(2)}L
                </p>
              </div>
              <TrendDown size={32} weight="fill" className="text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Alerts</p>
                <p className="text-2xl font-bold text-amber-600">
                  {totalBudgetAlerts}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stagesOverBudget.length} over budget
                </p>
              </div>
              <Warning size={32} weight="fill" className="text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {totalBudgetAlerts > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Warning size={24} weight="fill" className="text-amber-600" />
              Active Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.stages
                .filter(stage => stage.budgetAlerts && stage.budgetAlerts.some(a => !a.acknowledged))
                .map(stage => (
                  <div key={stage.id} className="bg-white rounded-lg p-4 border border-amber-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={
                            stage.budgetAlerts?.some(a => a.type === 'critical')
                              ? 'bg-rose-600 hover:bg-rose-700'
                              : 'bg-amber-500 hover:bg-amber-600'
                          }>
                            {stage.name}
                          </Badge>
                        </div>
                        {stage.budgetAlerts?.filter(a => !a.acknowledged).map(alert => (
                          <p key={alert.id} className="text-sm text-gray-700">
                            {alert.message}
                          </p>
                        ))}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Current Spend</p>
                        <p className="font-bold text-gray-900">
                          ₹{stage.actualSpent.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          of ₹{stage.budgetAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="by-stage" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="by-stage">By Stage</TabsTrigger>
          <TabsTrigger value="all-expenses">All Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="by-stage" className="space-y-4 mt-6">
          {project.stages.map((stage) => (
            <StageExpenseView
              key={stage.id}
              stage={stage}
              onAddExpense={() => handleAddExpense(stage)}
              showAddButton={true}
            />
          ))}
        </TabsContent>

        <TabsContent value="all-expenses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Receipt size={24} weight="fill" className="text-red-600" />
                  All Expenses ({allExpenses.length})
                </span>
                <span className="text-lg font-bold text-rose-600">
                  ₹{project.totalExpenses.toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allExpenses.length > 0 ? (
                <div className="space-y-2">
                  {allExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {expense.stageName}
                            </Badge>
                            <Badge className="text-xs capitalize">
                              {expense.category}
                            </Badge>
                          </div>
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(expense.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })} • Recorded by {expense.recordedBy}
                          </p>
                          {expense.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">{expense.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-lg">
                            ₹{expense.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Receipt size={48} weight="light" className="mx-auto mb-3 text-gray-400" />
                  <p>No expenses recorded yet</p>
                  <p className="text-sm mt-1">Click "Add Expense" to record the first expense</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ExpenseDialog
        open={showExpenseDialog}
        onOpenChange={setShowExpenseDialog}
        project={project}
        stage={selectedStage}
        onExpenseAdded={handleExpenseAdded}
      />
    </div>
  );
}
