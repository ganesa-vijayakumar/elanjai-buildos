import { useState } from 'react'
import { useSites } from '../../hooks/useSites'
import { useCollections } from '../../hooks/useCollections'
import { useExpenses, EXPENSE_CATEGORY_LABELS } from '../../hooks/useExpenses'
import { useDashboard, formatFullCurrency } from '../../hooks/useDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import {
    FileText,
    Download,
    Buildings,
    TrendUp,
    TrendDown,
    Calendar,
    ChartBar
} from '@phosphor-icons/react'
import { DEFAULT_STAGES, ExpenseCategory } from '../../lib/database.types'

export function ReportsMVP() {
    const { sites } = useSites()
    const { collections } = useCollections()
    const { expenses } = useExpenses()
    const { kpis, monthlyCashFlow } = useDashboard()

    const [selectedMonth, setSelectedMonth] = useState<string>('all')

    // Generate month options
    const getMonthOptions = () => {
        const months: { label: string; value: string }[] = [{ label: 'All Time', value: 'all' }]
        const currentDate = new Date()
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
            months.push({
                label: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
                value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            })
        }
        return months
    }

    // Filter data by month
    const filterByMonth = (date: string) => {
        if (selectedMonth === 'all') return true
        return date.startsWith(selectedMonth)
    }

    const filteredCollections = collections.filter(c => filterByMonth(c.received_date))
    const filteredExpenses = expenses.filter(e => filterByMonth(e.expense_date))

    const totalFilteredCollections = filteredCollections.reduce((sum, c) => sum + Number(c.amount), 0)
    const totalFilteredExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.total_amount), 0)

    // Site-wise collections
    const siteCollections = sites.map(site => {
        const siteCollects = filteredCollections.filter(c => c.site_id === site.id)
        const totalCollected = siteCollects.reduce((sum, c) => sum + Number(c.amount), 0)
        return {
            site,
            totalCollected,
            collections: siteCollects,
        }
    }).sort((a, b) => b.totalCollected - a.totalCollected)

    // Site-wise expenses
    const siteExpenses = sites.map(site => {
        const siteExps = filteredExpenses.filter(e => e.site_id === site.id)
        const totalExpense = siteExps.reduce((sum, e) => sum + Number(e.total_amount), 0)
        return {
            site,
            totalExpense,
            expenses: siteExps,
        }
    }).sort((a, b) => b.totalExpense - a.totalExpense)

    // Category-wise expenses
    const categoryExpenses = Object.keys(EXPENSE_CATEGORY_LABELS).map(category => {
        const catExps = filteredExpenses.filter(e => e.category === category)
        const total = catExps.reduce((sum, e) => sum + Number(e.total_amount), 0)
        return {
            category: category as ExpenseCategory,
            label: EXPENSE_CATEGORY_LABELS[category as ExpenseCategory],
            total,
            count: catExps.length,
        }
    }).sort((a, b) => b.total - a.total)

    // Export functionality
    const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
        if (data.length === 0) return

        const headers = Object.keys(data[0])
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <p className="text-gray-500">View and export financial reports</p>
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[200px]">
                        <Calendar className="w-4 h-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {getMonthOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <TrendUp className="w-8 h-8 text-green-500" weight="duotone" />
                            <div>
                                <p className="text-sm text-gray-500">Collections</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatFullCurrency(totalFilteredCollections)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <TrendDown className="w-8 h-8 text-orange-500" weight="duotone" />
                            <div>
                                <p className="text-sm text-gray-500">Expenses</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {formatFullCurrency(totalFilteredExpenses)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 ${totalFilteredCollections - totalFilteredExpenses >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <ChartBar className={`w-8 h-8 ${totalFilteredCollections - totalFilteredExpenses >= 0 ? 'text-emerald-500' : 'text-red-500'}`} weight="duotone" />
                            <div>
                                <p className="text-sm text-gray-500">Net Profit</p>
                                <p className={`text-2xl font-bold ${totalFilteredCollections - totalFilteredExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatFullCurrency(totalFilteredCollections - totalFilteredExpenses)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Tabs */}
            <Tabs defaultValue="summary" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="summary">All Sites Summary</TabsTrigger>
                    <TabsTrigger value="collections">Site-wise Collections</TabsTrigger>
                    <TabsTrigger value="expenses">Site-wise Expenses</TabsTrigger>
                    <TabsTrigger value="categories">Expense Categories</TabsTrigger>
                    <TabsTrigger value="cashflow">Monthly Cash Flow</TabsTrigger>
                </TabsList>

                {/* All Sites Summary */}
                <TabsContent value="summary">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">All Sites Summary</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportToCSV(
                                    sites.map(s => ({
                                        'Site Name': s.site_name,
                                        'Client': s.client_name,
                                        'Location': s.location,
                                        'Stage': DEFAULT_STAGES.find(st => st.stage === s.current_stage)?.label,
                                        'Collections': s.total_collections,
                                        'Expenses': s.total_expenses,
                                        'Margin': s.margin,
                                        'Margin %': `${s.margin_percentage.toFixed(1)}%`,
                                    })),
                                    'sites_summary'
                                )}
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Export
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-2">Site</th>
                                            <th className="text-left py-3 px-2">Stage</th>
                                            <th className="text-right py-3 px-2">Collections</th>
                                            <th className="text-right py-3 px-2">Expenses</th>
                                            <th className="text-right py-3 px-2">Margin</th>
                                            <th className="text-right py-3 px-2">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sites.map((site) => (
                                            <tr key={site.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-2">
                                                    <p className="font-medium">{site.site_name}</p>
                                                    <p className="text-xs text-gray-500">{site.client_name}</p>
                                                </td>
                                                <td className="py-3 px-2 text-gray-600">
                                                    {DEFAULT_STAGES.find(s => s.stage === site.current_stage)?.label || 'N/A'}
                                                </td>
                                                <td className="py-3 px-2 text-right text-green-600 font-medium">
                                                    {formatFullCurrency(site.total_collections)}
                                                </td>
                                                <td className="py-3 px-2 text-right text-orange-600 font-medium">
                                                    {formatFullCurrency(site.total_expenses)}
                                                </td>
                                                <td className={`py-3 px-2 text-right font-bold ${site.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {formatFullCurrency(site.margin)}
                                                </td>
                                                <td className={`py-3 px-2 text-right ${site.margin_percentage >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {site.margin_percentage.toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Site-wise Collections */}
                <TabsContent value="collections">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Site-wise Collections</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportToCSV(
                                    filteredCollections.map(c => ({
                                        'Date': c.received_date,
                                        'Site': sites.find(s => s.id === c.site_id)?.site_name,
                                        'Stage': DEFAULT_STAGES.find(s => s.stage === c.stage)?.label,
                                        'Amount': c.amount,
                                        'Mode': c.payment_mode,
                                        'Reference': c.reference_number,
                                    })),
                                    'collections'
                                )}
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Export
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {siteCollections.map(({ site, totalCollected }) => (
                                    <div key={site.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Buildings className="w-8 h-8 text-blue-500" weight="duotone" />
                                            <div>
                                                <p className="font-medium">{site.site_name}</p>
                                                <p className="text-sm text-gray-500">{site.client_name}</p>
                                            </div>
                                        </div>
                                        <p className="text-xl font-bold text-green-600">{formatFullCurrency(totalCollected)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Site-wise Expenses */}
                <TabsContent value="expenses">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Site-wise Expenses</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportToCSV(
                                    filteredExpenses.map(e => ({
                                        'Date': e.expense_date,
                                        'Site': sites.find(s => s.id === e.site_id)?.site_name,
                                        'Category': EXPENSE_CATEGORY_LABELS[e.category],
                                        'Item': e.item_name,
                                        'Amount': e.total_amount,
                                        'Paid To': e.paid_to,
                                        'Mode': e.payment_mode,
                                    })),
                                    'expenses'
                                )}
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Export
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {siteExpenses.map(({ site, totalExpense }) => (
                                    <div key={site.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Buildings className="w-8 h-8 text-orange-500" weight="duotone" />
                                            <div>
                                                <p className="font-medium">{site.site_name}</p>
                                                <p className="text-sm text-gray-500">{site.client_name}</p>
                                            </div>
                                        </div>
                                        <p className="text-xl font-bold text-orange-600">{formatFullCurrency(totalExpense)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Expense Categories */}
                <TabsContent value="categories">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Expenses by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {categoryExpenses.map(({ category, label, total, count }) => {
                                    const percentage = totalFilteredExpenses > 0 ? (total / totalFilteredExpenses) * 100 : 0
                                    return (
                                        <div key={category}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <span className="font-medium">{label}</span>
                                                    <span className="text-sm text-gray-500 ml-2">({count} entries)</span>
                                                </div>
                                                <span className="font-bold text-orange-600">{formatFullCurrency(total)}</span>
                                            </div>
                                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{percentage.toFixed(1)}% of total</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Monthly Cash Flow */}
                <TabsContent value="cashflow">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Monthly Cash Flow</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {monthlyCashFlow.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No cash flow data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {monthlyCashFlow.slice(0, 12).map((month, idx) => {
                                        const monthDate = new Date(month.month)
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <p className="font-medium">
                                                        {monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm">
                                                    <div className="text-right">
                                                        <p className="text-gray-500">In</p>
                                                        <p className="font-medium text-green-600">{formatFullCurrency(month.collections)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-gray-500">Out</p>
                                                        <p className="font-medium text-orange-600">{formatFullCurrency(month.expenses)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-gray-500">Net</p>
                                                        <p className={`font-bold ${month.net_flow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {formatFullCurrency(month.net_flow)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
