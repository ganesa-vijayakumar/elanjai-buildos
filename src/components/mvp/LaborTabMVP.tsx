import { useState } from 'react'
import { useWorkers, useAttendance, useWorkerAdvances, Worker, AttendanceRecord } from '../../hooks/useLabor'
import api from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import { Plus, UserPlus, CalendarCheck, Wallet, Users } from '@phosphor-icons/react'
import { formatCurrency } from '../../hooks/useDashboard'

const WORKER_TYPES = ['mason', 'helper', 'bar_bender', 'carpenter', 'electrician', 'plumber', 'painter', 'other']

interface WageRow {
    workerId: string; workerName: string; type: string;
    daysPresent: number; halfDays: number; wages: number; advanceBalance: number;
}

export function LaborTabMVP({ siteId }: { siteId: string }) {
    const { user } = useAuth()
    const canEdit = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'site_manager'
    const { workers, loading, refetch, addWorker, updateWorker } = useWorkers(siteId, false)
    const { sheets, fetchRows, mark } = useAttendance(siteId, 60)
    const [addOpen, setAddOpen] = useState(false)
    const [attOpen, setAttOpen] = useState(false)
    const [advWorker, setAdvWorker] = useState<Worker | null>(null)
    const [wageSummary, setWageSummary] = useState<WageRow[]>([])
    const [wageLoaded, setWageLoaded] = useState(false)
    const [form, setForm] = useState({ name: '', phone: '', type: 'mason', dailyWage: '' })
    const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10))
    const [attRows, setAttRows] = useState<Record<string, string>>({})
    const [advForm, setAdvForm] = useState({ amount: '', reason: '' })
    const [sheetRows, setSheetRows] = useState<Record<string, AttendanceRecord[]>>({})
    const [expanded, setExpanded] = useState<string | null>(null)

    const loadWages = async () => {
        const to = new Date().toISOString().slice(0, 10)
        const from = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10)
        const r = await api.get(`/labor/sites/${siteId}/wage-summary`, { params: { from, to } })
        setWageSummary(Array.isArray(r.data) ? r.data : [])
        setWageLoaded(true)
    }

    const submitWorker = async () => {
        if (!form.name || !form.dailyWage) { toast.error('Name and daily wage required'); return }
        const { error } = await addWorker({ name: form.name, phone: form.phone || undefined, type: form.type, dailyWage: parseFloat(form.dailyWage) })
        if (error) { toast.error('Failed to add worker'); return }
        toast.success('Worker added')
        setAddOpen(false)
        setForm({ name: '', phone: '', type: 'mason', dailyWage: '' })
    }

    const submitAttendance = async () => {
        const rows = workers.filter(w => attRows[w.id] && attRows[w.id] !== 'none')
            .map(w => ({ workerId: w.id, status: attRows[w.id] }))
        if (!rows.length) { toast.error('Mark at least one worker'); return }
        const { error } = await mark(attDate, rows)
        if (error) { toast.error('Failed to save attendance'); return }
        toast.success('Attendance saved')
        setAttOpen(false)
        setAttRows({})
        setWageLoaded(false)
    }

    const toggleSheet = async (id: string) => {
        if (expanded === id) { setExpanded(null); return }
        setExpanded(id)
        if (!sheetRows[id]) {
            const rows = await fetchRows(id)
            setSheetRows(prev => ({ ...prev, [id]: rows }))
        }
    }

    if (loading) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />

    const activeWorkers = workers.filter(w => w.status === 'active')

    return (
        <div className="space-y-4">
            <Tabs defaultValue="workers">
                <div className="flex items-center justify-between mb-3">
                    <TabsList>
                        <TabsTrigger value="workers"><Users size={14} className="mr-1" />Workers ({activeWorkers.length})</TabsTrigger>
                        <TabsTrigger value="attendance"><CalendarCheck size={14} className="mr-1" />Attendance</TabsTrigger>
                        <TabsTrigger value="wages"><Wallet size={14} className="mr-1" />Wages</TabsTrigger>
                    </TabsList>
                    {canEdit && (
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setAttOpen(true)}><CalendarCheck size={16} className="mr-1" />Mark Attendance</Button>
                            <Button size="sm" onClick={() => setAddOpen(true)}><UserPlus size={16} className="mr-1" />Add Worker</Button>
                        </div>
                    )}
                </div>

                <TabsContent value="workers">
                    <Card>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-gray-500">
                                        <th className="p-3">Name</th><th className="p-3">Trade</th>
                                        <th className="p-3">Daily Wage</th><th className="p-3">Advance Balance</th>
                                        <th className="p-3">Status</th>{canEdit && <th className="p-3" />}
                                    </tr>
                                </thead>
                                <tbody>
                                    {workers.map(w => (
                                        <tr key={w.id} className="border-b last:border-0">
                                            <td className="p-3 font-medium">{w.name}<div className="text-xs text-gray-500">{w.phone}</div></td>
                                            <td className="p-3 capitalize">{w.type?.replace('_', ' ')}</td>
                                            <td className="p-3">{formatCurrency(w.dailyWage)}/day</td>
                                            <td className="p-3">{w.advanceBalance > 0 ? <span className="text-amber-600">{formatCurrency(w.advanceBalance)}</span> : '—'}</td>
                                            <td className="p-3"><Badge variant={w.status === 'active' ? 'default' : 'secondary'}>{w.status}</Badge></td>
                                            {canEdit && (
                                                <td className="p-3 text-right space-x-2">
                                                    <Button size="sm" variant="ghost" onClick={() => { setAdvWorker(w); setAdvForm({ amount: '', reason: '' }) }}>Advance</Button>
                                                    {w.status === 'active'
                                                        ? <Button size="sm" variant="ghost" onClick={async () => { await updateWorker(w.id, { status: 'inactive' }); toast.success('Deactivated') }}>Deactivate</Button>
                                                        : <Button size="sm" variant="ghost" onClick={async () => { await updateWorker(w.id, { status: 'active' }); toast.success('Reactivated') }}>Reactivate</Button>}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {!workers.length && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No workers yet</td></tr>}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attendance">
                    <Card>
                        <CardContent className="p-0">
                            {sheets.map(s => (
                                <div key={s.id} className="border-b last:border-0">
                                    <button className="w-full flex justify-between items-center p-3 text-sm hover:bg-gray-50" onClick={() => toggleSheet(s.id)}>
                                        <span className="font-medium">{s.date}</span>
                                        <span className="text-gray-500">{s.notes}</span>
                                    </button>
                                    {expanded === s.id && (
                                        <div className="px-4 pb-3 text-sm">
                                            {(sheetRows[s.id] || []).map(r => (
                                                <div key={r.id} className="flex justify-between py-1 border-t">
                                                    <span>{r.worker?.name}</span>
                                                    <span className="text-gray-600 capitalize">{r.status?.replace('_', ' ')}{r.overtimeHours ? ` +${r.overtimeHours}h OT` : ''} · {formatCurrency((r.wageEarned || 0) + (r.overtimePay || 0))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {!sheets.length && <div className="p-8 text-center text-gray-400">No attendance marked yet</div>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="wages">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base">Wage summary (last 60 days)</CardTitle>
                                {!wageLoaded && <Button size="sm" variant="outline" onClick={loadWages}>Load</Button>}
                            </div>
                        </CardHeader>
                        {wageLoaded && (
                            <CardContent className="p-0">
                                <table className="w-full text-sm">
                                    <thead><tr className="border-b text-left text-gray-500">
                                        <th className="p-3">Worker</th><th className="p-3">Days</th>
                                        <th className="p-3">Half Days</th><th className="p-3">Wages Earned</th><th className="p-3">Advance Due</th>
                                    </tr></thead>
                                    <tbody>
                                        {wageSummary.map(r => (
                                            <tr key={r.workerId} className="border-b last:border-0">
                                                <td className="p-3 font-medium">{r.workerName}<div className="text-xs text-gray-500 capitalize">{r.type}</div></td>
                                                <td className="p-3">{r.daysPresent}</td>
                                                <td className="p-3">{r.halfDays}</td>
                                                <td className="p-3">{formatCurrency(r.wages)}</td>
                                                <td className="p-3">{r.advanceBalance > 0 ? formatCurrency(r.advanceBalance) : '—'}</td>
                                            </tr>
                                        ))}
                                        {!wageSummary.length && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No wages in period</td></tr>}
                                    </tbody>
                                </table>
                            </CardContent>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Add worker dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Worker</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                        <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                        <div><Label>Trade</Label>
                            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{WORKER_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div><Label>Daily Wage (₹)</Label><Input type="number" value={form.dailyWage} onChange={e => setForm(f => ({ ...f, dailyWage: e.target.value }))} /></div>
                    </div>
                    <DialogFooter><Button onClick={submitWorker}><Plus size={16} className="mr-1" />Add</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Attendance dialog */}
            <Dialog open={attOpen} onOpenChange={setAttOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
                    <div><Label>Date</Label><Input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} /></div>
                    <div className="max-h-64 overflow-y-auto space-y-1 mt-2">
                        {activeWorkers.map(w => (
                            <div key={w.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                                <span className="text-sm">{w.name} <span className="text-xs text-gray-400 capitalize">({w.type})</span></span>
                                <Select value={attRows[w.id] || ''} onValueChange={v => setAttRows(r => ({ ...r, [w.id]: v }))}>
                                    <SelectTrigger className="w-32 h-8"><SelectValue placeholder="—" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="present">Present</SelectItem>
                                        <SelectItem value="half_day">Half day</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                    <DialogFooter><Button onClick={submitAttendance}>Save Attendance</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Advance dialog */}
            <AdvanceDialog worker={advWorker} onClose={() => setAdvWorker(null)} form={advForm} setForm={setAdvForm} />
        </div>
    )
}

function AdvanceDialog({ worker, onClose, form, setForm }: {
    worker: Worker | null; onClose: () => void;
    form: { amount: string; reason: string };
    setForm: (f: { amount: string; reason: string }) => void;
}) {
    const { advances, addAdvance, recover } = useWorkerAdvances(worker?.id)
    if (!worker) return null
    return (
        <Dialog open={!!worker} onOpenChange={() => onClose()}>
            <DialogContent>
                <DialogHeader><DialogTitle>Advances — {worker.name}</DialogTitle></DialogHeader>
                <div className="text-sm text-gray-600">Balance: <span className="font-semibold">{formatCurrency(worker.advanceBalance)}</span></div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                    {advances.map(a => (
                        <div key={a.id} className="flex justify-between items-center text-sm border-b py-1.5">
                            <span>{a.date} · {a.reason || 'Advance'}</span>
                            <span className="flex items-center gap-2">
                                {formatCurrency(a.amount)}
                                {a.status !== 'recovered' && (
                                    <Button size="sm" variant="ghost" onClick={async () => {
                                        const remaining = a.amount - a.recoveredAmount
                                        const { error } = await recover(a.id, remaining)
                                        if (error) toast.error('Recovery failed'); else toast.success('Recovered')
                                    }}>Recover</Button>
                                )}
                                <Badge variant={a.status === 'recovered' ? 'default' : 'secondary'}>{a.status.replace('_', ' ')}</Badge>
                            </span>
                        </div>
                    ))}
                    {!advances.length && <div className="text-center text-gray-400 py-4">No advances</div>}
                </div>
                <div className="flex gap-2 items-end">
                    <div className="flex-1"><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                    <div className="flex-1"><Label>Reason</Label><Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
                    <Button onClick={async () => {
                        const amt = parseFloat(form.amount)
                        if (!amt) { toast.error('Enter amount'); return }
                        const { error } = await addAdvance(amt, form.reason || undefined)
                        if (error) toast.error('Failed'); else { toast.success('Advance recorded'); onClose() }
                    }}>Add</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
