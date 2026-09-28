import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { CheckCircle, Circle, ArrowRight } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface WizardState {
    done: boolean
    steps: Record<string, boolean>
}

const STEPS: { key: string; title: string; desc: string; view: string }[] = [
    { key: 'profile', title: 'Company profile', desc: 'Business name, GSTIN & billing address in Settings', view: 'settings' },
    { key: 'masters', title: 'Review masters', desc: 'Materials, labor roles & expense categories', view: 'settings' },
    { key: 'first_site', title: 'Create your first site', desc: 'Or convert a quotation into a project', view: 'dashboard' },
    { key: 'team', title: 'Invite your team', desc: 'Site managers and clients join via email invite', view: 'users' },
]

/** First-login setup checklist for tenant owners (SCR-036). */
export function SetupWizardMVP({ onGo }: { onGo: (view: string) => void }) {
    const [state, setState] = useState<WizardState | null>(null)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (sessionStorage.getItem('wizard_dismissed')) return
        api.get('/setup')
            .then(({ data }) => {
                setState(data)
                if (!data.done) setOpen(true)
            })
            .catch(() => {})
    }, [])

    if (!state || state.done || !open) return null

    const complete = async (step: string) => {
        try {
            const { data } = await api.post('/setup/step', { step })
            setState(data)
        } catch { toast.error('Could not save progress') }
    }

    const finish = async () => {
        try {
            await api.post('/setup/finish')
            setOpen(false)
            toast.success('Workspace setup complete')
        } catch { toast.error('Could not finish') }
    }

    const dismiss = () => {
        sessionStorage.setItem('wizard_dismissed', '1')
        setOpen(false)
    }

    const doneCount = STEPS.filter(s => state.steps[s.key]).length

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss() }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Set up your workspace</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-500">{doneCount} of {STEPS.length} complete</p>
                <div className="space-y-2 py-2">
                    {STEPS.map(s => {
                        const done = !!state.steps[s.key]
                        return (
                            <div key={s.key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                                <button onClick={() => !done && complete(s.key)} className="shrink-0">
                                    {done
                                        ? <CheckCircle className="w-5 h-5 text-emerald-500" weight="fill" />
                                        : <Circle className="w-5 h-5 text-gray-300" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                        {s.title}
                                    </p>
                                    <p className="text-xs text-gray-500">{s.desc}</p>
                                </div>
                                {!done && (
                                    <Button variant="ghost" size="sm" className="h-7 text-red-600"
                                        onClick={() => { dismiss(); onGo(s.view) }}>
                                        Go <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={dismiss}>Later</Button>
                    <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={finish}>
                        {doneCount === STEPS.length ? 'Finish' : 'Skip & finish'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
