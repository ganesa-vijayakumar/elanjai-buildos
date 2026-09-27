import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Worker, Advance, DailyAttendance, WORKER_TYPE_WAGES, WORKER_TYPE_LABELS, WorkerType } from '@/lib/types'
import { Plus, PencilSimple, Trash, Money } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { format, subDays } from 'date-fns'

interface WorkersManagementProps {
  workers: Worker[]
  advances: Advance[]
  attendance: DailyAttendance[]
  onUpdateWorkers: (workers: Worker[]) => void
  onUpdateAdvances: (advances: Advance[]) => void
}

export function WorkersManagement({ workers, advances, attendance, onUpdateWorkers, onUpdateAdvances }: WorkersManagementProps) {
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false)
  const [isEditWorkerOpen, setIsEditWorkerOpen] = useState(false)
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)

  const [workerForm, setWorkerForm] = useState({
    name: '',
    phone: '',
    type: 'helper' as WorkerType,
    dailyWage: 500,
    projectId: 'proj-001',
  })

  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    reason: '',
  })

  const handleWorkerTypeChange = (type: WorkerType) => {
    setWorkerForm(prev => ({
      ...prev,
      type,
      dailyWage: WORKER_TYPE_WAGES[type],
    }))
  }

  const handleAddWorker = () => {
    if (!workerForm.name || !workerForm.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    const newWorker: Worker = {
      id: `worker-${Date.now()}`,
      name: workerForm.name,
      phone: workerForm.phone,
      type: workerForm.type,
      dailyWage: workerForm.dailyWage,
      projectId: workerForm.projectId,
      status: 'active',
      advanceBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onUpdateWorkers([...workers, newWorker])
    toast.success(`Worker ${newWorker.name} added successfully`)
    setIsAddWorkerOpen(false)
    setWorkerForm({
      name: '',
      phone: '',
      type: 'helper',
      dailyWage: 500,
      projectId: 'proj-001',
    })
  }

  const handleEditWorker = () => {
    if (!selectedWorker) return

    const updatedWorker: Worker = {
      ...selectedWorker,
      name: workerForm.name,
      phone: workerForm.phone,
      type: workerForm.type,
      dailyWage: workerForm.dailyWage,
      updatedAt: new Date().toISOString(),
    }

    onUpdateWorkers(workers.map(w => w.id === selectedWorker.id ? updatedWorker : w))
    toast.success(`Worker ${updatedWorker.name} updated successfully`)
    setIsEditWorkerOpen(false)
    setSelectedWorker(null)
  }

  const handleDeleteWorker = (worker: Worker) => {
    if (confirm(`Are you sure you want to deactivate ${worker.name}?`)) {
      const updated = workers.map(w => 
        w.id === worker.id ? { ...w, status: 'inactive' as const, updatedAt: new Date().toISOString() } : w
      )
      onUpdateWorkers(updated)
      toast.success(`Worker ${worker.name} deactivated`)
    }
  }

  const openEditDialog = (worker: Worker) => {
    setSelectedWorker(worker)
    setWorkerForm({
      name: worker.name,
      phone: worker.phone,
      type: worker.type,
      dailyWage: worker.dailyWage,
      projectId: worker.projectId,
    })
    setIsEditWorkerOpen(true)
  }

  const openAdvanceDialog = (worker: Worker) => {
    setSelectedWorker(worker)
    setAdvanceForm({
      amount: '',
      reason: '',
    })
    setIsAdvanceOpen(true)
  }

  const handleRecordAdvance = () => {
    if (!selectedWorker || !advanceForm.amount) {
      toast.error('Please enter advance amount')
      return
    }

    const amount = parseFloat(advanceForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    const newAdvance: Advance = {
      id: `adv-${Date.now()}`,
      workerId: selectedWorker.id,
      workerName: selectedWorker.name,
      amount,
      date: new Date().toISOString().split('T')[0],
      reason: advanceForm.reason || undefined,
      recordedBy: 'Site Manager',
      status: 'pending-recovery',
    }

    onUpdateAdvances([...advances, newAdvance])

    const updatedWorker = {
      ...selectedWorker,
      advanceBalance: selectedWorker.advanceBalance + amount,
      updatedAt: new Date().toISOString(),
    }
    onUpdateWorkers(workers.map(w => w.id === selectedWorker.id ? updatedWorker : w))

    toast.success(`Advance of ₹${amount} recorded for ${selectedWorker.name}`)
    setIsAdvanceOpen(false)
    setSelectedWorker(null)
  }

  const getWeekAttendance = (workerId: string) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i)
      return format(date, 'yyyy-MM-dd')
    })

    let daysPresent = 0
    last7Days.forEach(dateStr => {
      const dayAttendance = attendance.find(a => a.date === dateStr)
      const record = dayAttendance?.records.find(r => r.workerId === workerId)
      if (record) {
        if (record.status === 'present') daysPresent += 1
        else if (record.status === 'half-day') daysPresent += 0.5
      }
    })

    return `${daysPresent}/7 days`
  }

  const activeWorkers = workers.filter(w => w.status === 'active')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workers</h2>
          <p className="text-sm text-muted-foreground">{activeWorkers.length} active workers</p>
        </div>
        <Dialog open={isAddWorkerOpen} onOpenChange={setIsAddWorkerOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Worker</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter worker name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={workerForm.phone}
                  onChange={(e) => setWorkerForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Worker Type</Label>
                <Select value={workerForm.type} onValueChange={(value) => handleWorkerTypeChange(value as WorkerType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WORKER_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wage">Daily Wage (₹)</Label>
                <Input
                  id="wage"
                  type="number"
                  value={workerForm.dailyWage}
                  onChange={(e) => setWorkerForm(prev => ({ ...prev, dailyWage: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddWorkerOpen(false)}>Cancel</Button>
              <Button onClick={handleAddWorker}>Add Worker</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeWorkers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No workers found. Add your first worker to get started.</p>
            </CardContent>
          </Card>
        ) : (
          activeWorkers.map(worker => (
            <Card key={worker.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{worker.name}</h3>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {WORKER_TYPE_LABELS[worker.type]}
                    </Badge>
                    <div className="mt-3 space-y-1 text-sm">
                      <p className="text-muted-foreground">₹{worker.dailyWage}/day</p>
                      <p className="text-muted-foreground">This week: {getWeekAttendance(worker.id)}</p>
                      {worker.advanceBalance > 0 && (
                        <p className="text-destructive font-medium">Advance: ₹{worker.advanceBalance}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(worker)}>
                    <PencilSimple className="mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openAdvanceDialog(worker)}>
                    <Money className="mr-1" />
                    Advance
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteWorker(worker)}>
                    <Trash />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isEditWorkerOpen} onOpenChange={setIsEditWorkerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Worker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={workerForm.name}
                onChange={(e) => setWorkerForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number *</Label>
              <Input
                id="edit-phone"
                value={workerForm.phone}
                onChange={(e) => setWorkerForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Worker Type</Label>
              <Select value={workerForm.type} onValueChange={(value) => handleWorkerTypeChange(value as WorkerType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WORKER_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-wage">Daily Wage (₹)</Label>
              <Input
                id="edit-wage"
                type="number"
                value={workerForm.dailyWage}
                onChange={(e) => setWorkerForm(prev => ({ ...prev, dailyWage: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditWorkerOpen(false)}>Cancel</Button>
            <Button onClick={handleEditWorker}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdvanceOpen} onOpenChange={setIsAdvanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Advance Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium">{selectedWorker?.name}</p>
              <p className="text-xs text-muted-foreground">
                Current advance balance: ₹{selectedWorker?.advanceBalance || 0}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                value={advanceForm.amount}
                onChange={(e) => setAdvanceForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={advanceForm.reason}
                onChange={(e) => setAdvanceForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for advance"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdvanceOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordAdvance}>Record Advance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
