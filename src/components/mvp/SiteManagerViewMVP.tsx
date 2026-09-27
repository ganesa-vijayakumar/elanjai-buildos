import { useState, useMemo } from 'react'
import { useSites } from '../../hooks/useSites'
import { useExpenses, EXPENSE_CATEGORY_LABELS, COMMON_EXPENSE_ITEMS } from '../../hooks/useExpenses'
import { formatCurrency } from '../../hooks/useDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'
import {
    Wrench,
    MapPin,
    Plus,
    CheckCircle,
    Package,
    CaretRight,
    Clock,
    Warning,
    Cube,
    PencilSimple
} from '@phosphor-icons/react'
import { ExpenseCategory, PaymentMode } from '../../lib/database.types'
import { MaterialSpentType, MATERIAL_SPENT_TYPES } from '../../lib/types'
import { SiteStatus } from '../../lib/database.types'
import { SiteStatusBadge } from '../SiteStatusBadge'
import { useAuth } from '../../hooks/useAuth'

interface SiteManagerViewMVPProps {
    onSiteSelect: (siteId: string) => void
}

export function SiteManagerViewMVP({ onSiteSelect }: SiteManagerViewMVPProps) {
    const { user } = useAuth()
    const { sites, loading } = useSites()
    const { expenses, addExpense, updateExpense } = useExpenses()

    const [showExpenseDialog, setShowExpenseDialog] = useState(false)
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)

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

    // Filter sites to show only Active and Hold statuses
    const assignedSites = useMemo(() => {
        return sites.filter(site => {
            const status = (site.status || 'open') as SiteStatus
            return status === 'open' || status === 'in_progress' || status === 'hold'
        })
    }, [sites])

    // Today's expenses created by this manager only
    const todayStr = new Date().toISOString().split('T')[0]
    const myTodayExpenses = useMemo(() => {
        return expenses.filter(e => {
            const isToday = e.expense_date === todayStr
            const isCreatedByMe = e.created_by === user?.id
            return isToday && isCreatedByMe
        })
    }, [expenses, todayStr, user?.id])

    const handleAddExpense = async () => {
        if (!selectedSiteId) {
            toast.error('Please select a site')
            return
        }
        if (!expenseForm.item_name || !expenseForm.total_amount || Number(expenseForm.total_amount) <= 0) {
            toast.error('Please fill in all required fields')
            return
        }

        const { error } = await addExpense({
            site_id: selectedSiteId,
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
            setSelectedSiteId(null)
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

    const openExpenseDialog = (siteId: string) => {
        setSelectedSiteId(siteId)
        setEditingExpenseId(null)
        setShowExpenseDialog(true)
    }

    // Edit a rejected expense
    const handleEditExpense = (expense: typeof expenses[0]) => {
        setEditingExpenseId(expense.id)
        setSelectedSiteId(expense.site_id)
        setExpenseForm({
            category: expense.category as ExpenseCategory,
            item_name: expense.item_name,
            quantity: expense.quantity?.toString() || '',
            unit: expense.unit || '',
            unit_price: expense.unit_price?.toString() || '',
            total_amount: expense.total_amount.toString(),
            paid_to: expense.paid_to || '',
            payment_mode: expense.payment_mode as PaymentMode,
            expense_date: expense.expense_date,
        })
        setShowExpenseDialog(true)
    }

    // Submit expense (add new or update existing)
    const handleSubmitExpense = async () => {
        if (!selectedSiteId) {
            toast.error('Please select a site')
            return
        }
        if (!expenseForm.item_name || !expenseForm.total_amount || Number(expenseForm.total_amount) <= 0) {
            toast.error('Please fill in all required fields')
            return
        }

        const expenseData = {
            site_id: selectedSiteId,
            category: expenseForm.category,
            item_name: expenseForm.item_name,
            quantity: expenseForm.quantity ? Number(expenseForm.quantity) : undefined,
            unit: expenseForm.unit || undefined,
            unit_price: expenseForm.unit_price ? Number(expenseForm.unit_price) : undefined,
            total_amount: Number(expenseForm.total_amount),
            paid_to: expenseForm.paid_to || undefined,
            payment_mode: expenseForm.payment_mode,
            expense_date: expenseForm.expense_date,
            approval_status: 'pending' as const, // Reset to pending on resubmit
        }

        let error
        if (editingExpenseId) {
            const result = await updateExpense(editingExpenseId, expenseData)
            error = result.error
        } else {
            const result = await addExpense(expenseData)
            error = result.error
        }

        if (error) {
            toast.error(`Failed to ${editingExpenseId ? 'update' : 'add'} expense: ` + error.message)
        } else {
            toast.success(`Expense ${editingExpenseId ? 'resubmitted' : 'added'} successfully!`)
            setShowExpenseDialog(false)
            setSelectedSiteId(null)
            setEditingExpenseId(null)
            resetExpenseForm()
        }
    }

    const resetExpenseForm = () => {
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

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-32 bg-gray-200 rounded-xl"></div>
                <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-blue-600" weight="duotone" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome, {user?.fullName || 'Site Manager'}!
                    </h1>
                    <p className="text-gray-500">Manage expenses for your assigned sites</p>
                </div>
            </div>

            {/* Assigned Sites */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">My Assigned Sites</CardTitle>
                </CardHeader>
                <CardContent>
                    {assignedSites.length === 0 ? (
                        <div className="text-center py-12">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No active sites assigned to you</p>
                            <p className="text-sm text-gray-400 mt-1">Contact the owner for site assignments</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assignedSites.map((site) => (
                                <div
                                    key={site.id}
                                    className="p-4 border rounded-lg hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-gray-900">{site.site_name}</h3>
                                                <SiteStatusBadge status={(site.status || 'open') as SiteStatus} size="sm" />
                                            </div>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                {site.location || 'No location'}
                                            </p>
                                            <Badge variant="outline" className="mt-2 text-xs">
                                                {site.current_stage?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not Started'}
                                            </Badge>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onSiteSelect(site.id)}
                                        >
                                            View <CaretRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                                            onClick={() => openExpenseDialog(site.id)}
                                            disabled={(site.status || 'active') === 'hold'}
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            {(site.status || 'active') === 'hold' ? 'Site on Hold' : 'Add Expense'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* My Today's Entries */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">My Today's Entries</CardTitle>
                    <Badge variant="outline">{myTodayExpenses.length} entries</Badge>
                </CardHeader>
                <CardContent>
                    {myTodayExpenses.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">No entries today</p>
                            <p className="text-sm text-gray-400">Add expenses as they occur</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {myTodayExpenses.map((expense) => {
                                const site = assignedSites.find(s => s.id === expense.site_id)
                                const approvalStatus = expense.approval_status || 'pending'
                                return (
                                    <div
                                        key={expense.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                                <Package className="w-4 h-4 text-orange-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900">{expense.item_name}</p>
                                                    {approvalStatus === 'pending' && (
                                                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                                            <Clock className="w-3 h-3 mr-1" /> Pending
                                                        </Badge>
                                                    )}
                                                    {approvalStatus === 'rejected' && (
                                                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                                            <Warning className="w-3 h-3 mr-1" /> Rejected
                                                        </Badge>
                                                    )}
                                                    {approvalStatus === 'approved' && (
                                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                            <CheckCircle className="w-3 h-3 mr-1" /> Approved
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {site?.site_name || 'Unknown Site'} • {EXPENSE_CATEGORY_LABELS[expense.category]}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {approvalStatus === 'rejected' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs"
                                                    onClick={() => handleEditExpense(expense)}
                                                >
                                                    <PencilSimple className="w-3 h-3 mr-1" />
                                                    Edit & Resubmit
                                                </Button>
                                            )}
                                            <p className="text-orange-600 font-bold">{formatCurrency(expense.total_amount)}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Material Spent Overview (Read-only for Site Manager) */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Cube size={24} weight="fill" className="text-orange-600" />
                        Material Overview
                        <Badge variant="outline" className="ml-auto text-xs font-normal">
                            Read-only
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {MATERIAL_SPENT_TYPES.map(({ type, label, unit }) => (
                            <div
                                key={type}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <span className="text-sm font-medium text-gray-700">{label}</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-xl font-bold text-gray-400">--</span>
                                    <span className="text-xs text-gray-400">{unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3 text-center">
                        Material tracking data is managed by the owner/admin
                    </p>
                </CardContent>
            </Card>

            {/* Add/Edit Expense Dialog */}
            <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingExpenseId ? 'Edit & Resubmit Expense' : 'Add Expense'}
                            {selectedSiteId && (
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    - {sites.find(s => s.id === selectedSiteId)?.site_name}
                                </span>
                            )}
                        </DialogTitle>
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
                        <Button variant="outline" onClick={() => {
                            setShowExpenseDialog(false)
                            setEditingExpenseId(null)
                            resetExpenseForm()
                        }}>Cancel</Button>
                        <Button onClick={handleSubmitExpense} className="bg-orange-600 hover:bg-orange-700">
                            {editingExpenseId ? 'Resubmit for Approval' : 'Add Expense'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
