import { useState } from 'react'
import { useSiteDetails, useSites } from '../../hooks/useSites'
import { useUsers } from '../../hooks/useUsers'
import { useAuth } from '../../hooks/useAuth'
import { useCollections, useCollectionsByStage } from '../../hooks/useCollections'
import { useExpenses, useExpensesByCategory, EXPENSE_CATEGORY_LABELS } from '../../hooks/useExpenses'
import { ExpenseApprovalStatus } from '../../lib/database.types'
import { formatCurrency, formatFullCurrency, getMarginStatus } from '../../hooks/useDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { toast } from 'sonner'
import {
    ArrowLeft,
    Plus,
    Money,
    TrendUp,
    TrendDown,
    Calendar,
    User,
    MapPin,
    Package,
    Clock,
    PencilSimple,
    UsersThree,
    CheckCircle
} from '@phosphor-icons/react'
import { ConstructionStage, PaymentMode, ExpenseCategory, DEFAULT_STAGES } from '../../lib/database.types'
import { SiteStatus } from '../../lib/database.types'
import { SiteStatusBadge, SiteStatusActions } from '../SiteStatusBadge'
import { MaterialSpentSection } from '../MaterialSpentSection'
import { EstimatedMaterialExpenseWidget } from '../EstimatedMaterialExpenseWidget'

interface SiteDetailMVPProps {
    siteId: string
    onBack: () => void
}

export function SiteDetailMVP({ siteId, onBack }: SiteDetailMVPProps) {
    const { site, loading: siteLoading, refetch: refetchSite } = useSiteDetails(siteId)
    const { updateSite } = useSites()
    const { user, role } = useAuth()
    const { clients, siteManagers } = useUsers()
    const { collections, totalCollections, addCollection } = useCollections(siteId)
    const { collectionsByStage } = useCollectionsByStage(siteId)
    const { expenses, totalExpenses, addExpense, updateExpense } = useExpenses(siteId)
    const { expensesByCategory } = useExpensesByCategory(siteId)

    // For site managers, only show their own expenses
    const displayExpenses = role === 'site_manager' && user
        ? expenses.filter(e => e.created_by === user.id)
        : expenses

    const [showCollectionDialog, setShowCollectionDialog] = useState(false)
    const [showExpenseDialog, setShowExpenseDialog] = useState(false)
    const [showEditSiteDialog, setShowEditSiteDialog] = useState(false)
    const [editSiteForm, setEditSiteForm] = useState({
        client_user_id: '',
        managerIds: [] as string[],
    })
    const [savingSite, setSavingSite] = useState(false)

    // Collection form state
    const [collectionForm, setCollectionForm] = useState({
        amount: '',
        stage: '' as ConstructionStage | '',
        payment_mode: 'upi' as PaymentMode,
        reference_number: '',
        notes: '',
        received_date: new Date().toISOString().split('T')[0],
    })

    // Expense form state
    const [expenseForm, setExpenseForm] = useState({
        category: 'materials' as ExpenseCategory,
        item_name: '',
        quantity: '',
        unit: '',
        unit_price: '',
        total_amount: '',
        paid_to: '',
        payment_mode: 'cash' as PaymentMode,
        expense_date: new Date().toISOString().split('T')[0],
    })

    // Handle site status change
    const handleStatusChange = async (newStatus: SiteStatus) => {
        const { error } = await updateSite(siteId, { status: newStatus })
        if (error) {
            toast.error('Failed to update status: ' + error.message)
        } else {
            toast.success(`Site status changed to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`)
            refetchSite()
        }
    }

    // Handle opening the edit site dialog
    const openEditSiteDialog = () => {
        setEditSiteForm({
            client_user_id: site?.client_user_id || '',
            managerIds: [],
        })
        setShowEditSiteDialog(true)
    }

    // Handle saving site edits (client and manager assignment)
    const handleSaveSiteEdit = async () => {
        setSavingSite(true)
        try {
            const updates: any = {}
            if (editSiteForm.client_user_id) {
                updates.client_user_id = editSiteForm.client_user_id
            }
            const { error } = await updateSite(siteId, updates)
            if (error) {
                toast.error('Failed to update site: ' + error.message)
            } else {
                toast.success('Site updated successfully!')
                setShowEditSiteDialog(false)
                refetchSite()
            }
        } finally {
            setSavingSite(false)
        }
    }

    const toggleManagerSelection = (managerId: string) => {
        setEditSiteForm(prev => ({
            ...prev,
            managerIds: prev.managerIds.includes(managerId)
                ? prev.managerIds.filter(id => id !== managerId)
                : [...prev.managerIds, managerId]
        }))
    }

    // Calculate estimated material expense
    const estimatedMaterialExpense = site?.estimated_material_expense || 0

    // Updated margin calculation: Collections - (Expenses + Estimated Material Expense)
    const totalCosts = totalExpenses + estimatedMaterialExpense
    const margin = totalCollections - totalCosts
    const marginPercentage = totalCollections > 0 ? (margin / totalCollections) * 100 : 0
    const { color: marginColor, status: marginStatus } = getMarginStatus(marginPercentage)

    const handleAddCollection = async () => {
        if (!collectionForm.amount || Number(collectionForm.amount) <= 0) {
            toast.error('Please enter a valid amount')
            return
        }

        const { error } = await addCollection({
            site_id: siteId,
            amount: Number(collectionForm.amount),
            stage: collectionForm.stage as ConstructionStage || undefined,
            payment_mode: collectionForm.payment_mode,
            reference_number: collectionForm.reference_number || undefined,
            notes: collectionForm.notes || undefined,
            received_date: collectionForm.received_date,
        })

        if (error) {
            toast.error('Failed to add collection: ' + error.message)
        } else {
            toast.success('Collection added successfully!')
            setShowCollectionDialog(false)
            setCollectionForm({
                amount: '',
                stage: '',
                payment_mode: 'upi',
                reference_number: '',
                notes: '',
                received_date: new Date().toISOString().split('T')[0],
            })
        }
    }

    const handleAddExpense = async () => {
        if (!expenseForm.item_name || !expenseForm.total_amount || Number(expenseForm.total_amount) <= 0) {
            toast.error('Please fill in all required fields')
            return
        }

        const { error } = await addExpense({
            site_id: siteId,
            category: expenseForm.category,
            item_name: expenseForm.item_name,
            quantity: expenseForm.quantity ? Number(expenseForm.quantity) : undefined,
            unit: expenseForm.unit || undefined,
            unit_price: expenseForm.unit_price ? Number(expenseForm.unit_price) : undefined,
            total_amount: Number(expenseForm.total_amount),
            paid_to: expenseForm.paid_to || undefined,
            payment_mode: expenseForm.payment_mode,
            expense_date: expenseForm.expense_date,
        })

        if (error) {
            toast.error('Failed to add expense: ' + error.message)
        } else {
            toast.success('Expense added successfully!')
            setShowExpenseDialog(false)
            setExpenseForm({
                category: 'materials',
                item_name: '',
                quantity: '',
                unit: '',
                unit_price: '',
                total_amount: '',
                paid_to: '',
                payment_mode: 'cash',
                expense_date: new Date().toISOString().split('T')[0],
            })
        }
    }

    if (siteLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 w-32 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded-xl"></div>
                <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
        )
    }

    if (!site) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Site not found</p>
                <Button onClick={onBack} variant="outline" className="mt-4">
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">{site.site_name}</h1>
                            <SiteStatusBadge status={(site.status || 'open') as SiteStatus} />
                        </div>
                        <p className="text-gray-500">{site.client_name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {(role === 'owner' || role === 'admin') && (
                        <Button variant="outline" size="sm" onClick={openEditSiteDialog}>
                            <PencilSimple className="w-4 h-4 mr-1" />
                            Edit Site
                        </Button>
                    )}
                    <SiteStatusActions
                        currentStatus={(site.status || 'open') as SiteStatus}
                        onStatusChange={handleStatusChange}
                    />
                </div>
            </div>

            {/* Site Info */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Client</p>
                                <p className="font-medium text-sm">{site.client_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Location</p>
                                <p className="font-medium text-sm">{site.location || 'Not specified'}</p>
                            </div>
                        </div>
                        {role !== 'site_manager' && (
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Total Value</p>
                                    <p className="font-medium text-sm">{formatFullCurrency(site.total_value || 0)}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Start Date</p>
                                <p className="font-medium text-sm">
                                    {site.start_date ? new Date(site.start_date).toLocaleDateString('en-IN') : 'Not set'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Expected Completion</p>
                                <p className="font-medium text-sm">
                                    {site.expected_end_date
                                        ? new Date(site.expected_end_date).toLocaleDateString('en-IN')
                                        : 'Not set'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Financial Summary */}
            {role !== 'site_manager' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Collections</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollections)}</p>
                                </div>
                                <TrendUp className="w-8 h-8 text-green-200" weight="duotone" />
                            </div>
                            {(role === 'owner' || role === 'admin') && (
                                <Button
                                    size="sm"
                                    className="mt-3 w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => setShowCollectionDialog(true)}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Collection
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Expenses</p>
                                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalExpenses)}</p>
                                </div>
                                <TrendDown className="w-8 h-8 text-orange-200" weight="duotone" />
                            </div>
                            <Button
                                size="sm"
                                className="mt-3 w-full bg-orange-600 hover:bg-orange-700"
                                onClick={() => setShowExpenseDialog(true)}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Expense
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Estimated Material Expense Widget */}
                    <EstimatedMaterialExpenseWidget
                        value={estimatedMaterialExpense}
                        onUpdate={async (value) => {
                            const { error } = await updateSite(siteId, { estimated_material_expense: value })
                            if (error) throw error
                            refetchSite()
                        }}
                        currentRole={role}
                    />
                </div>
            )}

            {/* Margin Card - only visible to owner */}
            {role === 'owner' && (
                <Card className={`border-l-4 ${margin >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Net Margin</p>
                                <p className={`text-2xl font-bold ${marginColor}`}>{formatCurrency(margin)}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Collections ({formatCurrency(totalCollections)}) - Expenses ({formatCurrency(totalExpenses)}) - Est. Materials ({formatCurrency(estimatedMaterialExpense)})
                                </p>
                            </div>
                            <Money className={`w-8 h-8 ${margin >= 0 ? 'text-emerald-200' : 'text-red-200'}`} weight="duotone" />
                        </div>
                        <div className="mt-3">
                            <Badge className={`${margin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {marginPercentage.toFixed(1)}% • {marginStatus}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Material Spent Section */}
            <MaterialSpentSection
                siteId={siteId}
                materials={[]}
                onUpdateMaterial={(materialType, quantity) => {
                    console.log('Update material', materialType, quantity)
                }}
                currentRole={role}
            />

            {/* Stage-wise Progress */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Stage-wise Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {DEFAULT_STAGES.map((stage) => {
                            const stageCollections = collectionsByStage[stage.stage]?.total || 0
                            const expectedAmount = site.total_value ? (stage.percentage / 100) * site.total_value : 0
                            const progress = expectedAmount > 0 ? (stageCollections / expectedAmount) * 100 : 0

                            return (
                                <div key={stage.stage} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700 font-medium">{stage.label}</span>
                                        <div className="text-right">
                                            <span className="text-gray-900 font-medium">{formatCurrency(stageCollections)}</span>
                                            <span className="text-gray-400 mx-1">/</span>
                                            <span className="text-gray-500">{formatCurrency(expectedAmount)}</span>
                                        </div>
                                    </div>
                                    <Progress value={Math.min(progress, 100)} className="h-2" />
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={role === 'site_manager' ? 'expenses' : 'collections'}>
                        <TabsList className={`grid w-full mb-4 ${role === 'site_manager' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {role !== 'site_manager' && (
                                <TabsTrigger value="collections">Collections ({collections.length})</TabsTrigger>
                            )}
                            <TabsTrigger value="expenses">Expenses ({displayExpenses.length})</TabsTrigger>
                        </TabsList>

                        {role !== 'site_manager' && (
                            <TabsContent value="collections">
                                {collections.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No collections yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {collections.slice(0, 10).map((collection) => (
                                            <div
                                                key={collection.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {collection.stage ? DEFAULT_STAGES.find(s => s.stage === collection.stage)?.label : 'General'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(collection.received_date).toLocaleDateString('en-IN')} • {collection.payment_mode?.toUpperCase()}
                                                    </p>
                                                </div>
                                                <p className="text-green-600 font-bold">+{formatCurrency(collection.amount)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        )}

                        <TabsContent value="expenses">
                            {displayExpenses.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No expenses yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {displayExpenses.slice(0, 10).map((expense) => (
                                        <div
                                            key={expense.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900">{expense.item_name}</p>
                                                    {expense.approval_status && (
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-xs ${
                                                                expense.approval_status === 'approved'
                                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                                    : expense.approval_status === 'rejected'
                                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                            }`}
                                                        >
                                                            {expense.approval_status === 'approved' ? '✓ Approved'
                                                                : expense.approval_status === 'rejected' ? '✗ Rejected'
                                                                : '⏳ Pending'}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {EXPENSE_CATEGORY_LABELS[expense.category]} • {new Date(expense.expense_date).toLocaleDateString('en-IN')}
                                                </p>
                                                {expense.approval_status === 'rejected' && expense.rejection_reason && (
                                                    <p className="text-xs text-red-500 mt-1">Reason: {expense.rejection_reason}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {(role === 'owner' || role === 'admin') && expense.approval_status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs text-green-600 border-green-200 hover:bg-green-50"
                                                            onClick={async (e) => {
                                                                e.stopPropagation()
                                                                const { error } = await updateExpense(expense.id, { approval_status: 'approved' as ExpenseApprovalStatus })
                                                                if (error) toast.error('Failed to approve')
                                                                else toast.success('Expense approved')
                                                            }}
                                                        >
                                                            ✓
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                            onClick={async (e) => {
                                                                e.stopPropagation()
                                                                const reason = prompt('Rejection reason:')
                                                                if (reason !== null) {
                                                                    const { error } = await updateExpense(expense.id, {
                                                                        approval_status: 'rejected' as ExpenseApprovalStatus,
                                                                        rejection_reason: reason || 'Rejected'
                                                                    })
                                                                    if (error) toast.error('Failed to reject')
                                                                    else toast.success('Expense rejected')
                                                                }
                                                            }}
                                                        >
                                                            ✗
                                                        </Button>
                                                    </>
                                                )}
                                                <p className="text-orange-600 font-bold">-{formatCurrency(expense.total_amount)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Add Collection Dialog */}
            <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Collection</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Amount (₹) *</Label>
                            <Input
                                type="number"
                                placeholder="50000"
                                value={collectionForm.amount}
                                onChange={(e) => setCollectionForm({ ...collectionForm, amount: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Stage</Label>
                            <Select
                                value={collectionForm.stage}
                                onValueChange={(v) => setCollectionForm({ ...collectionForm, stage: v as ConstructionStage })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select stage" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEFAULT_STAGES.map((stage) => (
                                        <SelectItem key={stage.stage} value={stage.stage}>
                                            {stage.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Payment Mode</Label>
                            <Select
                                value={collectionForm.payment_mode}
                                onValueChange={(v) => setCollectionForm({ ...collectionForm, payment_mode: v as PaymentMode })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Reference Number</Label>
                            <Input
                                placeholder="Transaction ID"
                                value={collectionForm.reference_number}
                                onChange={(e) => setCollectionForm({ ...collectionForm, reference_number: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={collectionForm.received_date}
                                onChange={(e) => setCollectionForm({ ...collectionForm, received_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Textarea
                                placeholder="Optional notes..."
                                value={collectionForm.notes}
                                onChange={(e) => setCollectionForm({ ...collectionForm, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCollectionDialog(false)}>Cancel</Button>
                        <Button onClick={handleAddCollection} className="bg-green-600 hover:bg-green-700">
                            Add Collection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Expense Dialog */}
            <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Category *</Label>
                            <Select
                                value={expenseForm.category}
                                onValueChange={(v) => {
                                    const newCategory = v as ExpenseCategory
                                    setExpenseForm({
                                        ...expenseForm,
                                        category: newCategory,
                                        item_name: '',
                                        quantity: '',
                                        unit: '',
                                        unit_price: '',
                                        total_amount: '',
                                    })
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* === Materials: Item Name + Qty + Unit + Rate === */}
                        {expenseForm.category === 'materials' && (
                            <>
                                <div>
                                    <Label>Item Name *</Label>
                                    <Input
                                        placeholder="e.g. Cement, Steel, Sand"
                                        value={expenseForm.item_name}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, item_name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <Label>Quantity</Label>
                                        <Input
                                            type="number"
                                            placeholder="20"
                                            value={expenseForm.quantity}
                                            onChange={(e) => {
                                                const qty = e.target.value
                                                const rate = expenseForm.unit_price
                                                setExpenseForm({
                                                    ...expenseForm,
                                                    quantity: qty,
                                                    total_amount: qty && rate ? String(Number(qty) * Number(rate)) : expenseForm.total_amount,
                                                })
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <Label>Unit</Label>
                                        <Input placeholder="bags / tons / rods" value={expenseForm.unit} onChange={(e) => setExpenseForm({ ...expenseForm, unit: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Rate (₹)</Label>
                                        <Input
                                            type="number"
                                            placeholder="380"
                                            value={expenseForm.unit_price}
                                            onChange={(e) => {
                                                const rate = e.target.value
                                                const qty = expenseForm.quantity
                                                setExpenseForm({
                                                    ...expenseForm,
                                                    unit_price: rate,
                                                    total_amount: qty && rate ? String(Number(qty) * Number(rate)) : expenseForm.total_amount,
                                                })
                                            }}
                                        />
                                    </div>
                                </div>
                                {expenseForm.quantity && expenseForm.unit_price && (
                                    <p className="text-xs text-blue-600 -mt-2">
                                        {expenseForm.quantity} × ₹{Number(expenseForm.unit_price).toLocaleString('en-IN')} = ₹{(Number(expenseForm.quantity) * Number(expenseForm.unit_price)).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </>
                        )}

                        {/* === Labor: Worker Type + No. of Workers + Daily Wage === */}
                        {expenseForm.category === 'labor' && (
                            <>
                                <div>
                                    <Label>Worker Type *</Label>
                                    <Input
                                        placeholder="e.g. Mason, Helper, Carpenter"
                                        value={expenseForm.item_name}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, item_name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label>No. of Workers</Label>
                                        <Input
                                            type="number"
                                            placeholder="5"
                                            value={expenseForm.quantity}
                                            onChange={(e) => {
                                                const workers = e.target.value
                                                const wage = expenseForm.unit_price
                                                setExpenseForm({
                                                    ...expenseForm,
                                                    quantity: workers,
                                                    unit: 'workers',
                                                    total_amount: workers && wage ? String(Number(workers) * Number(wage)) : expenseForm.total_amount,
                                                })
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <Label>Daily Wage (₹)</Label>
                                        <Input
                                            type="number"
                                            placeholder="800"
                                            value={expenseForm.unit_price}
                                            onChange={(e) => {
                                                const wage = e.target.value
                                                const workers = expenseForm.quantity
                                                setExpenseForm({
                                                    ...expenseForm,
                                                    unit_price: wage,
                                                    total_amount: workers && wage ? String(Number(workers) * Number(wage)) : expenseForm.total_amount,
                                                })
                                            }}
                                        />
                                    </div>
                                </div>
                                {expenseForm.quantity && expenseForm.unit_price && (
                                    <p className="text-xs text-blue-600 -mt-2">
                                        {expenseForm.quantity} workers × ₹{Number(expenseForm.unit_price).toLocaleString('en-IN')} = ₹{(Number(expenseForm.quantity) * Number(expenseForm.unit_price)).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </>
                        )}

                        {/* === Transport: Details + Trips + Per Trip Cost === */}
                        {expenseForm.category === 'transport' && (
                            <>
                                <div>
                                    <Label>Details *</Label>
                                    <Input
                                        placeholder="e.g. Sand Delivery, Steel Delivery"
                                        value={expenseForm.item_name}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, item_name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label>No. of Trips</Label>
                                        <Input
                                            type="number"
                                            placeholder="3"
                                            value={expenseForm.quantity}
                                            onChange={(e) => {
                                                const trips = e.target.value
                                                const costPerTrip = expenseForm.unit_price
                                                setExpenseForm({
                                                    ...expenseForm,
                                                    quantity: trips,
                                                    unit: 'trips',
                                                    total_amount: trips && costPerTrip ? String(Number(trips) * Number(costPerTrip)) : expenseForm.total_amount,
                                                })
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <Label>Cost per Trip (₹)</Label>
                                        <Input
                                            type="number"
                                            placeholder="2000"
                                            value={expenseForm.unit_price}
                                            onChange={(e) => {
                                                const costPerTrip = e.target.value
                                                const trips = expenseForm.quantity
                                                setExpenseForm({
                                                    ...expenseForm,
                                                    unit_price: costPerTrip,
                                                    total_amount: trips && costPerTrip ? String(Number(trips) * Number(costPerTrip)) : expenseForm.total_amount,
                                                })
                                            }}
                                        />
                                    </div>
                                </div>
                                {expenseForm.quantity && expenseForm.unit_price && (
                                    <p className="text-xs text-blue-600 -mt-2">
                                        {expenseForm.quantity} trips × ₹{Number(expenseForm.unit_price).toLocaleString('en-IN')} = ₹{(Number(expenseForm.quantity) * Number(expenseForm.unit_price)).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </>
                        )}

                        {/* === Contractor: Work Description only === */}
                        {expenseForm.category === 'contractor' && (
                            <div>
                                <Label>Work Description *</Label>
                                <Input
                                    placeholder="e.g. Foundation Work, RCC Work, Plastering"
                                    value={expenseForm.item_name}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, item_name: e.target.value })}
                                />
                            </div>
                        )}

                        {/* === Petty Cash: Details only === */}
                        {expenseForm.category === 'petty_cash' && (
                            <div>
                                <Label>Details *</Label>
                                <Input
                                    placeholder="e.g. Tea & Snacks, Minor Tools"
                                    value={expenseForm.item_name}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, item_name: e.target.value })}
                                />
                            </div>
                        )}

                        <div>
                            <Label>Total Amount (₹) *</Label>
                            <Input
                                type="number"
                                placeholder={expenseForm.category === 'contractor' ? '50000' : expenseForm.category === 'petty_cash' ? '500' : '7600'}
                                value={expenseForm.total_amount}
                                onChange={(e) => setExpenseForm({ ...expenseForm, total_amount: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Paid To</Label>
                            <Input
                                placeholder="Supplier name"
                                value={expenseForm.paid_to}
                                onChange={(e) => setExpenseForm({ ...expenseForm, paid_to: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label>Payment Mode</Label>
                                <Select
                                    value={expenseForm.payment_mode}
                                    onValueChange={(v) => setExpenseForm({ ...expenseForm, payment_mode: v as PaymentMode })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="upi">UPI</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={expenseForm.expense_date}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>Cancel</Button>
                        <Button onClick={handleAddExpense} className="bg-orange-600 hover:bg-orange-700">
                            Add Expense
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Site Dialog */}
            <Dialog open={showEditSiteDialog} onOpenChange={setShowEditSiteDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Site</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        {/* Client User Selection */}
                        <div>
                            <Label className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Assign Client User
                            </Label>
                            <p className="text-xs text-gray-500 mb-2">
                                The client user will be able to view their site progress
                            </p>
                            <Select
                                value={editSiteForm.client_user_id}
                                onValueChange={(v) => setEditSiteForm({ ...editSiteForm, client_user_id: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.length === 0 ? (
                                        <SelectItem value="" disabled>No clients available</SelectItem>
                                    ) : (
                                        clients.map(client => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.full_name || client.phone || 'Unnamed Client'}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Site Manager Selection */}
                        <div>
                            <Label className="flex items-center gap-2">
                                <UsersThree className="w-4 h-4" />
                                Assign Site Managers
                            </Label>
                            <p className="text-xs text-gray-500 mb-2">
                                Site managers can add expenses and update progress
                            </p>
                            {siteManagers.length === 0 ? (
                                <p className="text-sm text-gray-400 p-3 bg-gray-50 rounded">
                                    No site managers available.
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {siteManagers.map(manager => {
                                        const isSelected = editSiteForm.managerIds.includes(manager.id)
                                        return (
                                            <button
                                                key={manager.id}
                                                type="button"
                                                onClick={() => toggleManagerSelection(manager.id)}
                                                className={`flex items-center justify-between w-full p-3 rounded-lg border transition-colors text-left ${isSelected
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <span className="font-medium text-gray-900">
                                                    {manager.full_name || manager.phone || 'Unnamed Manager'}
                                                </span>
                                                {isSelected && (
                                                    <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditSiteDialog(false)}>Cancel</Button>
                        <Button onClick={handleSaveSiteEdit} disabled={savingSite}>
                            {savingSite ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
