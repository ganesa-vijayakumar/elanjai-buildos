import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Clock } from '@phosphor-icons/react'
import { formatCurrency } from '../../hooks/useDashboard'

interface PendingItem {
    kind: 'expense' | 'collection'
    id: string
    siteId: string
    label: string
    amount: number
    date: string
    by: string
}

/** Owner/Admin approval queue — expenses + collections entered by staff. */
export function PendingApprovalsMVP() {
    const [items, setItems] = useState<PendingItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPending = async () => {
        try {
            const { data } = await api.get('/approvals/pending')
            setItems([...(data.expenses || []), ...(data.collections || [])])
        } catch { setItems([]) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchPending() }, [])

    const decide = async (item: PendingItem, action: 'approve' | 'reject') => {
        try {
            const reason = action === 'reject' ? window.prompt('Rejection reason') : undefined
            if (action === 'reject' && reason === undefined) return
            await api.post(`/approvals/${item.kind}s/${item.id}/${action}`,
                action === 'reject' ? { reason } : {})
            toast.success(`${item.kind === 'expense' ? 'Expense' : 'Collection'} ${action}d`)
            setItems(prev => prev.filter(i => i.id !== item.id))
        } catch { toast.error('Action failed') }
    }

    if (loading) return null
    if (items.length === 0) return null

    return (
        <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Pending approvals
                    <Badge className="bg-amber-100 text-amber-800">{items.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 text-sm">{item.label || item.kind}</p>
                                <p className="text-xs text-gray-500">
                                    {item.kind} · by {item.by || 'staff'} · {item.date ? new Date(item.date).toLocaleDateString('en-IN') : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 text-sm">{formatCurrency(item.amount)}</span>
                                <Button size="sm" variant="outline"
                                    className="h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                    onClick={() => decide(item, 'approve')}>
                                    <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline"
                                    className="h-8 text-rose-700 border-rose-300 hover:bg-rose-50"
                                    onClick={() => decide(item, 'reject')}>
                                    <XCircle className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
