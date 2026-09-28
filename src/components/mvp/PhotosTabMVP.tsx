import { useRef, useState } from 'react'
import { usePhotos } from '../../hooks/usePhotos'
import { useSiteStages } from '../../hooks/useStages'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/api'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'
import { Camera, Upload, Trash } from '@phosphor-icons/react'

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')

export function PhotosTabMVP({ siteId }: { siteId: string }) {
    const { user } = useAuth()
    const canEdit = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'site_manager'
    const canDelete = user?.role === 'owner' || user?.role === 'admin'
    const { stages: siteStages } = useSiteStages(siteId)
    const [stageFilter, setStageFilter] = useState<string | undefined>(undefined)
    const { photos, loading, uploading, upload, remove } = usePhotos(siteId, stageFilter)
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [caption, setCaption] = useState('')
    const [stageId, setStageId] = useState<string>('')
    const fileRef = useRef<HTMLInputElement>(null)

    const submit = async () => {
        if (!file) { toast.error('Choose a photo'); return }
        const { error } = await upload(file, caption || undefined, stageId || undefined)
        if (error) { toast.error('Upload failed'); return }
        toast.success('Photo uploaded')
        setOpen(false); setFile(null); setCaption(''); setStageId('')
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2"><Camera size={18} />Site Photos ({photos.length})</h3>
                <div className="flex gap-2 items-center">
                    <Select value={stageFilter || 'all'} onValueChange={v => setStageFilter(v === 'all' ? undefined : v)}>
                        <SelectTrigger className="w-40 h-8"><SelectValue placeholder="All stages" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All stages</SelectItem>
                            {siteStages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {canEdit && <Button size="sm" onClick={() => setOpen(true)}><Upload size={16} className="mr-1" />Upload</Button>}
                </div>
            </div>

            {loading ? <div className="animate-pulse h-40 bg-gray-100 rounded-xl" /> : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map(p => (
                        <Card key={p.id} className="overflow-hidden">
                            <a href={`${API_BASE}${p.url}`} target="_blank" rel="noreferrer">
                                <img src={`${API_BASE}${p.url}`} alt={p.caption || 'site photo'} className="w-full h-36 object-cover" />
                            </a>
                            <CardContent className="p-2">
                                <div className="text-xs font-medium truncate">{p.caption || '—'}</div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-400">{p.stageName || ''} {p.uploadedAt ? new Date(p.uploadedAt).toLocaleDateString() : ''}</span>
                                    {canDelete && <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={async () => {
                                        const { error } = await remove(p.id)
                                        if (error) toast.error('Delete failed'); else toast.success('Deleted')
                                    }}><Trash size={14} /></Button>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {!photos.length && <div className="col-span-full text-center text-gray-400 py-12">No photos yet</div>}
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Upload Site Photo</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>Photo</Label>
                            <Input ref={fileRef} type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                        </div>
                        <div><Label>Caption</Label><Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Foundation work complete" /></div>
                        <div><Label>Stage</Label>
                            <Select value={stageId || 'none'} onValueChange={v => setStageId(v === 'none' ? '' : v)}>
                                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {siteStages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={submit} disabled={uploading}>{uploading ? 'Uploading…' : 'Upload'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
