import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Project, Quotation, Worker, DailyAttendance, PaymentSummary } from '@/lib/types'
import { generateMockProjects, generateMockQuotations, generateMockWorkers, generateMockAttendance, generateMockPaymentSummaries } from '@/lib/mockData'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from '@/components/ui/chart'
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts'
import {
    ChartLine,
    Buildings,
    FileText,
    UsersThree,
    Package,
    Download,
    TrendUp,
    TrendDown,
    Money,
    CalendarBlank,
    Funnel,
    FunnelSimple,
    CaretDown,
    CaretUp,
    X,
    MagnifyingGlass,
} from '@phosphor-icons/react'
import { format, subMonths, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'

// Chart colors
const CHART_COLORS = {
    primary: '#dc2626',
    secondary: '#059669',
    tertiary: '#2563eb',
    quaternary: '#7c3aed',
    warning: '#d97706',
    muted: '#6b7280',
}

const PIE_COLORS = ['#dc2626', '#059669', '#2563eb', '#7c3aed', '#d97706', '#0891b2', '#be185d']

// Date range options
const DATE_RANGES = [
    { value: '30d', label: 'Last 30 Days' },
    { value: '3m', label: 'Last 3 Months' },
    { value: '6m', label: 'Last 6 Months' },
    { value: '1y', label: 'Last 1 Year' },
    { value: 'all', label: 'All Time' },
]

interface KPICardProps {
    title: string
    value: string
    subtitle?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    icon: React.ReactNode
    color?: string
}

function ReportKPICard({ title, value, subtitle, trend, trendValue, icon, color = 'bg-gray-50' }: KPICardProps) {
    return (
        <Card className={`${color} border-0 shadow-sm`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                        {trend && trendValue && (
                            <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-gray-500'}`}>
                                {trend === 'up' ? <TrendUp size={16} weight="bold" /> : trend === 'down' ? <TrendDown size={16} weight="bold" /> : null}
                                <span>{trendValue}</span>
                            </div>
                        )}
                    </div>
                    <div className="p-3 rounded-xl bg-white/80 shadow-sm">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function ReportsPage() {
    const [activeTab, setActiveTab] = useState('financial')
    const [dateRange, setDateRange] = useState('6m')
    const [selectedProject, setSelectedProject] = useState<string>('all')

    // Advanced filter states
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [customDateFrom, setCustomDateFrom] = useState('')
    const [customDateTo, setCustomDateTo] = useState('')

    // Tab-specific filters
    const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all')
    const [packageTypeFilter, setPackageTypeFilter] = useState<string>('all')
    const [quotationStatusFilter, setQuotationStatusFilter] = useState<string>('all')
    const [workerTypeFilter, setWorkerTypeFilter] = useState<string>('all')
    const [workerStatusFilter, setWorkerStatusFilter] = useState<string>('all')
    const [materialStatusFilter, setMaterialStatusFilter] = useState<string>('all')
    const [materialCategoryFilter, setMaterialCategoryFilter] = useState<string>('all')

    // Fetch data
    const [projects] = useKV<Project[]>('construction-projects', generateMockProjects())
    const [quotations] = useKV<Quotation[]>('quotations', generateMockQuotations())
    const [workers] = useKV<Worker[]>('workers', generateMockWorkers())
    const [attendance] = useKV<DailyAttendance[]>('attendance', generateMockAttendance())
    const [payments] = useKV<PaymentSummary[]>('payment-summaries', generateMockPaymentSummaries())

    const safeProjects = Array.isArray(projects) ? projects : []
    const safeQuotations = Array.isArray(quotations) ? quotations : []
    const safeWorkers = Array.isArray(workers) ? workers : []

    // Filter logic based on date range
    const getDateRangeFilter = () => {
        const now = new Date()
        switch (dateRange) {
            case '30d': return { start: subDays(now, 30), end: now }
            case '3m': return { start: subMonths(now, 3), end: now }
            case '6m': return { start: subMonths(now, 6), end: now }
            case '1y': return { start: subMonths(now, 12), end: now }
            default: return null
        }
    }

    // Filter projects based on selection
    const filteredProjects = useMemo(() => {
        if (selectedProject === 'all') return safeProjects
        return safeProjects.filter(p => p.id === selectedProject)
    }, [safeProjects, selectedProject])

    // ==================== FINANCIAL OVERVIEW DATA ====================
    const financialData = useMemo(() => {
        const totalCollections = filteredProjects.reduce((sum, p) => sum + p.totalCollected, 0)
        const totalExpenses = filteredProjects.reduce((sum, p) => sum + p.totalExpenses, 0)
        const totalProjectValue = filteredProjects.reduce((sum, p) => sum + p.totalCost, 0)
        const pendingCollections = totalProjectValue - totalCollections
        const profitMargin = totalCollections > 0 ? ((totalCollections - totalExpenses) / totalCollections * 100) : 0

        // Monthly trends (simulated)
        const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
            const date = subMonths(new Date(), 5 - i)
            const month = format(date, 'MMM')
            const collections = Math.round(totalCollections / 6 * (0.8 + Math.random() * 0.4))
            const expenses = Math.round(totalExpenses / 6 * (0.8 + Math.random() * 0.4))
            return { month, collections, expenses, profit: collections - expenses }
        })

        // Collections breakdown
        const collectionsBreakdown = [
            { name: 'Collected', value: totalCollections },
            { name: 'Pending', value: pendingCollections > 0 ? pendingCollections : 0 },
        ]

        // Expense categories
        const expenseCategories = [
            { name: 'Labor', value: Math.round(totalExpenses * 0.35) },
            { name: 'Materials', value: Math.round(totalExpenses * 0.45) },
            { name: 'Equipment', value: Math.round(totalExpenses * 0.10) },
            { name: 'Transport', value: Math.round(totalExpenses * 0.05) },
            { name: 'Other', value: Math.round(totalExpenses * 0.05) },
        ]

        return {
            totalCollections,
            totalExpenses,
            totalProjectValue,
            pendingCollections,
            profitMargin,
            monthlyTrends,
            collectionsBreakdown,
            expenseCategories,
        }
    }, [filteredProjects])

    // ==================== PROJECT ANALYTICS DATA ====================
    const projectData = useMemo(() => {
        // Status distribution
        const statusCount = {
            'on-track': 0,
            'delayed': 0,
            'completed': 0,
            'on-hold': 0,
        }
        filteredProjects.forEach(p => {
            if (p.status in statusCount) {
                statusCount[p.status as keyof typeof statusCount]++
            }
        })
        const statusDistribution = Object.entries(statusCount).map(([name, value]) => ({ name: name.replace('-', ' ').toUpperCase(), value }))

        // Project progress
        const projectProgress = filteredProjects.map(p => ({
            name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
            progress: p.completionPercentage,
            budget: Math.round((p.totalExpenses / p.totalCost) * 100),
        }))

        // Package distribution
        const packageDist: Record<string, number> = {}
        filteredProjects.forEach(p => {
            packageDist[p.packageType] = (packageDist[p.packageType] || 0) + 1
        })
        const packageDistribution = Object.entries(packageDist).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        }))

        // Location summary
        const locationSummary = filteredProjects.reduce((acc, p) => {
            const loc = p.location.split(',')[0].trim()
            acc[loc] = (acc[loc] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return {
            statusDistribution,
            projectProgress,
            packageDistribution,
            totalProjects: filteredProjects.length,
            activeProjects: filteredProjects.filter(p => p.status !== 'completed').length,
            completedProjects: filteredProjects.filter(p => p.status === 'completed').length,
            avgProgress: Math.round(filteredProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / (filteredProjects.length || 1)),
            locationSummary,
        }
    }, [filteredProjects])

    // ==================== QUOTATION INSIGHTS DATA ====================
    const quotationData = useMemo(() => {
        const statusCount = {
            draft: 0,
            finalized: 0,
            sent: 0,
            signed: 0,
            converted: 0,
            cancelled: 0,
        }
        safeQuotations.forEach(q => {
            if (q.status in statusCount) {
                statusCount[q.status as keyof typeof statusCount]++
            }
        })

        const total = safeQuotations.length || 1
        const conversionRate = ((statusCount.converted + statusCount.signed) / total * 100).toFixed(1)

        // Funnel data
        const funnelData = [
            { name: 'Draft', value: statusCount.draft, fill: CHART_COLORS.muted },
            { name: 'Finalized', value: statusCount.finalized, fill: CHART_COLORS.tertiary },
            { name: 'Sent', value: statusCount.sent, fill: CHART_COLORS.warning },
            { name: 'Signed', value: statusCount.signed, fill: CHART_COLORS.secondary },
            { name: 'Converted', value: statusCount.converted, fill: CHART_COLORS.primary },
        ]

        // Package value distribution
        const packageValues: Record<string, number> = {}
        safeQuotations.forEach(q => {
            packageValues[q.selectedPackage] = (packageValues[q.selectedPackage] || 0) + q.estimatedTotal
        })
        const packageValueDist = Object.entries(packageValues).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: Math.round(value / 100000), // In Lakhs
        }))

        // Monthly quotation count
        const monthlyQuotations = Array.from({ length: 6 }, (_, i) => {
            const date = subMonths(new Date(), 5 - i)
            return {
                month: format(date, 'MMM'),
                count: Math.floor(Math.random() * 5) + 1,
                value: Math.round((Math.random() * 50 + 20)),
            }
        })

        return {
            statusCount,
            total: safeQuotations.length,
            conversionRate,
            funnelData,
            packageValueDist,
            monthlyQuotations,
            totalValue: safeQuotations.reduce((sum, q) => sum + q.estimatedTotal, 0),
            avgQuotationValue: Math.round(safeQuotations.reduce((sum, q) => sum + q.estimatedTotal, 0) / (safeQuotations.length || 1)),
        }
    }, [safeQuotations])

    // ==================== LABOR ANALYTICS DATA ====================
    const laborData = useMemo(() => {
        // Worker type distribution
        const workerTypes: Record<string, number> = {}
        safeWorkers.forEach(w => {
            workerTypes[w.type] = (workerTypes[w.type] || 0) + 1
        })
        const workerDistribution = Object.entries(workerTypes).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        }))

        // Total wages
        const totalDailyWages = safeWorkers.reduce((sum, w) => sum + w.dailyWage, 0)
        const avgDailyWage = Math.round(totalDailyWages / (safeWorkers.length || 1))

        // Worker status
        const activeWorkers = safeWorkers.filter(w => w.status === 'active').length
        const inactiveWorkers = safeWorkers.filter(w => w.status === 'inactive').length

        // Wage distribution by type
        const wageByType = Object.entries(workerTypes).map(([type, count]) => {
            const typeWorkers = safeWorkers.filter(w => w.type === type)
            const avgWage = Math.round(typeWorkers.reduce((sum, w) => sum + w.dailyWage, 0) / (typeWorkers.length || 1))
            return { name: type.charAt(0).toUpperCase() + type.slice(1), avgWage, count }
        })

        // Weekly wage trend (simulated)
        const weeklyTrend = Array.from({ length: 4 }, (_, i) => ({
            week: `Week ${i + 1}`,
            wages: Math.round(totalDailyWages * 6 * (0.9 + Math.random() * 0.2)),
            attendance: Math.round(80 + Math.random() * 20),
        }))

        return {
            workerDistribution,
            totalWorkers: safeWorkers.length,
            activeWorkers,
            inactiveWorkers,
            totalDailyWages,
            avgDailyWage,
            wageByType,
            weeklyTrend,
            totalAdvances: safeWorkers.reduce((sum, w) => sum + w.advanceBalance, 0),
        }
    }, [safeWorkers])

    // ==================== MATERIAL USAGE DATA ====================
    const materialData = useMemo(() => {
        // Aggregate materials from all projects
        const materialCategories: Record<string, { estimated: number, actual: number, count: number }> = {}

        filteredProjects.forEach(p => {
            if (p.materials) {
                p.materials.forEach(m => {
                    if (!materialCategories[m.category]) {
                        materialCategories[m.category] = { estimated: 0, actual: 0, count: 0 }
                    }
                    materialCategories[m.category].estimated += m.estimatedQuantity
                    materialCategories[m.category].actual += m.actualQuantityUsed
                    materialCategories[m.category].count++
                })
            }
        })

        const categoryBreakdown = Object.entries(materialCategories).map(([name, data]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            estimated: data.estimated,
            actual: data.actual,
            variance: Math.round(((data.actual - data.estimated) / (data.estimated || 1)) * 100),
        }))

        // Material status
        const statusCount = { pending: 0, ordered: 0, delivered: 0, installed: 0 }
        filteredProjects.forEach(p => {
            if (p.materials) {
                p.materials.forEach(m => {
                    if (m.status in statusCount) {
                        statusCount[m.status as keyof typeof statusCount]++
                    }
                })
            }
        })

        const statusDistribution = Object.entries(statusCount).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        }))

        // Top materials
        const materialUsage: Record<string, number> = {}
        filteredProjects.forEach(p => {
            if (p.materialUsage) {
                Object.entries(p.materialUsage).forEach(([mat, qty]) => {
                    materialUsage[mat] = (materialUsage[mat] || 0) + qty
                })
            }
        })

        const topMaterials = Object.entries(materialUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }))

        return {
            categoryBreakdown,
            statusDistribution,
            topMaterials,
            totalMaterials: Object.values(statusCount).reduce((a, b) => a + b, 0),
            pendingItems: statusCount.pending,
            orderedItems: statusCount.ordered,
            deliveredItems: statusCount.delivered,
            installedItems: statusCount.installed,
        }
    }, [filteredProjects])

    // ==================== EXPORT FUNCTION ====================
    const exportToCSV = (reportType: string) => {
        let csvContent = ''
        let filename = `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`

        switch (reportType) {
            case 'financial':
                csvContent = 'Metric,Value\n'
                csvContent += `Total Collections,${financialData.totalCollections}\n`
                csvContent += `Total Expenses,${financialData.totalExpenses}\n`
                csvContent += `Pending Collections,${financialData.pendingCollections}\n`
                csvContent += `Profit Margin,${financialData.profitMargin.toFixed(1)}%\n`
                break
            case 'projects':
                csvContent = 'Project,Progress %,Budget Used %,Status\n'
                filteredProjects.forEach(p => {
                    const budgetUsed = Math.round((p.totalExpenses / p.totalCost) * 100)
                    csvContent += `"${p.name}",${p.completionPercentage},${budgetUsed},${p.status}\n`
                })
                break
            case 'quotations':
                csvContent = 'Quotation No,Client,Package,Value,Status\n'
                safeQuotations.forEach(q => {
                    csvContent += `${q.quotationNumber},"${q.clientName}",${q.selectedPackage},${q.estimatedTotal},${q.status}\n`
                })
                break
            case 'labor':
                csvContent = 'Worker,Type,Daily Wage,Status\n'
                safeWorkers.forEach(w => {
                    csvContent += `"${w.name}",${w.type},${w.dailyWage},${w.status}\n`
                })
                break
            case 'materials':
                csvContent = 'Category,Estimated,Actual,Variance %\n'
                materialData.categoryBreakdown.forEach(m => {
                    csvContent += `${m.name},${m.estimated},${m.actual},${m.variance}%\n`
                })
                break
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename
        link.click()
    }

    // Chart configs
    const lineChartConfig = {
        collections: { label: 'Collections', color: CHART_COLORS.secondary },
        expenses: { label: 'Expenses', color: CHART_COLORS.primary },
        profit: { label: 'Profit', color: CHART_COLORS.tertiary },
    }

    const barChartConfig = {
        progress: { label: 'Progress', color: CHART_COLORS.primary },
        budget: { label: 'Budget Used', color: CHART_COLORS.secondary },
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Reports & Analytics</h2>
                    <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[160px]">
                            <CalendarBlank size={18} className="mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DATE_RANGES.map(range => (
                                <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                            ))}
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="w-[180px]">
                            <Buildings size={18} className="mr-2" />
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {safeProjects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant={showAdvancedFilters ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={showAdvancedFilters ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                        <FunnelSimple size={18} className="mr-2" />
                        Advanced Filters
                        {showAdvancedFilters ? <CaretUp size={14} className="ml-1" /> : <CaretDown size={14} className="ml-1" />}
                    </Button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                <CollapsibleContent>
                    <Card className="border-red-100 bg-red-50/30">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <MagnifyingGlass size={18} />
                                    Advanced Search Filters
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setCustomDateFrom('')
                                        setCustomDateTo('')
                                        setProjectStatusFilter('all')
                                        setPackageTypeFilter('all')
                                        setQuotationStatusFilter('all')
                                        setWorkerTypeFilter('all')
                                        setWorkerStatusFilter('all')
                                        setMaterialStatusFilter('all')
                                        setMaterialCategoryFilter('all')
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={16} className="mr-1" />
                                    Clear All
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Custom Date Range */}
                                {dateRange === 'custom' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="dateFrom" className="text-sm text-gray-600">From Date</Label>
                                            <Input
                                                id="dateFrom"
                                                type="date"
                                                value={customDateFrom}
                                                onChange={(e) => setCustomDateFrom(e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dateTo" className="text-sm text-gray-600">To Date</Label>
                                            <Input
                                                id="dateTo"
                                                type="date"
                                                value={customDateTo}
                                                onChange={(e) => setCustomDateTo(e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Projects Tab Filters */}
                                {activeTab === 'projects' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-gray-600">Project Status</Label>
                                            <Select value={projectStatusFilter} onValueChange={setProjectStatusFilter}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="All Statuses" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Statuses</SelectItem>
                                                    <SelectItem value="on-track">On Track</SelectItem>
                                                    <SelectItem value="delayed">Delayed</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="on-hold">On Hold</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-gray-600">Package Type</Label>
                                            <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="All Packages" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Packages</SelectItem>
                                                    <SelectItem value="basic">Basic</SelectItem>
                                                    <SelectItem value="standard">Standard</SelectItem>
                                                    <SelectItem value="premium">Premium</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                {/* Quotations Tab Filters */}
                                {activeTab === 'quotations' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-gray-600">Quotation Status</Label>
                                            <Select value={quotationStatusFilter} onValueChange={setQuotationStatusFilter}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="All Statuses" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Statuses</SelectItem>
                                                    <SelectItem value="draft">Draft</SelectItem>
                                                    <SelectItem value="finalized">Finalized</SelectItem>
                                                    <SelectItem value="sent">Sent</SelectItem>
                                                    <SelectItem value="signed">Signed</SelectItem>
                                                    <SelectItem value="converted">Converted</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-gray-600">Package Type</Label>
                                            <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="All Packages" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Packages</SelectItem>
                                                    <SelectItem value="basic">Basic</SelectItem>
                                                    <SelectItem value="standard">Standard</SelectItem>
                                                    <SelectItem value="premium">Premium</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                {/* Labor Tab Filters */}
                                {activeTab === 'labor' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-gray-600">Worker Type</Label>
                                            <Select value={workerTypeFilter} onValueChange={setWorkerTypeFilter}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="All Types" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Types</SelectItem>
                                                    <SelectItem value="mason">Mason</SelectItem>
                                                    <SelectItem value="helper">Helper</SelectItem>
                                                    <SelectItem value="electrician">Electrician</SelectItem>
                                                    <SelectItem value="plumber">Plumber</SelectItem>
                                                    <SelectItem value="carpenter">Carpenter</SelectItem>
                                                    <SelectItem value="painter">Painter</SelectItem>
                                                    <SelectItem value="barbender">Bar Bender</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-gray-600">Worker Status</Label>
                                            <Select value={workerStatusFilter} onValueChange={setWorkerStatusFilter}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="All Statuses" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Statuses</SelectItem>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                {/* Materials Tab Filters */}
                                {activeTab === 'materials' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-gray-600">Material Status</Label>
                                            <Select value={materialStatusFilter} onValueChange={setMaterialStatusFilter}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="All Statuses" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Statuses</SelectItem>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="ordered">Ordered</SelectItem>
                                                    <SelectItem value="delivered">Delivered</SelectItem>
                                                    <SelectItem value="installed">Installed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-gray-600">Material Category</Label>
                                            <Select value={materialCategoryFilter} onValueChange={setMaterialCategoryFilter}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="All Categories" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Categories</SelectItem>
                                                    <SelectItem value="cement">Cement</SelectItem>
                                                    <SelectItem value="steel">Steel</SelectItem>
                                                    <SelectItem value="sand">Sand</SelectItem>
                                                    <SelectItem value="bricks">Bricks</SelectItem>
                                                    <SelectItem value="electrical">Electrical</SelectItem>
                                                    <SelectItem value="plumbing">Plumbing</SelectItem>
                                                    <SelectItem value="tiles">Tiles</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                {/* Financial Tab - Show date range hint */}
                                {activeTab === 'financial' && dateRange !== 'custom' && (
                                    <div className="sm:col-span-2 lg:col-span-4">
                                        <p className="text-sm text-gray-500 italic">
                                            Select "Custom Range" from the date dropdown above to filter by specific dates.
                                            Use the project filter to view financial data for a specific project.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Active Filters Summary */}
                            {(projectStatusFilter !== 'all' || packageTypeFilter !== 'all' || quotationStatusFilter !== 'all' ||
                                workerTypeFilter !== 'all' || workerStatusFilter !== 'all' ||
                                materialStatusFilter !== 'all' || materialCategoryFilter !== 'all' ||
                                customDateFrom || customDateTo) && (
                                    <div className="mt-4 pt-4 border-t border-red-100">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm text-gray-600">Active Filters:</span>
                                            {customDateFrom && (
                                                <Badge variant="secondary" className="bg-red-100 text-red-700">
                                                    From: {customDateFrom}
                                                </Badge>
                                            )}
                                            {customDateTo && (
                                                <Badge variant="secondary" className="bg-red-100 text-red-700">
                                                    To: {customDateTo}
                                                </Badge>
                                            )}
                                            {projectStatusFilter !== 'all' && (
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                                    Status: {projectStatusFilter}
                                                </Badge>
                                            )}
                                            {packageTypeFilter !== 'all' && (
                                                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                                    Package: {packageTypeFilter}
                                                </Badge>
                                            )}
                                            {quotationStatusFilter !== 'all' && (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                                    Quotation: {quotationStatusFilter}
                                                </Badge>
                                            )}
                                            {workerTypeFilter !== 'all' && (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                                    Type: {workerTypeFilter}
                                                </Badge>
                                            )}
                                            {workerStatusFilter !== 'all' && (
                                                <Badge variant="secondary" className="bg-cyan-100 text-cyan-700">
                                                    Status: {workerStatusFilter}
                                                </Badge>
                                            )}
                                            {materialStatusFilter !== 'all' && (
                                                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                                    Material: {materialStatusFilter}
                                                </Badge>
                                            )}
                                            {materialCategoryFilter !== 'all' && (
                                                <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                                                    Category: {materialCategoryFilter}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2 h-auto bg-transparent p-0">
                    <TabsTrigger value="financial" className="flex items-center gap-2 py-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
                        <ChartLine size={20} />
                        <span className="hidden sm:inline">Financial</span>
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="flex items-center gap-2 py-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
                        <Buildings size={20} />
                        <span className="hidden sm:inline">Projects</span>
                    </TabsTrigger>
                    <TabsTrigger value="quotations" className="flex items-center gap-2 py-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
                        <FileText size={20} />
                        <span className="hidden sm:inline">Quotations</span>
                    </TabsTrigger>
                    <TabsTrigger value="labor" className="flex items-center gap-2 py-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
                        <UsersThree size={20} />
                        <span className="hidden sm:inline">Labor</span>
                    </TabsTrigger>
                    <TabsTrigger value="materials" className="flex items-center gap-2 py-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
                        <Package size={20} />
                        <span className="hidden sm:inline">Materials</span>
                    </TabsTrigger>
                </TabsList>

                {/* Financial Overview Tab */}
                <TabsContent value="financial" className="space-y-6">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => exportToCSV('financial')}>
                            <Download size={16} className="mr-2" />
                            Export CSV
                        </Button>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ReportKPICard
                            title="Total Collections"
                            value={`₹${(financialData.totalCollections / 100000).toFixed(1)}L`}
                            subtitle={`of ₹${(financialData.totalProjectValue / 100000).toFixed(1)}L total`}
                            trend="up"
                            trendValue="+12% this month"
                            icon={<Money size={24} className="text-emerald-600" />}
                            color="bg-emerald-50"
                        />
                        <ReportKPICard
                            title="Total Expenses"
                            value={`₹${(financialData.totalExpenses / 100000).toFixed(1)}L`}
                            subtitle="across all projects"
                            trend="up"
                            trendValue="+8% this month"
                            icon={<TrendDown size={24} className="text-rose-600" />}
                            color="bg-rose-50"
                        />
                        <ReportKPICard
                            title="Pending Collections"
                            value={`₹${(financialData.pendingCollections / 100000).toFixed(1)}L`}
                            subtitle="yet to be collected"
                            icon={<Money size={24} className="text-amber-600" />}
                            color="bg-amber-50"
                        />
                        <ReportKPICard
                            title="Profit Margin"
                            value={`${financialData.profitMargin.toFixed(1)}%`}
                            subtitle="overall margin"
                            trend={financialData.profitMargin > 10 ? 'up' : 'down'}
                            trendValue={financialData.profitMargin > 10 ? 'Healthy' : 'Needs attention'}
                            icon={<TrendUp size={24} className="text-blue-600" />}
                            color="bg-blue-50"
                        />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue vs Expenses Trend */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Revenue vs Expenses Trend</CardTitle>
                                <CardDescription>Monthly comparison over the last 6 months</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={lineChartConfig} className="h-[300px]">
                                    <LineChart data={financialData.monthlyTrends}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" tickLine={false} axisLine={false} />
                                        <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => `₹${(Number(value) / 100000).toFixed(2)}L`} />} />
                                        <Line type="monotone" dataKey="collections" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={{ fill: CHART_COLORS.secondary }} />
                                        <Line type="monotone" dataKey="expenses" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ fill: CHART_COLORS.primary }} />
                                    </LineChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Collections Breakdown */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Collections Status</CardTitle>
                                <CardDescription>Collected vs Pending amounts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{ collected: { label: 'Collected', color: CHART_COLORS.secondary }, pending: { label: 'Pending', color: CHART_COLORS.warning } }} className="h-[300px]">
                                    <PieChart>
                                        <Pie
                                            data={financialData.collectionsBreakdown}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            label={({ name, value }) => `${name}: ₹${(value / 100000).toFixed(1)}L`}
                                        >
                                            {financialData.collectionsBreakdown.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? CHART_COLORS.secondary : CHART_COLORS.warning} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => `₹${(Number(value) / 100000).toFixed(2)}L`} />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Expense Categories */}
                        <Card className="shadow-sm lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg">Expense Breakdown by Category</CardTitle>
                                <CardDescription>Distribution of expenses across categories</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{ value: { label: 'Amount', color: CHART_COLORS.primary } }} className="h-[250px]">
                                    <BarChart data={financialData.expenseCategories} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                                        <YAxis type="category" dataKey="name" width={80} tickLine={false} axisLine={false} />
                                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => `₹${(Number(value) / 100000).toFixed(2)}L`} />} />
                                        <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Project Analytics Tab */}
                <TabsContent value="projects" className="space-y-6">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => exportToCSV('projects')}>
                            <Download size={16} className="mr-2" />
                            Export CSV
                        </Button>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ReportKPICard
                            title="Total Projects"
                            value={projectData.totalProjects.toString()}
                            subtitle="in portfolio"
                            icon={<Buildings size={24} className="text-blue-600" />}
                            color="bg-blue-50"
                        />
                        <ReportKPICard
                            title="Active Projects"
                            value={projectData.activeProjects.toString()}
                            subtitle="currently in progress"
                            icon={<TrendUp size={24} className="text-emerald-600" />}
                            color="bg-emerald-50"
                        />
                        <ReportKPICard
                            title="Completed"
                            value={projectData.completedProjects.toString()}
                            subtitle="delivered successfully"
                            icon={<Buildings size={24} className="text-purple-600" />}
                            color="bg-purple-50"
                        />
                        <ReportKPICard
                            title="Avg. Progress"
                            value={`${projectData.avgProgress}%`}
                            subtitle="across all projects"
                            icon={<ChartLine size={24} className="text-amber-600" />}
                            color="bg-amber-50"
                        />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status Distribution */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Project Status Distribution</CardTitle>
                                <CardDescription>Current status of all projects</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={Object.fromEntries(
                                        projectData.statusDistribution.map((item, index) => [
                                            item.name.toLowerCase().replace(' ', '-'),
                                            { label: item.name, color: PIE_COLORS[index % PIE_COLORS.length] }
                                        ])
                                    )}
                                    className="h-[300px]"
                                >
                                    <PieChart>
                                        <Pie
                                            data={projectData.statusDistribution}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={40}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            strokeWidth={2}
                                            stroke="#fff"
                                            label={({ name, value }) => value > 0 ? name : ''}
                                            labelLine={{ stroke: '#666', strokeWidth: 1 }}
                                        >
                                            {projectData.statusDistribution.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    nameKey="name"
                                                    formatter={(value, name, item) => {
                                                        const total = projectData.statusDistribution.reduce((sum, d) => sum + d.value, 0)
                                                        const percent = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0
                                                        return `${value} (${percent}%)`
                                                    }}
                                                />
                                            }
                                        />
                                        <ChartLegend
                                            content={
                                                <ChartLegendContent
                                                    nameKey="name"
                                                    className="flex-wrap justify-center gap-3 text-sm"
                                                />
                                            }
                                        />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Package Distribution */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Package Type Distribution</CardTitle>
                                <CardDescription>Projects by package type</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={Object.fromEntries(
                                        projectData.packageDistribution.map((item, index) => [
                                            item.name.toLowerCase(),
                                            { label: item.name, color: PIE_COLORS[index % PIE_COLORS.length] }
                                        ])
                                    )}
                                    className="h-[300px]"
                                >
                                    <PieChart>
                                        <Pie
                                            data={projectData.packageDistribution}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={40}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            strokeWidth={2}
                                            stroke="#fff"
                                            label={({ name }) => name}
                                            labelLine={{ stroke: '#666', strokeWidth: 1 }}
                                        >
                                            {projectData.packageDistribution.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    nameKey="name"
                                                    formatter={(value, name, item) => {
                                                        const total = projectData.packageDistribution.reduce((sum, d) => sum + d.value, 0)
                                                        const percent = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0
                                                        return `${value} projects (${percent}%)`
                                                    }}
                                                />
                                            }
                                        />
                                        <ChartLegend
                                            content={
                                                <ChartLegendContent
                                                    nameKey="name"
                                                    className="flex-wrap justify-center gap-3 text-sm"
                                                />
                                            }
                                        />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Project Progress Comparison */}
                        <Card className="shadow-sm lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg">Project Progress vs Budget</CardTitle>
                                <CardDescription>Completion percentage and budget utilization</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={barChartConfig} className="h-[300px]">
                                    <BarChart data={projectData.projectProgress} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                        <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} />
                                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}%`} />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar dataKey="progress" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} name="Progress" />
                                        <Bar dataKey="budget" fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} name="Budget Used" />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Quotation Insights Tab */}
                <TabsContent value="quotations" className="space-y-6">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => exportToCSV('quotations')}>
                            <Download size={16} className="mr-2" />
                            Export CSV
                        </Button>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ReportKPICard
                            title="Total Quotations"
                            value={quotationData.total.toString()}
                            subtitle="created overall"
                            icon={<FileText size={24} className="text-blue-600" />}
                            color="bg-blue-50"
                        />
                        <ReportKPICard
                            title="Conversion Rate"
                            value={`${quotationData.conversionRate}%`}
                            subtitle="signed + converted"
                            trend={Number(quotationData.conversionRate) > 30 ? 'up' : 'down'}
                            trendValue={Number(quotationData.conversionRate) > 30 ? 'Good' : 'Needs improvement'}
                            icon={<Funnel size={24} className="text-emerald-600" />}
                            color="bg-emerald-50"
                        />
                        <ReportKPICard
                            title="Total Value"
                            value={`₹${(quotationData.totalValue / 100000).toFixed(1)}L`}
                            subtitle="all quotations"
                            icon={<Money size={24} className="text-purple-600" />}
                            color="bg-purple-50"
                        />
                        <ReportKPICard
                            title="Avg. Value"
                            value={`₹${(quotationData.avgQuotationValue / 100000).toFixed(1)}L`}
                            subtitle="per quotation"
                            icon={<ChartLine size={24} className="text-amber-600" />}
                            color="bg-amber-50"
                        />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Quotation Funnel */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Quotation Pipeline</CardTitle>
                                <CardDescription>Status distribution</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{ value: { label: 'Count', color: CHART_COLORS.primary } }} className="h-[300px]">
                                    <BarChart data={quotationData.funnelData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                        <YAxis tickLine={false} axisLine={false} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {quotationData.funnelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Package Value Distribution */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Value by Package Type</CardTitle>
                                <CardDescription>Total quotation value per package (in Lakhs)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{ value: { label: 'Value (L)', color: CHART_COLORS.tertiary } }} className="h-[300px]">
                                    <BarChart data={quotationData.packageValueDist}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                        <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}L`} />
                                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => `₹${value}L`} />} />
                                        <Bar dataKey="value" fill={CHART_COLORS.tertiary} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Monthly Quotation Trend */}
                        <Card className="shadow-sm lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg">Monthly Quotation Trend</CardTitle>
                                <CardDescription>Number and value of quotations per month</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{ count: { label: 'Count', color: CHART_COLORS.primary }, value: { label: 'Value (L)', color: CHART_COLORS.secondary } }} className="h-[250px]">
                                    <AreaChart data={quotationData.monthlyQuotations}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" tickLine={false} axisLine={false} />
                                        <YAxis tickLine={false} axisLine={false} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Area type="monotone" dataKey="count" fill={CHART_COLORS.primary} fillOpacity={0.3} stroke={CHART_COLORS.primary} />
                                        <Area type="monotone" dataKey="value" fill={CHART_COLORS.secondary} fillOpacity={0.3} stroke={CHART_COLORS.secondary} />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Labor Analytics Tab */}
                <TabsContent value="labor" className="space-y-6">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => exportToCSV('labor')}>
                            <Download size={16} className="mr-2" />
                            Export CSV
                        </Button>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ReportKPICard
                            title="Total Workers"
                            value={laborData.totalWorkers.toString()}
                            subtitle="registered"
                            icon={<UsersThree size={24} className="text-blue-600" />}
                            color="bg-blue-50"
                        />
                        <ReportKPICard
                            title="Active Workers"
                            value={laborData.activeWorkers.toString()}
                            subtitle="currently working"
                            icon={<TrendUp size={24} className="text-emerald-600" />}
                            color="bg-emerald-50"
                        />
                        <ReportKPICard
                            title="Daily Wage Bill"
                            value={`₹${laborData.totalDailyWages.toLocaleString()}`}
                            subtitle="for all workers"
                            icon={<Money size={24} className="text-purple-600" />}
                            color="bg-purple-50"
                        />
                        <ReportKPICard
                            title="Pending Advances"
                            value={`₹${laborData.totalAdvances.toLocaleString()}`}
                            subtitle="to recover"
                            icon={<Money size={24} className="text-amber-600" />}
                            color="bg-amber-50"
                        />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Worker Distribution */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Worker Type Distribution</CardTitle>
                                <CardDescription>Breakdown by role</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={Object.fromEntries(
                                        laborData.workerDistribution.map((item, index) => [
                                            item.name.toLowerCase(),
                                            { label: item.name, color: PIE_COLORS[index % PIE_COLORS.length] }
                                        ])
                                    )}
                                    className="h-[300px]"
                                >
                                    <PieChart>
                                        <Pie
                                            data={laborData.workerDistribution}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={40}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            strokeWidth={2}
                                            stroke="#fff"
                                            label={({ name }) => name}
                                            labelLine={{ stroke: '#666', strokeWidth: 1 }}
                                        >
                                            {laborData.workerDistribution.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    nameKey="name"
                                                    formatter={(value, name, item) => {
                                                        const total = laborData.workerDistribution.reduce((sum, d) => sum + d.value, 0)
                                                        const percent = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0
                                                        return `${value} workers (${percent}%)`
                                                    }}
                                                />
                                            }
                                        />
                                        <ChartLegend
                                            content={
                                                <ChartLegendContent
                                                    nameKey="name"
                                                    className="flex-wrap justify-center gap-3 text-sm"
                                                />
                                            }
                                        />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Wage by Type */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Average Daily Wage by Type</CardTitle>
                                <CardDescription>Comparison of wages across roles</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{ avgWage: { label: 'Avg Wage', color: CHART_COLORS.tertiary } }} className="h-[300px]">
                                    <BarChart data={laborData.wageByType}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                        <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => `₹${value}`} />} />
                                        <Bar dataKey="avgWage" fill={CHART_COLORS.tertiary} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Weekly Trend */}
                        <Card className="shadow-sm lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg">Weekly Wage & Attendance Trend</CardTitle>
                                <CardDescription>Last 4 weeks performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{ wages: { label: 'Wages', color: CHART_COLORS.primary }, attendance: { label: 'Attendance %', color: CHART_COLORS.secondary } }} className="h-[250px]">
                                    <BarChart data={laborData.weeklyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="week" tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="left" tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                                        <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar yAxisId="left" dataKey="wages" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                                        <Line yAxisId="right" type="monotone" dataKey="attendance" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={{ fill: CHART_COLORS.secondary }} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Material Usage Tab */}
                <TabsContent value="materials" className="space-y-6">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => exportToCSV('materials')}>
                            <Download size={16} className="mr-2" />
                            Export CSV
                        </Button>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ReportKPICard
                            title="Total Items"
                            value={materialData.totalMaterials.toString()}
                            subtitle="tracked"
                            icon={<Package size={24} className="text-blue-600" />}
                            color="bg-blue-50"
                        />
                        <ReportKPICard
                            title="Installed"
                            value={materialData.installedItems.toString()}
                            subtitle="completed"
                            icon={<TrendUp size={24} className="text-emerald-600" />}
                            color="bg-emerald-50"
                        />
                        <ReportKPICard
                            title="Delivered"
                            value={materialData.deliveredItems.toString()}
                            subtitle="at site"
                            icon={<Package size={24} className="text-purple-600" />}
                            color="bg-purple-50"
                        />
                        <ReportKPICard
                            title="Pending"
                            value={materialData.pendingItems.toString()}
                            subtitle="yet to order"
                            icon={<Package size={24} className="text-amber-600" />}
                            color="bg-amber-50"
                        />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Material Status */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Material Status Distribution</CardTitle>
                                <CardDescription>Items by current status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={Object.fromEntries(
                                        materialData.statusDistribution.map((item, index) => [
                                            item.name.toLowerCase(),
                                            { label: item.name, color: PIE_COLORS[index % PIE_COLORS.length] }
                                        ])
                                    )}
                                    className="h-[300px]"
                                >
                                    <PieChart>
                                        <Pie
                                            data={materialData.statusDistribution}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={40}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            strokeWidth={2}
                                            stroke="#fff"
                                            label={({ name }) => name}
                                            labelLine={{ stroke: '#666', strokeWidth: 1 }}
                                        >
                                            {materialData.statusDistribution.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    nameKey="name"
                                                    formatter={(value, name, item) => {
                                                        const total = materialData.statusDistribution.reduce((sum, d) => sum + d.value, 0)
                                                        const percent = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0
                                                        return `${value} items (${percent}%)`
                                                    }}
                                                />
                                            }
                                        />
                                        <ChartLegend
                                            content={
                                                <ChartLegendContent
                                                    nameKey="name"
                                                    className="flex-wrap justify-center gap-3 text-sm"
                                                />
                                            }
                                        />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Top Materials */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Top Materials by Usage</CardTitle>
                                <CardDescription>Most used materials across projects</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{ value: { label: 'Quantity', color: CHART_COLORS.tertiary } }} className="h-[300px]">
                                    <BarChart data={materialData.topMaterials} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" tickLine={false} axisLine={false} />
                                        <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="value" fill={CHART_COLORS.tertiary} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Category Breakdown with Variance */}
                        <Card className="shadow-sm lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg">Category-wise Estimated vs Actual</CardTitle>
                                <CardDescription>Quantity comparison by material category</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{ estimated: { label: 'Estimated', color: CHART_COLORS.muted }, actual: { label: 'Actual', color: CHART_COLORS.primary } }} className="h-[300px]">
                                    <BarChart data={materialData.categoryBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                        <YAxis tickLine={false} axisLine={false} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar dataKey="estimated" fill={CHART_COLORS.muted} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="actual" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
