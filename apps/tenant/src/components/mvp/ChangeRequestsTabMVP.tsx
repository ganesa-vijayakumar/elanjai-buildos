import { useState } from 'react'
import { useChangeRequests } from '../../hooks/useChangeRequests'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'
import { Plus, GitPullRequest } from '@phosphor-icons/react'
import { formatCurrency } from '../../hooks/useDashboard'

const STATUS_STYLE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
    in_progress: 'bg-blue-100 text-blue-700',
    implemented: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
}
const CR_TYPES = ['design', 'material', 'scope']
const CR_CATEGORIES = ['structural', 'electrical', 'plumbing', 'flooring', 'paint', 'other']

export function ChangeRequestsTabMVP({ siteId }: { siteId: string }) {
    const { user } = useAuth()
    const isApprover = user?.role === 'owner' || user?.role === 'admin'
    const { items, loading, create, decide } = useChangeRequests(siteId)
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState({ description: '', type: 'design', category: 'structural', costImpact: '', timelineImpact: '' })
    const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({})

    const submit = async () => {
        if (!form.description.trim()) { toast.error('Description required'); return }
        const { error } = await create({
            description: form.description, type: form.type, category: form.category,
            costImpact: form.costImpact ? parseFloat(form.costImpact) : undefined,
            timelineImpact: form.timelineImpact || undefined,
        })
        if (error) { toast.error('Failed to submit'); return }
        toast.success('Change request submitted')
        setOpen(false)
        setForm({ description: '', type: 'design', category: 'structural', costImpact: '', timelineImpact: '' })
    }

    if (loading) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2"><GitPullRequest size={18} />Change Requests ({items.length})</h3>
                <Button size="sm" onClick={() => setOpen(true)}><Plus size={16} className="mr-1" />New Request</Button>
            </div>

            <div className="space-y-3">
                {items.map(cr => (
                    <Card key={cr.id}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-gray-400">{cr.crNumber}</span>
                                        <Badge className={STATUS_STYLE[cr.status] || ''}>{cr.status.replace('_', ' ')}</Badge>
                                        {cr.type && <Badge variant="outline" className="capitalize">{cr.type}</Badge>}
                                    </div>
                                    <p className="mt-1 text-sm">{cr.description}</p>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {cr.category && <span className="capitalize">{cr.category} · </span>}
                                        {cr.costImpact != null && <span>{formatCurrency(cr.costImpact)} · </span>}
                                        {cr.timelineImpact && <span>{cr.timelineImpact}</span>}
                                        {cr.requestedBy && <span> · by {cr.requestedBy}</span>}
                                    </div>
                                    {cr.approverNotes && <div className="mt-1 text-xs text-gray-600 italic">"{cr.approverNotes}"</div>}
                                </div>
                                {isApprover && cr.status === 'pending' && (
                                    <div className="flex flex-col gap-2 ml-4 min-w-52">
                                        <Input placeholder="Notes (optional)" value={decisionNotes[cr.id] || ''}
                                            onChange={e => setDecisionNotes(n => ({ ...n, [cr.id]: e.target.value }))} className="h-8 text-xs" />
                                        <div className="flex gap-2">
                                            <Button size="sm" className="flex-1" onClick={async () => {
                                                const { error } = await decide(cr.id, 'approved', decisionNotes[cr.id])
                                                if (error) toast.error('Failed'); else toast.success('Approved')
                                            }}>Approve</Button>
                                            <Button size="sm" variant="outline" className="flex-1 text-red-600" onClick={async () => {
                                                const { error } = await decide(cr.id, 'rejected', decisionNotes[cr.id])
                                                if (error) toast.error('Failed'); else toast.success('Rejected')
                                            }}>Reject</Button>
                                        </div>
                                    </div>
                                )}
                                {isApprover && cr.status === 'approved' && (
                                    <Button size="sm" variant="outline" onClick={async () => {
                                        const { error } = await decide(cr.id, 'implemented', 'Marked implemented')
                                        if (error) toast.error('Failed'); else toast.success('Marked implemented')
                                    }}>Mark implemented</Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {!items.length && <Card><CardContent className="p-8 text-center text-gray-400">No change requests</CardContent></Card>}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>New Change Request</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the change needed" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Type</Label>
                                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{CR_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div><Label>Category</Label>
                                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{CR_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Cost impact (₹)</Label><Input type="number" value={form.costImpact} onChange={e => setForm(f => ({ ...f, costImpact: e.target.value }))} /></div>
                            <div><Label>Timeline impact</Label><Input value={form.timelineImpact} onChange={e => setForm(f => ({ ...f, timelineImpact: e.target.value }))} placeholder="e.g. +3 days" /></div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={submit}>Submit Request</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
