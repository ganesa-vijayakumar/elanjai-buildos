import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ConstructionStage, ExpenseEntry } from '@/lib/types';
import { 
  Receipt, 
  Hammer, 
  Package, 
  Truck, 
  Wrench,
  DotsThree,
  Warning,
  CheckCircle,
  TrendUp
} from '@phosphor-icons/react';
import { format } from 'date-fns';

interface StageExpenseViewProps {
  stage: ConstructionStage;
  onAddExpense?: () => void;
  showAddButton?: boolean;
}

const getCategoryIcon = (category: ExpenseEntry['category']) => {
  switch (category) {
    case 'labor':
      return <Hammer size={16} weight="fill" />;
    case 'material':
      return <Package size={16} weight="fill" />;
    case 'equipment':
      return <Wrench size={16} weight="fill" />;
    case 'transport':
      return <Truck size={16} weight="fill" />;
    default:
      return <DotsThree size={16} weight="fill" />;
  }
};

const getCategoryColor = (category: ExpenseEntry['category']) => {
  switch (category) {
    case 'labor':
      return 'bg-blue-100 text-blue-700';
    case 'material':
      return 'bg-purple-100 text-purple-700';
    case 'equipment':
      return 'bg-orange-100 text-orange-700';
    case 'transport':
      return 'bg-cyan-100 text-cyan-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export function StageExpenseView({ stage, onAddExpense, showAddButton = false }: StageExpenseViewProps) {
  const budgetUsagePercent = stage.budgetAmount > 0 
    ? (stage.actualSpent / stage.budgetAmount) * 100 
    : 0;
  const isOverBudget = budgetUsagePercent > 100;
  const isNearBudget = budgetUsagePercent > 85 && budgetUsagePercent <= 100;
  const remaining = stage.budgetAmount - stage.actualSpent;

  const expensesByCategory = (stage.expenses || []).reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {} as Record<string, ExpenseEntry[]>);

  const categoryTotals = Object.entries(expensesByCategory).map(([category, expenses]) => ({
    category: category as ExpenseEntry['category'],
    total: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    count: expenses.length,
  })).sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Receipt size={24} weight="fill" className="text-red-600" />
              {stage.name} - Expense Tracking
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Budget: ₹{stage.budgetAmount.toLocaleString()} • 
              Spent: ₹{stage.actualSpent.toLocaleString()}
            </p>
          </div>
          {showAddButton && onAddExpense && (
            <Button
              onClick={onAddExpense}
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              Add Expense
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Budget Usage</span>
            <span className={`font-bold ${
              isOverBudget ? 'text-rose-600' : isNearBudget ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {budgetUsagePercent.toFixed(1)}%
            </span>
          </div>
          
          <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isOverBudget ? 'bg-rose-600' : isNearBudget ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className={`font-semibold ${remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {remaining >= 0 ? 'Remaining' : 'Over Budget'}
              </p>
              <p className="text-gray-600">
                ₹{Math.abs(remaining).toLocaleString()}
              </p>
            </div>
            {!isOverBudget && !isNearBudget && (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1">
                <CheckCircle size={14} weight="fill" />
                On Track
              </Badge>
            )}
            {isNearBudget && (
              <Badge className="bg-amber-500 hover:bg-amber-600 flex items-center gap-1">
                <Warning size={14} weight="fill" />
                Near Limit
              </Badge>
            )}
            {isOverBudget && (
              <Badge className="bg-rose-600 hover:bg-rose-700 flex items-center gap-1">
                <Warning size={14} weight="fill" />
                Over Budget
              </Badge>
            )}
          </div>
        </div>

        {stage.budgetAlerts && stage.budgetAlerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Warning size={24} weight="fill" className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 mb-2">Budget Alerts</p>
                {stage.budgetAlerts.map(alert => (
                  <p key={alert.id} className="text-sm text-amber-800">
                    {alert.message}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {categoryTotals.length > 0 && (
          <>
            <Separator />
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendUp size={18} weight="bold" />
                Expense Breakdown by Category
              </h4>
              <div className="space-y-2">
                {categoryTotals.map(({ category, total, count }) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getCategoryColor(category)} flex items-center gap-1`}>
                        {getCategoryIcon(category)}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-600">({count} expense{count !== 1 ? 's' : ''})</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {stage.expenses && stage.expenses.length > 0 ? (
          <>
            <Separator />
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recent Expenses</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...stage.expenses].reverse().slice(0, 10).map((expense) => (
                  <div
                    key={expense.id}
                    className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${getCategoryColor(expense.category)} flex items-center gap-1`}>
                            {getCategoryIcon(expense.category)}
                            {expense.category}
                          </Badge>
                        </div>
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(expense.date), 'dd MMM yyyy')} • 
                          Recorded by {expense.recordedBy}
                        </p>
                        {expense.notes && (
                          <p className="text-xs text-gray-600 mt-1 italic">{expense.notes}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900">₹{expense.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {stage.expenses.length > 10 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Showing 10 of {stage.expenses.length} expenses
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Receipt size={48} weight="light" className="mx-auto mb-3 text-gray-400" />
            <p>No expenses recorded for this stage yet</p>
            {showAddButton && (
              <p className="text-sm mt-1">Click "Add Expense" to record the first expense</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
