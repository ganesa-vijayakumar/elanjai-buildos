import { useRef, useState } from 'react'
import { useBranding } from '../../hooks/useBranding'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { toast } from 'sonner'
import { Palette, ImageSquare, FloppyDisk } from '@phosphor-icons/react'

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')
const PRESETS = ['#0f766e', '#1d4ed8', '#b45309', '#be123c', '#6d28d9', '#374151']

export function BrandingTabMVP() {
    const { branding, save, uploadLogo } = useBranding()
    const [color, setColor] = useState(branding.accentColor || '#0f766e')
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const persist = async (next: typeof branding) => {
        setSaving(true)
        const { error } = await save(next)
        setSaving(false)
        if (error) toast.error('Save failed'); else toast.success('Branding saved')
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5 text-gray-400" />
                    Tenant Branding
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Logo */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><ImageSquare size={16} />Company Logo</Label>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
                            {branding.logoUrl
                                ? <img src={`${API_BASE}${branding.logoUrl}`} alt="logo" className="w-full h-full object-contain" />
                                : <ImageSquare size={28} className="text-gray-300" />}
                        </div>
                        <div>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden"
                                onChange={async e => {
                                    const f = e.target.files?.[0]
                                    if (!f) return
                                    setUploading(true)
                                    const { data, error } = await uploadLogo(f)
                                    setUploading(false)
                                    if (error || !data) { toast.error('Upload failed'); return }
                                    await persist({ ...branding, logoFileId: data.fileId, logoUrl: data.url })
                                }} />
                            <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                                {uploading ? 'Uploading…' : 'Upload logo'}
                            </Button>
                            <p className="text-xs text-gray-400 mt-1">PNG/JPG, up to 15 MB. Shown in the navbar.</p>
                        </div>
                    </div>
                </div>

                {/* Accent color */}
                <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-3 flex-wrap">
                        {PRESETS.map(c => (
                            <button key={c} onClick={() => setColor(c)}
                                className={`w-9 h-9 rounded-full border-2 ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }} />
                        ))}
                        <Input type="color" value={color} onChange={e => setColor(e.target.value)}
                            className="w-14 h-9 p-1 cursor-pointer" title="Custom color" />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <Button onClick={() => persist({ ...branding, accentColor: color })} disabled={saving}>
                            <FloppyDisk size={16} className="mr-1" />{saving ? 'Saving…' : 'Save'}
                        </Button>
                        <span className="text-xs text-gray-400">Applied to buttons and highlights across the workspace.</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
