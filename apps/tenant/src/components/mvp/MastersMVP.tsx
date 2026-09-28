import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { toast } from 'sonner'
import { Plus, Trash, PencilSimple, Check, X } from '@phosphor-icons/react'

interface Item { id: string; name: string; [k: string]: any }

function MasterList({ title, path, placeholder, extraField }: {
    title: string; path: string; placeholder: string
    extraField?: { key: string; label: string }
}) {
    const [items, setItems] = useState<Item[]>([])
    const [name, setName] = useState('')
    const [extra, setExtra] = useState('')
    const [editId, setEditId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')

    const load = async () => {
        try { const { data } = await api.get(`/masters/${path}`); setItems(data) }
        catch { setItems([]) }
    }
    useEffect(() => { load() }, [path])

    const add = async () => {
        if (!name.trim()) return
        try {
            await api.post(`/masters/${path}`, { name: name.trim(), ...(extraField ? { [extraField.key]: extra } : {}) })
            setName(''); setExtra(''); load(); toast.success('Added')
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to add') }
    }

    const save = async (item: Item) => {
        try {
            await api.put(`/masters/${path}/${item.id}`, { ...item, name: editName.trim() })
            setEditId(null); load(); toast.success('Updated')
        } catch { toast.error('Failed to update') }
    }

    const remove = async (item: Item) => {
        if (!window.confirm(`Delete "${item.name}"?`)) return
        try { await api.delete(`/masters/${path}/${item.id}`); load(); toast.success('Deleted') }
        catch { toast.error('Failed to delete — it may be in use') }
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Label className="sr-only">Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder={placeholder}
                            onKeyDown={e => e.key === 'Enter' && add()} />
                    </div>
                    {extraField && (
                        <Input value={extra} onChange={e => setExtra(e.target.value)}
                            placeholder={extraField.label} className="w-36" />
                    )}
                    <Button size="sm" onClick={add} className="bg-red-600 hover:bg-red-700">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="divide-y max-h-64 overflow-y-auto">
                    {items.length === 0 && <p className="text-sm text-gray-400 py-3">No items yet</p>}
                    {items.map(item => (
                        <div key={item.id} className="flex items-center gap-2 py-2">
                            {editId === item.id ? (
                                <>
                                    <Input value={editName} onChange={e => setEditName(e.target.value)}
                                        className="h-8" onKeyDown={e => e.key === 'Enter' && save(item)} />
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600"
                                        onClick={() => save(item)}><Check className="w-4 h-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7"
                                        onClick={() => setEditId(null)}><X className="w-4 h-4" /></Button>
                                </>
                            ) : (
                                <>
                                    <span className="flex-1 text-sm text-gray-800">{item.name}
                                        {item.defaultUnit && <span className="text-xs text-gray-400 ml-1">({item.defaultUnit})</span>}
                                    </span>
                                    <Button size="icon" variant="ghost" className="h-7 w-7"
                                        onClick={() => { setEditId(item.id); setEditName(item.name) }}>
                                        <PencilSimple className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600"
                                        onClick={() => remove(item)}><Trash className="w-4 h-4" /></Button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

/** Tenant master data — materials, brands, stage templates (D-034 seeded, owner-editable). */
export function MastersMVP() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MasterList title="Materials" path="materials" placeholder="e.g. Cement 50kg bag"
                extraField={{ key: 'defaultUnit', label: 'Unit (bag/kg)' }} />
            <MasterList title="Brands" path="brands" placeholder="e.g. UltraTech" />
            <MasterList title="Stage templates" path="stage-templates" placeholder="e.g. Foundation" />
        </div>
    )
}
