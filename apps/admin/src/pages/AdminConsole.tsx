import { useState } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import {
    ADMIN_TOKEN_KEY, ADMIN_USER_KEY, LEGACY_JWT_KEY, LEGACY_ADMIN_USER_KEY,
    readJson, clearStorage,
} from '@buildos/shared/storage'

/* PLATFORM_SUPPORT gets a read-only console served by /api/platform/** */
const adminUser = () => readJson<Record<string, any>>(ADMIN_USER_KEY, LEGACY_ADMIN_USER_KEY) ?? {}
const isSupport = () => adminUser().role === 'PLATFORM_SUPPORT'
const base = () => isSupport() ? '/platform' : '/admin'

/* ---------- auth ---------- */
export function AdminLogin() {
    const nav = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState<string | null>(null)
    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { data } = await api.post('/admin/auth/login', form)
            localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
            localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user))
            nav('/admin')
        } catch { setError('Invalid credentials') }
    }
    const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
    return (
        <div className="min-h-screen bg-slate-900 grid place-items-center px-6">
            <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 space-y-4">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white grid place-items-center text-sm font-bold">E</span>
                    Elanjai Platform
                </div>
                <input required type="email" className={input} placeholder="admin@elanjai.local"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <input required type="password" className={input} placeholder="Password"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                {error && <p className="text-sm text-rose-600">{error}</p>}
                <button className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700">
                    Sign in to console</button>
            </form>
        </div>
    )
}

/* ---------- shell ---------- */
const NAV = [
    { to: '/admin', end: true, label: 'Dashboard' },
    { to: '/admin/approvals', label: 'Approvals', adminOnly: true },
    { to: '/admin/tenants', label: 'Tenants' },
    { to: '/admin/plans', label: 'Plans' },
    { to: '/admin/billing', label: 'Subscriptions' },
    { to: '/admin/settings', label: 'Settings', adminOnly: true },
    { to: '/admin/audit', label: 'Audit log' },
]

export function AdminConsole() {
    const nav = useNavigate()
    const support = isSupport()
    const logout = () => {
        clearStorage(ADMIN_TOKEN_KEY, ADMIN_USER_KEY, LEGACY_JWT_KEY, LEGACY_ADMIN_USER_KEY)
        nav('/admin/login')
    }
    return (
        <div className="min-h-screen bg-slate-100 flex">
            <aside className="w-60 shrink-0 bg-slate-900 text-slate-300 flex flex-col">
                <div className="h-16 px-5 flex items-center gap-2 text-white font-semibold border-b border-slate-800">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 grid place-items-center text-sm font-bold">E</span>
                    Platform
                    {support && <span className="ml-auto rounded bg-slate-700 px-2 py-0.5 text-[10px] font-medium">SUPPORT</span>}
                </div>
                <nav className="flex-1 p-3 space-y-1 text-sm">
                    {NAV.filter(n => !n.adminOnly || !support).map(n => (
                        <NavLink key={n.to} to={n.to} end={n.end as any}
                            className={({ isActive }) => `block rounded-lg px-3 py-2 ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
                            {n.label}
                        </NavLink>
                    ))}
                </nav>
                <button onClick={logout} className="m-3 rounded-lg border border-slate-700 py-2 text-sm hover:bg-slate-800">
                    Sign out</button>
            </aside>
            <main className="flex-1 p-8 overflow-auto">
                <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="approvals" element={support ? <Navigate to="/admin" /> : <Approvals />} />
                    <Route path="tenants" element={<Tenants />} />
                    <Route path="tenants/:id" element={<TenantDetail />} />
                    <Route path="plans" element={<Plans />} />
                    <Route path="billing" element={<Billing />} />
                    <Route path="settings" element={support ? <Navigate to="/admin" /> : <AdminSettings />} />
                    <Route path="audit" element={<Audit />} />
                </Routes>
            </main>
        </div>
    )
}

/* ---------- pages ---------- */
const h = "text-2xl font-bold text-slate-900"
const card = "rounded-2xl border border-slate-200 bg-white p-5"

function AdminDashboard() {
    const support = isSupport()
    const { data } = useQuery({ queryKey: ['admin-dash', support], queryFn: async () => (await api.get(`${base()}/dashboard`)).data })
    if (!data) return null
    const kpis = support
        ? [['Total tenants', data.totalTenants], ['Active', data.activeTenants],
           ['Trials', data.trialTenants], ['Suspended', data.suspendedTenants]]
        : [['MRR', `₹${Number(data.mrr).toLocaleString('en-IN')}`], ['Active tenants', data.activeTenants],
           ['Trials', data.trialTenants], ['Pending approvals', data.pendingApprovals]]
    return (
        <div>
            <h1 className={h}>Dashboard{support && <span className="ml-2 text-sm font-normal text-slate-500">read-only</span>}</h1>
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(([k, v]) => (
                    <div key={k} className={card}>
                        <p className="text-sm text-slate-500">{k}</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{v}</p>
                    </div>
                ))}
            </div>
            {data.tenantsByStatus && <div className={`${card} mt-6`}>
                <h2 className="font-semibold text-slate-900">Tenants by status</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(data.tenantsByStatus).map(([k, v]) => (
                        <span key={k} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                            {k}: {String(v)}</span>
                    ))}
                </div>
            </div>}
        </div>
    )
}

function Approvals() {
    const qc = useQueryClient()
    const { data = [] } = useQuery({ queryKey: ['approvals'], queryFn: async () => (await api.get('/admin/approvals')).data })
    const act = async (id: string, action: 'approve' | 'reject') => {
        const reason = action === 'reject' ? window.prompt('Reason (optional)') : undefined
        await api.post(`/admin/approvals/${id}/${action}`, reason !== undefined ? { reason } : {})
        qc.invalidateQueries({ queryKey: ['approvals'] })
        qc.invalidateQueries({ queryKey: ['admin-dash'] })
    }
    return (
        <div>
            <h1 className={h}>Approvals</h1>
            <div className="mt-6 space-y-3">
                {data.length === 0 && <p className="text-slate-500 text-sm">No pending signups.</p>}
                {data.map((r: any) => (
                    <div key={r.id} className={`${card} flex items-center justify-between`}>
                        <div>
                            <p className="font-semibold text-slate-900">{r.company}
                                <span className="ml-2 text-xs font-normal text-slate-500">{r.slug}.localhost · {r.plan} · {r.billingCycle}</span></p>
                            <p className="text-sm text-slate-500">{r.owner} · {r.email} ·
                                {r.emailVerified ? ' verified' : ' email unverified'}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => act(r.id, 'reject')}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Reject</button>
                            <button onClick={() => act(r.id, 'approve')}
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Approve</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const statusBadge = (s: string) => ({
    TRIAL: 'bg-sky-100 text-sky-700', ACTIVE: 'bg-emerald-100 text-emerald-700',
    GRACE: 'bg-amber-100 text-amber-700', SUSPENDED: 'bg-rose-100 text-rose-700',
    CANCELLED: 'bg-slate-200 text-slate-600', OFFBOARDED: 'bg-slate-300 text-slate-600',
    PENDING_APPROVAL: 'bg-violet-100 text-violet-700', PROVISIONING: 'bg-indigo-100 text-indigo-700',
    PROVISION_FAILED: 'bg-rose-100 text-rose-700',
}[s] || 'bg-slate-100 text-slate-600')

function Tenants() {
    const { data = [] } = useQuery({ queryKey: ['admin-tenants'], queryFn: async () => (await api.get(`${base()}/tenants`)).data })
    const nav = useNavigate()
    return (
        <div>
            <h1 className={h}>Tenants</h1>
            <div className={`${card} mt-6 overflow-x-auto`}>
                <table className="w-full text-sm">
                    <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="pb-2 font-medium">Company</th><th className="pb-2 font-medium">Workspace</th>
                        <th className="pb-2 font-medium">Plan</th><th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Period end</th></tr></thead>
                    <tbody>
                        {data.map((t: any) => (
                            <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                                onClick={() => nav(`/admin/tenants/${t.id}`)}>
                                <td className="py-3 font-medium text-slate-900">{t.company}</td>
                                <td className="py-3 text-slate-600">{t.slug}</td>
                                <td className="py-3 text-slate-600">{t.plan ?? '—'}</td>
                                <td className="py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(t.status)}`}>{t.status}</span></td>
                                <td className="py-3 text-slate-500">{t.periodEnd ? new Date(t.periodEnd).toLocaleDateString('en-IN') : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function TenantDetail() {
    const { id } = useParams()
    const qc = useQueryClient()
    const support = isSupport()
    const { data } = useQuery({ queryKey: ['admin-tenant', id], queryFn: async () => (await api.get(`${base()}/tenants/${id}`)).data })
    const [backfill, setBackfill] = useState<string | null>(null)
    if (!data) return null
    const act = async (action: string) => {
        await api.post(`/admin/tenants/${id}/${action}`)
        qc.invalidateQueries({ queryKey: ['admin-tenant', id] })
    }
    const runBackfill = async () => {
        const r = await api.post(`/admin/tenants/${id}/backfill-usernames`)
        const d = r.data
        setBackfill(`${d.assigned} assigned, ${d.flagged} flagged for review (${d.scanned} scanned)`)
    }
    return (
        <div>
            <h1 className={h}>{data.company} <span className="text-base font-normal text-slate-500">{data.slug}</span></h1>
            {!support && <div className="mt-4 flex gap-2">
                <button onClick={() => act('suspend')} className="rounded-lg border border-rose-300 text-rose-700 px-3 py-1.5 text-sm">Suspend</button>
                <button onClick={() => act('reactivate')} className="rounded-lg border border-emerald-300 text-emerald-700 px-3 py-1.5 text-sm">Reactivate</button>
                <button onClick={() => act('cancel')} className="rounded-lg border border-slate-300 text-slate-700 px-3 py-1.5 text-sm">Cancel</button>
                <button onClick={() => window.confirm('Export data & offboard?') && act('offboard')}
                    className="rounded-lg border border-slate-300 text-slate-700 px-3 py-1.5 text-sm">Offboard</button>
                {data.status === 'PROVISION_FAILED' &&
                    <button onClick={() => act('retry-provisioning')} className="rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-sm">Retry provisioning</button>}
                <button onClick={runBackfill}
                    className="rounded-lg border border-slate-300 text-slate-700 px-3 py-1.5 text-sm"
                    title="Assign canonical name@slug usernames to users without one">
                    Backfill usernames</button>
                {data.status === 'OFFBOARDED' &&
                    <button onClick={async () => {
                            const r = await api.get(`/admin/tenants/${id}/export`, { responseType: 'blob' })
                            const url = URL.createObjectURL(r.data)
                            const a = document.createElement('a'); a.href = url; a.download = `${data.slug}.zip`; a.click()
                            URL.revokeObjectURL(url)
                        }}
                        className="rounded-lg border border-indigo-300 text-indigo-700 px-3 py-1.5 text-sm">Download export</button>}
            </div>}
            {backfill && <p className="mt-2 text-sm text-slate-600">Username backfill: {backfill}</p>}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div className={card}>
                    <h2 className="font-semibold text-slate-900">Usage</h2>
                    {Object.entries(data.usage || {}).map(([k, v]: any) => (
                        <div key={k} className="mt-3">
                            <div className="flex justify-between text-sm"><span className="text-slate-600">{k}</span>
                                <span className="text-slate-900 font-medium">{v.used} / {v.limit < 0 ? '∞' : v.limit}</span></div>
                            <div className="mt-1 h-2 rounded-full bg-slate-100">
                                <div className="h-2 rounded-full bg-indigo-500"
                                    style={{ width: v.limit > 0 ? Math.min(100, (v.used / v.limit) * 100) + '%' : '8%' }} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className={card}>
                    <h2 className="font-semibold text-slate-900">Invoices</h2>
                    {(data.invoices || []).map((i: any) => (
                        <div key={i.number} className="mt-2 flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                            <span>{i.number}</span><span>₹{i.total}</span>
                            <span className="text-slate-500">{i.status}</span>
                            {i.pdf && <button
                                onClick={async () => {
                                    const r = await api.get(`${base()}/invoices/${i.id}/pdf`, { responseType: 'blob' })
                                    window.open(URL.createObjectURL(r.data), '_blank')
                                }}
                                className="rounded-md border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50">PDF</button>}
                        </div>
                    ))}
                    {(data.invoices || []).length === 0 && <p className="text-sm text-slate-500 mt-2">No invoices yet.</p>}
                </div>
            </div>
        </div>
    )
}

function Plans() {
    const { data = [] } = useQuery({ queryKey: ['admin-plans'], queryFn: async () => (await api.get(`${base()}/plans`)).data })
    return (
        <div>
            <h1 className={h}>Plans</h1>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
                {data.map((p: any) => (
                    <div key={p.id} className={card}>
                        <div className="flex justify-between">
                            <h3 className="font-semibold text-slate-900">{p.name}</h3>
                            <span className="text-sm text-slate-500">{p.code}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">₹{p.priceMonthlyInr}/mo · ₹{p.priceYearlyInr}/yr</p>
                        <p className="mt-1 text-xs text-slate-500">
                            {p.maxProjects < 0 ? '∞' : p.maxProjects} projects · {p.maxStaffUsers < 0 ? '∞' : p.maxStaffUsers} staff ·
                            {' '}{p.storageGb}GB · flags: {JSON.stringify(p.featureFlags)}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function Billing() {
    const { data = [] } = useQuery({ queryKey: ['admin-subs'], queryFn: async () => (await api.get(`${base()}/subscriptions`)).data })
    const { data: inv = [] } = useQuery({ queryKey: ['admin-invoices'], queryFn: async () => (await api.get(`${base()}/invoices`)).data })
    return (
        <div className="space-y-6">
            <h1 className={h}>Subscriptions & invoices</h1>
            <div className={card}>
                <h2 className="font-semibold text-slate-900">Subscriptions</h2>
                <table className="w-full text-sm mt-3"><thead><tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2">Tenant</th><th className="pb-2">Plan</th><th className="pb-2">Status</th><th className="pb-2">Period end</th></tr></thead>
                    <tbody>{data.map((s: any) => (
                        <tr key={s.id} className="border-b border-slate-100">
                            <td className="py-2">{s.tenant}</td><td>{s.plan}</td><td>{s.status}</td>
                            <td>{s.periodEnd ? new Date(s.periodEnd).toLocaleDateString('en-IN') : '—'}</td></tr>))}</tbody></table>
            </div>
            <div className={card}>
                <h2 className="font-semibold text-slate-900">Invoices</h2>
                <table className="w-full text-sm mt-3"><thead><tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2">Number</th><th className="pb-2">Tenant</th><th className="pb-2">Total</th><th className="pb-2">Status</th></tr></thead>
                    <tbody>{inv.map((i: any) => (
                        <tr key={i.id} className="border-b border-slate-100">
                            <td className="py-2">{i.number}</td><td>{i.tenant}</td><td>₹{i.total}</td><td>{i.status}</td></tr>))}</tbody></table>
            </div>
        </div>
    )
}

function AdminSettings() {
    const qc = useQueryClient()
    const { data = {} } = useQuery({ queryKey: ['admin-settings'], queryFn: async () => (await api.get('/admin/settings')).data })
    const [form, setForm] = useState<Record<string, string> | null>(null)
    const f = form ?? data
    const save = async () => { await api.put('/admin/settings', f); qc.invalidateQueries({ queryKey: ['admin-settings'] }); setForm(null) }
    const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
    return (
        <div>
            <h1 className={h}>Platform settings</h1>
            <div className={`${card} mt-6 space-y-4 max-w-2xl`}>
                {['platform.gstin', 'platform.name', 'platform.state', 'platform.sac_code', 'reserved_slugs'].map(k => (
                    <label key={k} className="block">
                        <span className="text-sm font-medium text-slate-700">{k}</span>
                        <input className={input + ' mt-1'} value={f[k] ?? ''}
                            onChange={e => setForm({ ...(form ?? data), [k]: e.target.value })} />
                    </label>
                ))}
                <button onClick={save} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">Save</button>
            </div>
        </div>
    )
}

function Audit() {
    const { data = [] } = useQuery({ queryKey: ['admin-audit'], queryFn: async () => (await api.get(`${base()}/audit`)).data })
    return (
        <div>
            <h1 className={h}>Audit log</h1>
            <div className={`${card} mt-6 overflow-x-auto`}>
                <table className="w-full text-sm"><thead><tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2">Time</th><th className="pb-2">Actor</th><th className="pb-2">Action</th><th className="pb-2">Entity</th></tr></thead>
                    <tbody>{data.map((a: any) => (
                        <tr key={a.id} className="border-b border-slate-100">
                            <td className="py-2 text-slate-500">{new Date(a.createdAt).toLocaleString('en-IN')}</td>
                            <td className="py-2">{a.actorRole}</td><td className="py-2">{a.action}</td>
                            <td className="py-2 text-slate-500">{a.entityType}:{a.entityId}</td></tr>))}</tbody></table>
            </div>
        </div>
    )
}
