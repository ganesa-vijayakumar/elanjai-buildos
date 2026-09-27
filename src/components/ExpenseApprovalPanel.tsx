import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    ExpenseApprovalStatus,
    EXPENSE_APPROVAL_STATUS_LABELS
} from '@/lib/types'
import {
    Check,
    X,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Receipt
} from '@phosphor-icons/react'
import { format } from 'date-fns'

interface PendingExpense {
    id: string
    siteId: string
    siteName: string
    category: string
    itemName: string
    quantity?: number
    unit?: string
    totalAmount: number
    expenseDate: string
    createdBy: string
    createdByName?: string
    approvalStatus: ExpenseApprovalStatus
    billImageUrl?: string
}

interface ExpenseApprovalPanelProps {
    expenses: PendingExpense[]
    onApprove: (expenseId: string) => void
    onReject: (expenseId: string, reason: string) => void
    isLoading?: boolean
}

export function ExpenseApprovalPanel({
    expenses,
    onApprove,
    onReject,
    isLoading = false
}: ExpenseApprovalPanelProps) {
    const [selectedExpense, setSelectedExpense] = useState<PendingExpense | null>(null)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState('')

    const pendingExpenses = expenses.filter(e => e.approvalStatus === 'pending')
    const approvedExpenses = expenses.filter(e => e.approvalStatus === 'approved')
    const rejectedExpenses = expenses.filter(e => e.approvalStatus === 'rejected')

    const handleRejectClick = (expense: PendingExpense) => {
        setSelectedExpense(expense)
        setRejectDialogOpen(true)
    }

    const handleRejectConfirm = () => {
        if (selectedExpense && rejectReason.trim()) {
            onReject(selectedExpense.id, rejectReason.trim())
            setRejectDialogOpen(false)
            setRejectReason('')
            setSelectedExpense(null)
        }
    }

    const getStatusBadge = (status: ExpenseApprovalStatus) => {
        switch (status) {
            case 'pending':
                return (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                        <Clock size={12} className="mr-1" />
                        {EXPENSE_APPROVAL_STATUS_LABELS[status]}
                    </Badge>
                )
            case 'approved':
                return (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                        <CheckCircle size={12} weight="fill" className="mr-1" />
                        {EXPENSE_APPROVAL_STATUS_LABELS[status]}
                    </Badge>
                )
            case 'rejected':
                return (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                        <XCircle size={12} weight="fill" className="mr-1" />
                        {EXPENSE_APPROVAL_STATUS_LABELS[status]}
                    </Badge>
                )
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Receipt size={24} weight="fill" className="text-orange-600" />
                            Expense Approvals
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="bg-amber-50">
                                {pendingExpenses.length} Pending
                            </Badge>
                            <Badge variant="outline" className="bg-emerald-50">
                                {approvedExpenses.length} Approved
                            </Badge>
                            <Badge variant="outline" className="bg-red-50">
                                {rejectedExpenses.length} Rejected
                            </Badge>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {pendingExpenses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle size={48} className="mx-auto mb-2 text-emerald-400" />
                            <p className="font-medium">All caught up!</p>
                            <p className="text-sm">No pending expenses to approve</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Site</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Submitted By</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingExpenses.map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell className="font-medium">{expense.siteName}</TableCell>
                                            <TableCell className="capitalize">{expense.category}</TableCell>
                                            <TableCell>
                                                {expense.itemName}
                                                {expense.quantity && expense.unit && (
                                                    <span className="text-gray-500 text-sm ml-1">
                                                        ({expense.quantity} {expense.unit})
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(expense.totalAmount)}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {format(new Date(expense.expenseDate), 'dd MMM yyyy')}
                                            </TableCell>
                                            <TableCell>{expense.createdByName || expense.createdBy}</TableCell>
                                            <TableCell>{getStatusBadge(expense.approvalStatus)}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    {expense.billImageUrl && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8"
                                                            onClick={() => window.open(expense.billImageUrl, '_blank')}
                                                            title="View Bill"
                                                        >
                                                            <Eye size={16} />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                        onClick={() => onApprove(expense.id)}
                                                        disabled={isLoading}
                                                        title="Approve"
                                                    >
                                                        <Check size={18} weight="bold" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleRejectClick(expense)}
                                                        disabled={isLoading}
                                                        title="Reject"
                                                    >
                                                        <X size={18} weight="bold" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedExpense && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="font-medium">{selectedExpense.itemName}</p>
                                <p className="text-sm text-gray-600">
                                    {formatCurrency(selectedExpense.totalAmount)} • {selectedExpense.siteName}
                                </p>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Rejection Reason <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectConfirm}
                            disabled={!rejectReason.trim()}
                        >
                            Reject Expense
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
