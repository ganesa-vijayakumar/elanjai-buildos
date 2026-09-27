import { useState } from 'react'
import { Project, CollectionEntry } from '../../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { IndianRupee, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ProjectPaymentsProps {
  project: Project
  onProjectUpdate: (project: Project) => void
}

export function ProjectPayments({ project, onProjectUpdate }: ProjectPaymentsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    stage: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleAddPayment = () => {
    const newCollection: CollectionEntry = {
      id: `col-${Date.now()}`,
      amount: Number(paymentForm.amount),
      stage: paymentForm.stage,
      date: paymentForm.date,
      notes: paymentForm.notes,
      recordedBy: 'Owner',
      recordedAt: new Date().toISOString(),
    }

    const updatedProject = {
      ...project,
      collections: [...(project.collections || []), newCollection],
      totalCollected: (project.totalCollected || 0) + newCollection.amount,
    }

    onProjectUpdate(updatedProject)
    setDialogOpen(false)
    setPaymentForm({
      amount: '',
      stage: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    toast.success('Payment recorded successfully')
  }

  const paymentPercentage = ((project.totalCollected || 0) / project.totalCost) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Payment Tracking</h2>
        <Button onClick={() => setDialogOpen(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-600">Total Contract Value</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(project.totalCost)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Received</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(project.totalCollected || 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(project.totalCost - (project.totalCollected || 0))}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Progress value={paymentPercentage} className="h-3" />
            <p className="text-xs text-gray-600 text-right">
              {Math.round(paymentPercentage)}% collected
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(!project.collections || project.collections.length === 0) ? (
              <p className="text-sm text-gray-600 text-center py-8">
                No payments recorded yet
              </p>
            ) : (
              project.collections
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((collection) => (
                  <div
                    key={collection.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatCurrency(collection.amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {collection.stage} • {format(new Date(collection.date), 'dd MMM yyyy')}
                        </div>
                        {collection.notes && (
                          <div className="text-xs text-gray-500 mt-1">{collection.notes}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      by {collection.recordedBy}
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Add a new payment received from the client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Associated Stage</Label>
              <Select value={paymentForm.stage} onValueChange={(value) => setPaymentForm({ ...paymentForm, stage: value })}>
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {project.stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.name}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Payment Date</Label>
              <Input
                id="date"
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddPayment}
              className="bg-red-600 hover:bg-red-700"
              disabled={!paymentForm.amount || !paymentForm.stage}
            >
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
