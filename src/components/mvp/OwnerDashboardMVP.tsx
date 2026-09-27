import { useState, useMemo } from 'react'
import { useDashboard, useSites, formatCurrency, getMarginStatus } from '../../hooks'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'
import {
    Buildings,
    Money,
    TrendUp,
    TrendDown,
    Plus,
    CaretRight,
    WarningCircle,
    CheckCircle,
    Clock
} from '@phosphor-icons/react'
import { PackageName, PACKAGE_RATES } from '../../lib/database.types'
import { SiteStatus } from '../../lib/database.types'
import { SiteStatusBadge } from '../SiteStatusBadge'
import { SiteSearchFilter } from '../SiteSearchFilter'

interface OwnerDashboardMVPProps {
    onSiteSelect: (siteId: string) => void
}

export function OwnerDashboardMVP({ onSiteSelect }: OwnerDashboardMVPProps) {
    const { kpis, loading: kpisLoading } = useDashboard()
    const { sites, loading: sitesLoading, createSite, error: sitesError } = useSites()
    const { role } = useAuth()

    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState({
        site_name: '',
        client_name: '',
        client_phone: '',
        client_email: '',
        location: '',
        builtup_area: '',
        package_name: 'standard' as PackageName,
    })

    const loading = kpisLoading || sitesLoading

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatuses, setSelectedStatuses] = useState<SiteStatus[]>(['open', 'in_progress'])

    // Filter sites based on search query and status filters
    const filteredSites = useMemo(() => {
        return sites.filter(site => {
            // Status filter
            const statusMatch = selectedStatuses.length === 0 ||
                selectedStatuses.includes((site.status || 'open') as SiteStatus)

            // Search filter
            const query = searchQuery.toLowerCase().trim()
            const searchMatch = !query ||
                site.site_name?.toLowerCase().includes(query) ||
                site.client_name?.toLowerCase().includes(query) ||
                site.location?.toLowerCase().includes(query)

            return statusMatch && searchMatch
        })
    }, [sites, searchQuery, selectedStatuses])

    const resetForm = () => {
        setForm({
            site_name: '',
            client_name: '',
            client_phone: '',
            client_email: '',
            location: '',
            builtup_area: '',
            package_name: 'standard',
        })
    }

    const handleCreateSite = async () => {
        if (!form.site_name || !form.client_name) {
            toast.error('Please enter site name and client name')
            return
        }

        setCreating(true)
        try {
            const rate = PACKAGE_RATES[form.package_name]
            const area = Number(form.builtup_area) || 0
            const totalValue = area * rate

            const { error } = await createSite({
                site_name: form.site_name,
                client_name: form.client_name,
                client_phone: form.client_phone || undefined,
                client_email: form.client_email || undefined,
                location: form.location || undefined,
                builtup_area: area || undefined,
                rate_per_sqft: rate,
                package_name: form.package_name,
                total_value: totalValue || undefined,
                current_stage: 'advance',
                status: 'open',
                start_date: new Date().toISOString().split('T')[0],
            })

            if (error) {
                toast.error('Failed to create site: ' + error.message)
            } else {
                toast.success('Site created successfully!')
                setShowCreateDialog(false)
                resetForm()
            }
        } catch (err) {
            toast.error('Failed to create site')
        } finally {
            setCreating(false)
        }
    }

    // Get stage display info
    const getStageInfo = (stage: string | null) => {
        const stages: Record<string, { label: string; progress: number }> = {
            advance: { label: 'Advance', progress: 5 },
            foundation: { label: 'Foundation', progress: 15 },
            plinth: { label: 'Plinth Level', progress: 25 },
            rcc_roof: { label: 'RCC/Roof', progress: 40 },
            brickwork: { label: 'Brickwork', progress: 55 },
            plastering: { label: 'Plastering', progress: 70 },
            electrical_plumbing: { label: 'Electrical & Plumbing', progress: 80 },
            finishing: { label: 'Finishing', progress: 92 },
            handover: { label: 'Handover', progress: 100 },
        }
        return stages[stage || 'advance'] || { label: stage || 'Not Started', progress: 0 }
    }

    // Get margin badge
    const getMarginBadge = (marginPercentage: number) => {
        const { color, status } = getMarginStatus(marginPercentage)
        let Icon = CheckCircle
        let bgColor = 'bg-green-100'

        if (marginPercentage < 0) {
            Icon = WarningCircle
            bgColor = 'bg-red-100'
        } else if (marginPercentage < 10) {
            Icon = Clock
            bgColor = 'bg-yellow-100'
        }

        return (
            <Badge className={`${bgColor} ${color} gap-1`}>
                <Icon className="w-3 h-3" weight="bold" />
                {marginPercentage.toFixed(1)}%
            </Badge>
        )
    }

    // Calculate preview total
    const previewRate = PACKAGE_RATES[form.package_name]
    const previewTotal = form.builtup_area ? Number(form.builtup_area) * previewRate : 0

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>
                    ))}
                </div>
                <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
        )
    }

    // Show error state if sites failed to load
    if (sitesError) {
        return (
            <div className="text-center py-12">
                <WarningCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-gray-600">Error loading sites</p>
                <p className="text-sm text-gray-400 mt-1">{sitesError.message}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Sites */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Active Sites</p>
                                <p className="text-3xl font-bold text-gray-900">{kpis?.active_sites || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Buildings className="w-6 h-6 text-blue-600" weight="duotone" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            {kpis?.completed_sites || 0} completed
                        </p>
                    </CardContent>
                </Card>

                {/* Total Collections */}
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Collections</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(kpis?.total_collections || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendUp className="w-6 h-6 text-green-600" weight="duotone" />
                            </div>
                        </div>
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <TrendUp className="w-3 h-3" />
                            All time received
                        </p>
                    </CardContent>
                </Card>

                {/* Total Expenses */}
                <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(kpis?.total_expenses || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <TrendDown className="w-6 h-6 text-orange-600" weight="duotone" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            All time spent
                        </p>
                    </CardContent>
                </Card>

                {/* Net Profit - only visible to owner */}
                {role === 'owner' && (
                    <Card className={`border-l-4 ${(kpis?.net_profit || 0) >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Net Profit</p>
                                    <p className={`text-3xl font-bold ${(kpis?.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {formatCurrency(kpis?.net_profit || 0)}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${(kpis?.net_profit || 0) >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                    <Money className={`w-6 h-6 ${(kpis?.net_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`} weight="duotone" />
                                </div>
                            </div>
                            <p className={`text-xs mt-2 font-medium ${(kpis?.profit_margin_percentage || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {kpis?.profit_margin_percentage?.toFixed(1) || 0}% margin
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Sites List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg font-semibold">All Sites</CardTitle>
                    <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => setShowCreateDialog(true)}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        New Site
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Search and Filter */}
                    <div className="mb-4">
                        <SiteSearchFilter
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            selectedStatuses={selectedStatuses}
                            onStatusFilterChange={setSelectedStatuses}
                            resultCount={filteredSites.length}
                        />
                    </div>

                    {filteredSites.length === 0 && sites.length > 0 ? (
                        <div className="text-center py-12">
                            <Buildings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No sites match your filters</p>
                            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or status filters</p>
                            <Button
                                variant="outline"
                                onClick={() => { setSearchQuery(''); setSelectedStatuses(['open', 'in_progress']); }}
                                className="mt-4"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    ) : sites.length === 0 ? (
                        <div className="text-center py-12">
                            <Buildings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No sites yet</p>
                            <p className="text-sm text-gray-400 mt-1">Create your first site to get started</p>
                            <Button
                                onClick={() => setShowCreateDialog(true)}
                                className="mt-4 bg-red-600 hover:bg-red-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Site
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredSites.map((site) => {
                                const stageInfo = getStageInfo(site.current_stage)
                                return (
                                    <div
                                        key={site.id}
                                        onClick={() => onSiteSelect(site.id)}
                                        className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors border border-gray-100 hover:border-gray-200"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-gray-900">{site.site_name}</h3>
                                                    <SiteStatusBadge
                                                        status={(site.status || 'open') as SiteStatus}
                                                        size="sm"
                                                        showIcon={false}
                                                    />
                                                </div>
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {site.client_name} • {site.location || 'No location'}
                                                </p>

                                                {/* Progress bar */}
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-gray-500">{stageInfo.label}</span>
                                                        <span className="font-medium text-gray-700">{stageInfo.progress}%</span>
                                                    </div>
                                                    <Progress value={stageInfo.progress} className="h-1.5" />
                                                </div>
                                            </div>

                                            {/* Financial summary */}
                                            <div className="text-right ml-4 flex-shrink-0">
                                                <div className="flex items-center gap-2 justify-end">
                                                    {role === 'owner' && getMarginBadge(site.margin_percentage)}
                                                    <CaretRight className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <div className="mt-2 text-sm">
                                                    <p className="text-gray-500">
                                                        <span className="text-green-600 font-medium">
                                                            +{formatCurrency(site.total_collections)}
                                                        </span>
                                                    </p>
                                                    <p className="text-gray-500">
                                                        <span className="text-orange-600 font-medium">
                                                            -{formatCurrency(site.total_expenses)}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Cash Flow Alert - only for owner */}
            {role === 'owner' && sites.some(s => s.margin_percentage < 0) && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            <WarningCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" weight="fill" />
                            <div>
                                <h4 className="font-medium text-red-800">Cash Flow Alert</h4>
                                <p className="text-sm text-red-700 mt-1">
                                    {sites.filter(s => s.margin_percentage < 0).length} site(s) are running over budget.
                                    Review expenses to avoid losses.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create Site Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create New Site</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Site Name *</Label>
                            <Input
                                placeholder="Villa Anjalai - RS Puram"
                                value={form.site_name}
                                onChange={(e) => setForm({ ...form, site_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Client Name *</Label>
                            <Input
                                placeholder="Mr. Ravi Kumar"
                                value={form.client_name}
                                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    placeholder="+91 98765 43210"
                                    value={form.client_phone}
                                    onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    placeholder="client@email.com"
                                    value={form.client_email}
                                    onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Location</Label>
                            <Input
                                placeholder="RS Puram, Coimbatore"
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Built-up Area (sq.ft)</Label>
                                <Input
                                    type="number"
                                    placeholder="1200"
                                    value={form.builtup_area}
                                    onChange={(e) => setForm({ ...form, builtup_area: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Package</Label>
                                <Select
                                    value={form.package_name}
                                    onValueChange={(v) => setForm({ ...form, package_name: v as PackageName })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="economy">Economy - ₹1500/sqft</SelectItem>
                                        <SelectItem value="standard">Standard - ₹1650/sqft</SelectItem>
                                        <SelectItem value="premium">Premium - ₹1800/sqft</SelectItem>
                                        <SelectItem value="luxury">Luxury - ₹2100/sqft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Live Preview */}
                        {form.builtup_area && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-2">Estimated Value</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                        {form.builtup_area} sq.ft × ₹{previewRate}/sqft
                                    </span>
                                    <span className="text-xl font-bold text-gray-900">
                                        ₹{previewTotal.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSite}
                            disabled={creating}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {creating ? 'Creating...' : 'Create Site'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
