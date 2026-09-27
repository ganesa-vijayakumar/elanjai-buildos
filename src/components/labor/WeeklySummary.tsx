import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Worker, DailyAttendance } from '@/lib/types'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns'

interface WeeklySummaryProps {
  workers: Worker[]
  attendance: DailyAttendance[]
}

export function WeeklySummary({ workers, attendance }: WeeklySummaryProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  const daysOfWeek = eachDayOfInterval({ start: currentWeekStart, end: weekEnd })

  const getAttendanceForWorkerOnDate = (workerId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayAttendance = attendance.find(a => a.date === dateStr)
    return dayAttendance?.records.find(r => r.workerId === workerId)
  }

  const getStatusBadgeShort = (status?: string) => {
    if (!status) return <span className="text-muted-foreground text-xs">-</span>

    switch (status) {
      case 'present':
        return <Badge className="bg-accent text-accent-foreground text-xs px-1.5 py-0">P</Badge>
      case 'half-day':
        return <Badge className="bg-yellow-500 text-white text-xs px-1.5 py-0">H</Badge>
      case 'leave':
        return <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0">L</Badge>
      case 'absent':
        return <Badge variant="secondary" className="text-xs px-1.5 py-0">A</Badge>
      default:
        return <span className="text-muted-foreground text-xs">-</span>
    }
  }

  const calculateWeeklySummary = (worker: Worker) => {
    let daysWorked = 0
    let grossWage = 0

    daysOfWeek.forEach(date => {
      const record = getAttendanceForWorkerOnDate(worker.id, date)
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

    return { daysWorked, grossWage }
  }

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  }

  const handleNextWeek = () => {
    const nextWeek = addWeeks(currentWeekStart, 1)
    if (nextWeek <= new Date()) {
      setCurrentWeekStart(nextWeek)
    }
  }

  const handleCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  const isCurrentWeek = format(currentWeekStart, 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const isFutureWeek = currentWeekStart > startOfWeek(new Date(), { weekStartsOn: 1 })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Weekly Attendance Summary</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                <CaretLeft />
              </Button>
              <div className="text-sm font-medium min-w-[200px] text-center">
                {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </div>
              <Button variant="outline" size="sm" onClick={handleNextWeek} disabled={isFutureWeek}>
                <CaretRight />
              </Button>
              {!isCurrentWeek && (
                <Button variant="outline" size="sm" onClick={handleCurrentWeek}>
                  Today
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Worker</TableHead>
                  {daysOfWeek.map(date => (
                    <TableHead key={date.toISOString()} className="text-center min-w-[60px]">
                      <div className="text-xs">
                        {format(date, 'EEE')}
                      </div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {format(date, 'd')}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right min-w-[80px]">Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={daysOfWeek.length + 2} className="text-center text-muted-foreground py-8">
                      No workers found
                    </TableCell>
                  </TableRow>
                ) : (
                  workers.map(worker => {
                    const summary = calculateWeeklySummary(worker)
                    return (
                      <TableRow key={worker.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{worker.name}</div>
                            <div className="text-xs text-muted-foreground">{worker.type}</div>
                          </div>
                        </TableCell>
                        {daysOfWeek.map(date => {
                          const record = getAttendanceForWorkerOnDate(worker.id, date)
                          return (
                            <TableCell key={date.toISOString()} className="text-center">
                              {getStatusBadgeShort(record?.status)}
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-right font-medium text-sm">
                          {summary.daysWorked}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Wage Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead className="text-right">Daily Wage</TableHead>
                  <TableHead className="text-right">Days Worked</TableHead>
                  <TableHead className="text-right">Gross Wage</TableHead>
                  <TableHead className="text-right">Advance</TableHead>
                  <TableHead className="text-right">Net Payable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No workers found
                    </TableCell>
                  </TableRow>
                ) : (
                  workers.map(worker => {
                    const summary = calculateWeeklySummary(worker)
                    const netPayable = summary.grossWage - worker.advanceBalance

                    return (
                      <TableRow key={worker.id}>
                        <TableCell>
                          <div className="font-medium">{worker.name}</div>
                          <div className="text-xs text-muted-foreground">{worker.type}</div>
                        </TableCell>
                        <TableCell className="text-right">₹{worker.dailyWage}</TableCell>
                        <TableCell className="text-right">{summary.daysWorked}</TableCell>
                        <TableCell className="text-right font-medium">₹{summary.grossWage}</TableCell>
                        <TableCell className="text-right text-destructive">
                          {worker.advanceBalance > 0 ? `-₹${worker.advanceBalance}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold">₹{netPayable}</TableCell>
                      </TableRow>
                    )
                  })
                )}
                {workers.length > 0 && (
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right">
                      ₹{workers.reduce((sum, w) => sum + calculateWeeklySummary(w).grossWage, 0)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      -₹{workers.reduce((sum, w) => sum + w.advanceBalance, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{workers.reduce((sum, w) => sum + calculateWeeklySummary(w).grossWage - w.advanceBalance, 0)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
