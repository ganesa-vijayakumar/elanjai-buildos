import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Worker, DailyAttendance, AttendanceRecord, AttendanceStatus } from '@/lib/types'
import { CalendarBlank, CheckCircle, MinusCircle, XCircle, AirplaneTakeoff, CopySimple, CheckSquare } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface TodayAttendanceProps {
  workers: Worker[]
  attendance: DailyAttendance[]
  onUpdateAttendance: (attendance: DailyAttendance[]) => void
}

export function TodayAttendance({ workers, attendance, onUpdateAttendance }: TodayAttendanceProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [notes, setNotes] = useState('')
  const [workerStatuses, setWorkerStatuses] = useState<Record<string, AttendanceStatus>>({})

  const today = format(new Date(), 'yyyy-MM-dd')
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const cannotMarkFuture = selectedDate > new Date()

  const todayAttendance = attendance.find(a => a.date === selectedDateStr)

  const getWorkerStatus = (workerId: string): AttendanceStatus => {
    if (workerStatuses[workerId]) {
      return workerStatuses[workerId]
    }
    const record = todayAttendance?.records.find(r => r.workerId === workerId)
    return record?.status || 'absent'
  }

  const calculateWage = (worker: Worker, status: AttendanceStatus): number => {
    if (status === 'present') return worker.dailyWage
    if (status === 'half-day') return worker.dailyWage * 0.5
    return 0
  }

  const handleStatusChange = (workerId: string, status: AttendanceStatus) => {
    setWorkerStatuses(prev => ({ ...prev, [workerId]: status }))
  }

  const handleMarkAllPresent = () => {
    const allPresent: Record<string, AttendanceStatus> = {}
    workers.forEach(w => {
      allPresent[w.id] = 'present'
    })
    setWorkerStatuses(allPresent)
    toast.success('Marked all workers as present')
  }

  const handleCopyFromYesterday = () => {
    const yesterday = new Date(selectedDate)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd')
    const yesterdayAttendance = attendance.find(a => a.date === yesterdayStr)

    if (yesterdayAttendance) {
      const copied: Record<string, AttendanceStatus> = {}
      yesterdayAttendance.records.forEach(r => {
        copied[r.workerId] = r.status
      })
      setWorkerStatuses(copied)
      toast.success('Copied attendance from yesterday')
    } else {
      toast.error('No attendance record found for yesterday')
    }
  }

  const handleSaveAttendance = () => {
    if (cannotMarkFuture) {
      toast.error('Cannot mark attendance for future dates')
      return
    }

    const records: AttendanceRecord[] = workers.map(w => {
      const status = getWorkerStatus(w.id)
      return {
        workerId: w.id,
        status,
        wageEarned: calculateWage(w, status),
      }
    })

    const totalPresent = records.filter(r => r.status === 'present').length
    const totalHalfDay = records.filter(r => r.status === 'half-day').length
    const totalAbsent = records.filter(r => r.status === 'absent' || r.status === 'leave').length
    const totalWages = records.reduce((sum, r) => sum + r.wageEarned, 0)

    const newAttendance: DailyAttendance = {
      date: selectedDateStr,
      projectId: 'proj-001',
      records,
      totalPresent,
      totalHalfDay,
      totalAbsent,
      totalWages,
      notes: notes || undefined,
      markedBy: 'Site Manager',
      markedAt: new Date().toISOString(),
    }

    const existingIndex = attendance.findIndex(a => a.date === selectedDateStr)
    if (existingIndex >= 0) {
      const updated = [...attendance]
      updated[existingIndex] = newAttendance
      onUpdateAttendance(updated)
      toast.success('Attendance updated successfully')
    } else {
      onUpdateAttendance([...attendance, newAttendance])
      toast.success('Attendance saved successfully')
    }

    setWorkerStatuses({})
    setNotes('')
  }

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-accent text-accent-foreground">Present</Badge>
      case 'half-day':
        return <Badge className="bg-yellow-500 text-white">Half Day</Badge>
      case 'leave':
        return <Badge className="bg-blue-500 text-white">Leave</Badge>
      default:
        return <Badge variant="secondary">Absent</Badge>
    }
  }

  const summary = {
    present: workers.filter(w => getWorkerStatus(w.id) === 'present').length,
    halfDay: workers.filter(w => getWorkerStatus(w.id) === 'half-day').length,
    absent: workers.filter(w => ['absent', 'leave'].includes(getWorkerStatus(w.id))).length,
    totalWages: workers.reduce((sum, w) => sum + calculateWage(w, getWorkerStatus(w.id)), 0),
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Mark Attendance</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarBlank className="mr-2" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {cannotMarkFuture && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
              Cannot mark attendance for future dates
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleMarkAllPresent} variant="outline" className="flex-1" disabled={cannotMarkFuture}>
              <CheckSquare className="mr-2" />
              Mark All Present
            </Button>
            <Button onClick={handleCopyFromYesterday} variant="outline" className="flex-1" disabled={cannotMarkFuture}>
              <CopySimple className="mr-2" />
              Copy from Yesterday
            </Button>
          </div>

          <div className="space-y-3">
            {workers.map(worker => {
              const status = getWorkerStatus(worker.id)
              const wage = calculateWage(worker, status)

              return (
                <Card key={worker.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{worker.name}</h4>
                          <p className="text-xs text-muted-foreground">{worker.type} • ₹{worker.dailyWage}/day</p>
                        </div>
                        {getStatusBadge(status)}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Button
                          size="sm"
                          variant={status === 'present' ? 'default' : 'outline'}
                          onClick={() => handleStatusChange(worker.id, 'present')}
                          disabled={cannotMarkFuture}
                          className={status === 'present' ? 'bg-accent hover:bg-accent/90' : ''}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={status === 'half-day' ? 'default' : 'outline'}
                          onClick={() => handleStatusChange(worker.id, 'half-day')}
                          disabled={cannotMarkFuture}
                          className={status === 'half-day' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''}
                        >
                          <MinusCircle className="mr-1 h-4 w-4" />
                          Half
                        </Button>
                        <Button
                          size="sm"
                          variant={status === 'absent' ? 'secondary' : 'outline'}
                          onClick={() => handleStatusChange(worker.id, 'absent')}
                          disabled={cannotMarkFuture}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          variant={status === 'leave' ? 'default' : 'outline'}
                          onClick={() => handleStatusChange(worker.id, 'leave')}
                          disabled={cannotMarkFuture}
                          className={status === 'leave' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                        >
                          <AirplaneTakeoff className="mr-1 h-4 w-4" />
                          Leave
                        </Button>
                      </div>

                      {wage > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">Wage earned: ₹{wage}</p>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about today's attendance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={cannotMarkFuture}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-accent/10 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Present</p>
              <p className="text-2xl font-bold text-accent">{summary.present}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Half Day</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.halfDay}</p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Absent</p>
              <p className="text-2xl font-bold">{summary.absent}</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Wages</p>
              <p className="text-2xl font-bold text-primary">₹{summary.totalWages}</p>
            </div>
          </div>

          <Button onClick={handleSaveAttendance} className="w-full" size="lg" disabled={cannotMarkFuture}>
            Save Attendance
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
