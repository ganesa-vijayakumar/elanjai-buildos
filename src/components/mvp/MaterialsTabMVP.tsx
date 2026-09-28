import { useState } from 'react'
import { useProjectMaterials, ProjectMaterial } from '../../hooks/useProjectMaterials'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'
import { Plus, Package } from '@phosphor-icons/react'

const STATUS_FLOW = ['pending', 'ordered', 'delivered', 'installed'] as const
const STATUS_STYLE: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    ordered: 'bg-blue-100 text-blue-700',
    delivered: 'bg-amber-100 text-amber-700',
    installed: 'bg-green-100 text-green-700',
}
const CATEGORIES = ['cement', 'steel', 'aggregate', 'sand', 'bricks', 'tiles', 'paint', 'electrical', 'plumbing', 'doors_windows', 'other']

export function MaterialsTabMVP({ siteId }: { siteId: string }) {
    const { user } = useAuth()
    const canEdit = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'site_manager'
    const { materials, loading, addMaterial, updateMaterial, deleteMaterial } = useProjectMaterials(siteId)
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState({ category: 'cement', materialName: '', specifiedBrand: '', estQuantity: '', unit: 'bags' })

    const submit = async () => {
        if (!form.materialName) { toast.error('Material name required'); return }
        const { error } = await addMaterial({
            category: form.category, materialName: form.materialName,
            specifiedBrand: form.specifiedBrand || undefined,
            estQuantity: form.estQuantity ? parseFloat(form.estQuantity) : undefined,
            unit: form.unit || undefined,
        })
        if (error) { toast.error('Failed to add material'); return }
        toast.success('Material added')
        setOpen(false)
        setForm({ category: 'cement', materialName: '', specifiedBrand: '', estQuantity: '', unit: 'bags' })
    }

    const advance = async (m: ProjectMaterial) => {
        const next = STATUS_FLOW[STATUS_FLOW.indexOf(m.status) + 1]
        if (!next) return
        const { error } = await updateMaterial(m.id, { status: next })
        if (error) toast.error('Update failed'); else toast.success(`Marked ${next}`)
    }

    if (loading) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />

    const grouped = materials.reduce((acc, m) => {
        const c = m.category || 'other'
        ;(acc[c] = acc[c] || []).push(m)
        return acc
    }, {} as Record<string, ProjectMaterial[]>)

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2"><Package size={18} />Materials ({materials.length})</h3>
                {canEdit && <Button size="sm" onClick={() => setOpen(true)}><Plus size={16} className="mr-1" />Add Material</Button>}
            </div>

            {Object.entries(grouped).map(([cat, rows]) => (
                <Card key={cat}>
                    <CardContent className="p-0">
                        <div className="px-4 py-2 border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 capitalize">{cat.replace('_', ' ')}</div>
                        {rows.map(m => (
                            <div key={m.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
                                <div>
                                    <div className="font-medium text-sm">{m.materialName}</div>
                                    <div className="text-xs text-gray-500">
                                        {m.specifiedBrand && <span>{m.specifiedBrand} · </span>}
                                        {m.estQuantity != null && <span>est {m.estQuantity} {m.unit}</span>}
                                        {m.actualQuantity != null && <span> · actual {m.actualQuantity} {m.unit}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={STATUS_STYLE[m.status]}>{m.status}</Badge>
                                    {canEdit && m.status !== 'installed' && (
                                        <Button size="sm" variant="outline" onClick={() => advance(m)}>
                                            → {STATUS_FLOW[STATUS_FLOW.indexOf(m.status) + 1]}
                                        </Button>
                                    )}
                                    {canEdit && user?.role !== 'site_manager' && (
                                        <Button size="sm" variant="ghost" className="text-red-500" onClick={async () => {
                                            const { error } = await deleteMaterial(m.id)
                                            if (error) toast.error('Delete failed'); else toast.success('Removed')
                                        }}>Delete</Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
            {!materials.length && <Card><CardContent className="p-8 text-center text-gray-400">No materials tracked for this site yet</CardContent></Card>}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Material</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div><Label>Category</Label>
                            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div><Label>Material name</Label><Input value={form.materialName} onChange={e => setForm(f => ({ ...f, materialName: e.target.value }))} placeholder="e.g. OPC 53 Cement" /></div>
                        <div><Label>Specified brand</Label><Input value={form.specifiedBrand} onChange={e => setForm(f => ({ ...f, specifiedBrand: e.target.value }))} placeholder="e.g. UltraTech" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Est. quantity</Label><Input type="number" value={form.estQuantity} onChange={e => setForm(f => ({ ...f, estQuantity: e.target.value }))} /></div>
                            <div><Label>Unit</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={submit}><Plus size={16} className="mr-1" />Add</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
