import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TodayAttendance } from './labor/TodayAttendance'
import { WeeklySummary } from './labor/WeeklySummary'
import { WorkersManagement } from './labor/WorkersManagement'
import { PaymentsView } from './labor/PaymentsView'
import { Worker, DailyAttendance, Advance, PaymentSummary } from '@/lib/types'

export function LaborAttendanceTracker() {
  const [workers, setWorkers] = useKV<Worker[]>('labor-workers', [])
  const [attendance, setAttendance] = useKV<DailyAttendance[]>('labor-attendance', [])
  const [advances, setAdvances] = useKV<Advance[]>('labor-advances', [])
  const [payments, setPayments] = useKV<PaymentSummary[]>('labor-payments', [])

  const handleUpdateWorkers = (updatedWorkers: Worker[]) => {
    setWorkers(updatedWorkers)
  }

  const handleUpdateAttendance = (updatedAttendance: DailyAttendance[]) => {
    setAttendance(updatedAttendance)
  }

  const handleUpdateAdvances = (updatedAdvances: Advance[]) => {
    setAdvances(updatedAdvances)
  }

  const handleUpdatePayments = (updatedPayments: PaymentSummary[]) => {
    setPayments(updatedPayments)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Labor Attendance & Wage Tracker</h1>
        <p className="text-muted-foreground mt-1">Track daily attendance, calculate wages, and manage payments</p>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="w-full grid grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <TodayAttendance
            workers={workers || []}
            attendance={attendance || []}
            onUpdateAttendance={handleUpdateAttendance}
          />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <WeeklySummary
            workers={workers || []}
            attendance={attendance || []}
          />
        </TabsContent>

        <TabsContent value="workers" className="mt-6">
          <WorkersManagement
            workers={workers || []}
            advances={advances || []}
            attendance={attendance || []}
            onUpdateWorkers={handleUpdateWorkers}
            onUpdateAdvances={handleUpdateAdvances}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentsView
            workers={workers || []}
            payments={payments || []}
            advances={advances || []}
            attendance={attendance || []}
            onUpdatePayments={handleUpdatePayments}
            onUpdateAdvances={handleUpdateAdvances}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
