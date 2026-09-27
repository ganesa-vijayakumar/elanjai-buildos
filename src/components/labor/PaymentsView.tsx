import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Worker, PaymentSummary, Advance, DailyAttendance, WorkerPayment } from '@/lib/types'
import { Plus, CheckCircle, Clock, Money } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

interface PaymentsViewProps {
  workers: Worker[]
  payments: PaymentSummary[]
  advances: Advance[]
  attendance: DailyAttendance[]
  onUpdatePayments: (payments: PaymentSummary[]) => void
  onUpdateAdvances: (advances: Advance[]) => void
}

export function PaymentsView({ workers, payments, advances, attendance, onUpdatePayments, onUpdateAdvances }: PaymentsViewProps) {
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentSummary | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleGeneratePayment = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

    const workerPayments: WorkerPayment[] = workers
      .filter(w => w.status === 'active')
      .map(worker => {
        let daysWorked = 0
        let grossWage = 0

        daysOfWeek.forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const dayAttendance = attendance.find(a => a.date === dateStr)
          const record = dayAttendance?.records.find(r => r.workerId === worker.id)

          if (record) {
            if (record.status === 'present') {
              daysWorked += 1
              grossWage += worker.dailyWage
            } else if (record.status === 'half-day') {
              daysWorked += 0.5
              grossWage += worker.dailyWage * 0.5
            }
          }
        })

        const advanceDeduction = worker.advanceBalance
        const netPayable = grossWage - advanceDeduction

        return {
          workerId: worker.id,
          name: worker.name,
          daysWorked,
          grossWage,
          advanceDeduction,
          netPayable,
        }
      })
      .filter(wp => wp.grossWage > 0)

    const totalGross = workerPayments.reduce((sum, wp) => sum + wp.grossWage, 0)
    const totalAdvances = workerPayments.reduce((sum, wp) => sum + wp.advanceDeduction, 0)
    const totalNetPayable = workerPayments.reduce((sum, wp) => sum + wp.netPayable, 0)

    const newPayment: PaymentSummary = {
      id: `pay-${Date.now()}`,
      projectId: 'proj-001',
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      workers: workerPayments,
      totalGross,
      totalAdvances,
      totalNetPayable,
      status: 'pending-approval',
      createdBy: 'Site Manager',
      createdAt: new Date().toISOString(),
    }

    onUpdatePayments([...payments, newPayment])
    toast.success('Payment summary generated successfully')
    setIsGenerateOpen(false)
  }

  const handleApprovePayment = (payment: PaymentSummary) => {
    const updated = payments.map(p =>
      p.id === payment.id
        ? {
            ...p,
            status: 'approved' as const,
            approvedBy: 'Owner',
            approvedAt: new Date().toISOString(),
          }
        : p
    )
    onUpdatePayments(updated)
    toast.success('Payment approved successfully')
  }

  const handleMarkPaid = (payment: PaymentSummary) => {
    const updated = payments.map(p =>
      p.id === payment.id
        ? {
            ...p,
            status: 'paid' as const,
            paidAt: new Date().toISOString(),
          }
        : p
    )
    onUpdatePayments(updated)
    toast.success('Payment marked as paid')
  }

  const openDetailDialog = (payment: PaymentSummary) => {
    setSelectedPayment(payment)
    setIsDetailOpen(true)
  }

  const getStatusBadge = (status: PaymentSummary['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-blue-500 text-white">Approved</Badge>
      case 'paid':
        return <Badge className="bg-accent text-accent-foreground">Paid</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const pendingPayments = payments.filter(p => p.status === 'pending-approval')
  const approvedPayments = payments.filter(p => p.status === 'approved')
  const paidPayments = payments.filter(p => p.status === 'paid')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Management</h2>
          <p className="text-sm text-muted-foreground">{pendingPayments.length} pending approvals</p>
        </div>
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <Button onClick={() => setIsGenerateOpen(true)}>
            <Plus className="mr-2" />
            Generate Payment
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Payment Summary</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                This will generate a payment summary for the current week based on attendance records.
              </p>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Week:</span> {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(startOfWeek(new Date(), { weekStartsOn: 1 }), { weekStartsOn: 1 }), 'MMM d, yyyy')}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Active Workers:</span> {workers.filter(w => w.status === 'active').length}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
              <Button onClick={handleGeneratePayment}>Generate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {pendingPayments.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="text-yellow-600" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPayments.map(payment => (
              <div key={payment.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-medium">
                      {format(new Date(payment.weekStart), 'MMM d')} - {format(new Date(payment.weekEnd), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.workers.length} workers • Created by {payment.createdBy}
                    </p>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm space-y-1">
                    <p>Gross Wages: ₹{payment.totalGross}</p>
                    <p className="text-destructive">Advances: -₹{payment.totalAdvances}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Net Payable</p>
                    <p className="text-2xl font-bold text-primary">₹{payment.totalNetPayable}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openDetailDialog(payment)}>
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleApprovePayment(payment)}>
                    <CheckCircle className="mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {approvedPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="text-blue-500" />
              Approved Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvedPayments.map(payment => (
              <div key={payment.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-medium">
                      {format(new Date(payment.weekStart), 'MMM d')} - {format(new Date(payment.weekEnd), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Approved by {payment.approvedBy} on {payment.approvedAt && format(new Date(payment.approvedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm">
                    <p className="font-medium text-lg">₹{payment.totalNetPayable}</p>
                    <p className="text-muted-foreground">{payment.workers.length} workers</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openDetailDialog(payment)}>
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleMarkPaid(payment)}>
                    <Money className="mr-1" />
                    Mark as Paid
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {paidPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Money className="text-accent" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paidPayments.map(payment => (
                <div key={payment.id} className="border rounded-lg p-4 opacity-75">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {format(new Date(payment.weekStart), 'MMM d')} - {format(new Date(payment.weekEnd), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Paid on {payment.paidAt && format(new Date(payment.paidAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(payment.status)}
                      <p className="text-sm font-medium mt-1">₹{payment.totalNetPayable}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Period:</span> {format(new Date(selectedPayment.weekStart), 'MMM d')} - {format(new Date(selectedPayment.weekEnd), 'MMM d, yyyy')}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Status:</span> {getStatusBadge(selectedPayment.status)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Created by:</span> {selectedPayment.createdBy}
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead className="text-right">Days</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Advance</TableHead>
                      <TableHead className="text-right">Net Payable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPayment.workers.map(worker => (
                      <TableRow key={worker.workerId}>
                        <TableCell className="font-medium">{worker.name}</TableCell>
                        <TableCell className="text-right">{worker.daysWorked}</TableCell>
                        <TableCell className="text-right">₹{worker.grossWage}</TableCell>
                        <TableCell className="text-right text-destructive">
                          {worker.advanceDeduction > 0 ? `-₹${worker.advanceDeduction}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold">₹{worker.netPayable}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">₹{selectedPayment.totalGross}</TableCell>
                      <TableCell className="text-right text-destructive">-₹{selectedPayment.totalAdvances}</TableCell>
                      <TableCell className="text-right">₹{selectedPayment.totalNetPayable}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
