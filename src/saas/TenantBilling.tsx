import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

/** Tenant billing page (OWNER) — plan, usage meters, invoices, upgrade checkout. */
export function TenantBilling() {
    const qc = useQueryClient()
    const { data } = useQuery({ queryKey: ['billing'], queryFn: async () => (await api.get('/billing')).data })
    const { data: plans = [] } = useQuery({ queryKey: ['billing-plans'], queryFn: async () => (await api.get('/billing/plans')).data })
    const [msg, setMsg] = useState<string | null>(null)

    if (!data) return null
    const checkout = async (planCode: string, cycle: 'monthly' | 'yearly') => {
        const { data: r } = await api.post('/billing/checkout', { planCode, billingCycle: cycle })
        if (r.razorpayEnabled && r.orderId) {
            // Razorpay Checkout.js — loaded lazily
            await loadRazorpay()
            const rz = new (window as any).Razorpay({
                key: r.keyId, order_id: r.orderId, amount: r.amount, currency: r.currency,
                name: 'ElanjaiBuildos',
                handler: async (resp: any) => {
                    await api.post('/billing/verify', {
                        orderId: r.orderId, paymentId: resp.razorpay_payment_id,
                        signature: resp.razorpay_signature,
                    })
                    setMsg('Payment received — subscription active.')
                    qc.invalidateQueries({ queryKey: ['billing'] })
                },
            })
            rz.open()
        } else {
            setMsg(`Invoice ${r.invoiceNumber} issued for ₹${r.total}. Contact support to complete payment.`)
        }
    }

    const badge: Record<string, string> = {
        TRIAL: 'bg-sky-100 text-sky-700', ACTIVE: 'bg-emerald-100 text-emerald-700',
        GRACE: 'bg-amber-100 text-amber-700', SUSPENDED: 'bg-rose-100 text-rose-700',
    }
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Billing & subscription</h1>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge[data.status] || 'bg-slate-100'}`}>
                    {data.status}</span>
            </div>
            {msg && <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">{msg}</div>}

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="font-semibold text-slate-900">Current plan: {data.plan ?? 'trial'}</h2>
                <p className="text-sm text-slate-500 mt-1">
                    {data.status === 'TRIAL' && data.trialEndsAt &&
                        `Trial ends ${new Date(data.trialEndsAt).toLocaleDateString('en-IN')}`}
                    {data.status !== 'TRIAL' && data.periodEnd &&
                        `Current period ends ${new Date(data.periodEnd).toLocaleDateString('en-IN')}`}
                    {' · '}{data.billingCycle} billing
                </p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(data.usage || {}).map(([k, v]: any) => (
                        <div key={k} className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">{k.replace(/_/g, ' ')}</p>
                            <p className="text-sm font-semibold text-slate-900">{v.used} / {v.limit < 0 ? '∞' : v.limit}</p>
                            <div className="mt-1.5 h-1.5 rounded-full bg-slate-200">
                                <div className={`h-1.5 rounded-full ${v.limit > 0 && v.used / v.limit > 0.85 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                    style={{ width: v.limit > 0 ? Math.min(100, (v.used / v.limit) * 100) + '%' : '5%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="font-semibold text-slate-900">Change plan</h2>
                <div className="mt-4 grid md:grid-cols-2 gap-3">
                    {plans.map((p: any) => (
                        <div key={p.code} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                            <div>
                                <p className="font-medium text-slate-900">{p.name}</p>
                                <p className="text-sm text-slate-500">₹{p.priceMonthlyInr}/mo · ₹{p.priceYearlyInr}/yr</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => checkout(p.code, 'monthly')}
                                    className="rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-xs font-medium">Monthly</button>
                                <button onClick={() => checkout(p.code, 'yearly')}
                                    className="rounded-lg border border-indigo-200 text-indigo-700 px-3 py-1.5 text-xs font-medium">Yearly</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="font-semibold text-slate-900">Invoices</h2>
                {(data.invoices || []).length === 0 && <p className="mt-2 text-sm text-slate-500">No invoices yet.</p>}
                {(data.invoices || []).map((i: any) => (
                    <div key={i.number} className="mt-2 flex justify-between text-sm border-b border-slate-100 pb-2">
                        <span>{i.number}</span><span>₹{i.total}</span><span className="text-slate-500">{i.status}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function loadRazorpay(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).Razorpay) return resolve()
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Failed to load Razorpay'))
        document.body.appendChild(s)
    })
}
