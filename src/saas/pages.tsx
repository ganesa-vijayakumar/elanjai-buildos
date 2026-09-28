import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { currentTenantSlug, tenantUrl, isAdminHost } from '../lib/tenant'

/* Shared chrome */
export function PublicNav() {
    return (
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white grid place-items-center text-sm font-bold">E</span>
                    ElanjaiBuildos
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
                    <a href="/#features" className="hover:text-slate-900">Features</a>
                    <Link to="/pricing" className="hover:text-slate-900">Pricing</Link>
                    <Link to="/login" className="hover:text-slate-900">Sign in</Link>
                    <Link to="/signup"
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 transition">
                        Start free trial</Link>
                </nav>
            </div>
        </header>
    )
}

export function PlansGrid() {
    const { data: plans = [] } = useQuery({
        queryKey: ['public-plans'],
        queryFn: async () => (await api.get('/public/plans')).data,
    })
    return (
        <div className="grid md:grid-cols-4 gap-5">
            {plans.map((p: any, i: number) => (
                <div key={p.code}
                    className={`rounded-2xl border p-6 bg-white transition hover:-translate-y-1 hover:shadow-lg ${
                        i === 1 ? 'border-indigo-300 ring-2 ring-indigo-100 relative' : 'border-slate-200'}`}>
                    {i === 1 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-indigo-600 text-white px-3 py-0.5 rounded-full">Most popular</span>}
                    <h3 className="font-semibold text-slate-900">{p.name}</h3>
                    <p className="mt-3 text-3xl font-bold text-slate-900">₹{p.priceMonthlyInr.toLocaleString('en-IN')}
                        <span className="text-sm font-normal text-slate-500">/mo</span></p>
                    <p className="text-xs text-slate-500 mt-1">₹{p.priceYearlyInr.toLocaleString('en-IN')}/yr</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                        <li>{p.maxProjects < 0 ? 'Unlimited' : p.maxProjects} projects</li>
                        <li>{p.maxStaffUsers < 0 ? 'Unlimited' : p.maxStaffUsers} staff users</li>
                        <li>{p.maxQuotationsPerMonth < 0 ? 'Unlimited' : p.maxQuotationsPerMonth} quotations/mo</li>
                        <li>{p.storageGb} GB storage</li>
                    </ul>
                    <Link to={`/signup?plan=${p.code}`}
                        className="mt-5 block text-center rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
                        Choose {p.name}</Link>
                </div>
            ))}
        </div>
    )
}

export function Landing() {
    return (
        <div className="min-h-screen bg-slate-50">
            <PublicNav />
            <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
                    Construction management,<br />
                    <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        from quotation to handover.</span>
                </h1>
                <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
                    Run quotations, projects, labor, materials and client updates in one
                    isolated workspace — built for Indian builders.
                </p>
                <div className="mt-8 flex gap-3 justify-center">
                    <Link to="/signup" className="rounded-xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition shadow-sm">
                        Start 14-day free trial</Link>
                    <Link to="/pricing" className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-white transition">
                        See pricing</Link>
                </div>
            </section>
            <section id="features" className="max-w-6xl mx-auto px-6 pb-20">
                <div className="grid md:grid-cols-3 gap-5">
                    {[
                        ['Quotation → Agreement', 'Multi-package quotations with stage-wise payment breakdowns and printable agreements.'],
                        ['Site operations', 'Daily labor attendance, materials spent, expense approvals and photo updates.'],
                        ['Client portal', 'Give your customers a live view of progress, payments and change requests.'],
                        ['Reports & exports', 'Collections vs expenses, stage budgets, CSV exports — always audit-ready.'],
                        ['Branded workspace', 'Your logo, your colors, your own builder.yourcompany subdomain.'],
                        ['GST billing built-in', 'Invoices with CGST/SGST/IGST handled automatically on every renewal.'],
                    ].map(([t, d]) => (
                        <div key={t} className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h3 className="font-semibold text-slate-900">{t}</h3>
                            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{d}</p>
                        </div>
                    ))}
                </div>
            </section>
            <section className="max-w-6xl mx-auto px-6 pb-24"><PlansGrid /></section>
        </div>
    )
}

export function Pricing() {
    return (
        <div className="min-h-screen bg-slate-50">
            <PublicNav />
            <div className="max-w-6xl mx-auto px-6 py-16">
                <h1 className="text-3xl font-bold text-center text-slate-900">Simple pricing</h1>
                <p className="text-center text-slate-600 mt-2">14-day free trial on every plan. No credit card required.</p>
                <div className="mt-10"><PlansGrid /></div>
            </div>
        </div>
    )
}

export function Signup() {
    const [params] = useSearchParams()
    const nav = useNavigate()
    const { data: plans = [] } = useQuery({ queryKey: ['public-plans'], queryFn: async () => (await api.get('/public/plans')).data })
    const [form, setForm] = useState({
        companyName: '', ownerName: '', email: '', phone: '', password: '',
        slug: '', gstin: '', state: 'Tamil Nadu',
        planCode: params.get('plan') || 'professional', billingCycle: 'monthly',
    })
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle')
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    const checkSlug = async (slug: string) => {
        setForm(f => ({ ...f, slug }))
        if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) { setSlugStatus('idle'); return }
        setSlugStatus('checking')
        const { data } = await api.get('/public/slug-available', { params: { slug } })
        setSlugStatus(data.available ? 'ok' : 'taken')
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setBusy(true); setError(null)
        try {
            await api.post('/public/signup', form)
            nav('/pending')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Signup failed')
        } finally { setBusy(false) }
    }

    const field = (label: string, node: React.ReactNode) => (
        <label className="block">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <div className="mt-1">{node}</div>
        </label>
    )
    const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"

    return (
        <div className="min-h-screen bg-slate-50">
            <PublicNav />
            <div className="max-w-2xl mx-auto px-6 py-14">
                <h1 className="text-3xl font-bold text-slate-900">Create your workspace</h1>
                <p className="text-slate-600 mt-2">Free for 14 days. We review every signup within 24h.</p>
                <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-8">
                    <div className="grid md:grid-cols-2 gap-4">
                        {field('Company name', <input required className={input} value={form.companyName}
                            onChange={e => setForm({ ...form, companyName: e.target.value })} />)}
                        {field('Your name', <input required className={input} value={form.ownerName}
                            onChange={e => setForm({ ...form, ownerName: e.target.value })} />)}
                        {field('Work email', <input required type="email" className={input} value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })} />)}
                        {field('Phone', <input className={input} value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })} />)}
                        {field('Password (min 8 chars)', <input required type="password" minLength={8} className={input}
                            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />)}
                        {field('GSTIN (optional)', <input className={input} value={form.gstin}
                            onChange={e => setForm({ ...form, gstin: e.target.value })} />)}
                    </div>
                    {field('Workspace address', (
                        <div className="flex items-center gap-0">
                            <input required className={input + ' rounded-r-none'} value={form.slug}
                                onChange={e => checkSlug(e.target.value.toLowerCase())}
                                placeholder="acme-builders" />
                            <span className="rounded-r-lg border border-l-0 border-slate-300 px-3 py-2 text-sm text-slate-500 bg-slate-50">
                                .{import.meta.env.VITE_BASE_DOMAIN || 'localhost'}</span>
                        </div>))}
                    {slugStatus === 'ok' && <p className="text-sm text-emerald-600">✓ Available</p>}
                    {slugStatus === 'taken' && <p className="text-sm text-rose-600">Taken or reserved — try another.</p>}
                    <div className="grid md:grid-cols-2 gap-4">
                        {field('Plan', (
                            <select className={input} value={form.planCode}
                                onChange={e => setForm({ ...form, planCode: e.target.value })}>
                                {plans.map((p: any) => <option key={p.code} value={p.code}>{p.name} — ₹{p.priceMonthlyInr}/mo</option>)}
                            </select>))}
                        {field('Billing', (
                            <select className={input} value={form.billingCycle}
                                onChange={e => setForm({ ...form, billingCycle: e.target.value })}>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly (save ~17%)</option>
                            </select>))}
                    </div>
                    {error && <p className="text-sm text-rose-600">{error}</p>}
                    <button disabled={busy || slugStatus === 'taken'}
                        className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition">
                        {busy ? 'Creating…' : 'Create workspace'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export function VerifyEmail() {
    const [params] = useSearchParams()
    const [state, setState] = useState<'verifying' | 'ok' | 'fail'>('verifying')
    useState(() => {
        api.get('/public/verify-email', { params: { token: params.get('token') } })
            .then(() => setState('ok')).catch(() => setState('fail'))
    })
    return (
        <div className="min-h-screen bg-slate-50 grid place-items-center">
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center max-w-md">
                <h1 className="text-xl font-semibold text-slate-900">
                    {state === 'verifying' ? 'Verifying…' : state === 'ok' ? 'Email verified' : 'Verification failed'}
                </h1>
                <p className="mt-3 text-sm text-slate-600">
                    {state === 'ok'
                        ? 'Your request is now in the approval queue. We will email you when your workspace is ready.'
                        : state === 'fail' ? 'This link is invalid or already used.' : 'Hold on.'}
                </p>
            </div>
        </div>
    )
}

export function PendingApproval() {
    return (
        <div className="min-h-screen bg-slate-50 grid place-items-center px-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center max-w-md">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-600 grid place-items-center text-xl">⏳</div>
                <h1 className="mt-4 text-xl font-semibold text-slate-900">Request received</h1>
                <p className="mt-3 text-sm text-slate-600">
                    Verify your email (check inbox/spam), then our team approves your workspace —
                    usually within 24 hours. You'll get an email with your login link.
                </p>
            </div>
        </div>
    )
}

export function WorkspaceNotFound() {
    return (
        <div className="min-h-screen bg-slate-50 grid place-items-center px-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">Workspace not found</h1>
                <p className="mt-2 text-slate-600">
                    The address <code>{window.location.hostname}</code> doesn't match any workspace.
                </p>
                <Link to="/" className="mt-6 inline-block text-indigo-600 font-medium hover:underline">← Back to home</Link>
            </div>
        </div>
    )
}

export function AcceptInvite() {
    const [params] = useSearchParams()
    const nav = useNavigate()
    const [form, setForm] = useState({ fullName: '', password: '' })
    const [error, setError] = useState<string | null>(null)
    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { data } = await api.post('/auth/accept-invite', {
                token: params.get('token'), fullName: form.fullName, password: form.password,
            })
            localStorage.setItem('jwt_token', data.token)
            localStorage.setItem('user_data', JSON.stringify(data.user))
            nav('/')
        } catch (err: any) { setError(err.response?.data?.message || 'Invite invalid or expired') }
    }
    const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
    return (
        <div className="min-h-screen bg-slate-50 grid place-items-center px-6">
            <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 space-y-4">
                <h1 className="text-xl font-semibold text-slate-900">Accept your invite</h1>
                <input required className={input} placeholder="Full name" value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })} />
                <input required type="password" minLength={8} className={input} placeholder="Set password (min 8)"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                {error && <p className="text-sm text-rose-600">{error}</p>}
                <button className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700">
                    Join workspace</button>
            </form>
        </div>
    )
}

export function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [done, setDone] = useState(false)
    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        await api.post('/auth/forgot-password', { email }).catch(() => {})
        setDone(true)
    }
    const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
    return (
        <div className="min-h-screen bg-slate-50 grid place-items-center px-6">
            <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 space-y-4">
                <h1 className="text-xl font-semibold text-slate-900">Reset password</h1>
                {done ? <p className="text-sm text-slate-600">If that email exists here, a reset link is on its way.</p>
                    : <input required type="email" className={input} placeholder="you@company.com"
                        value={email} onChange={e => setEmail(e.target.value)} />}
                {!done && <button className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white">Send reset link</button>}
            </form>
        </div>
    )
}

export function ResetPassword() {
    const [params] = useSearchParams()
    const nav = useNavigate()
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await api.post('/auth/reset-password', { token: params.get('token'), password })
            nav('/login')
        } catch (err: any) { setError(err.response?.data?.message || 'Reset failed') }
    }
    const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
    return (
        <div className="min-h-screen bg-slate-50 grid place-items-center px-6">
            <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 space-y-4">
                <h1 className="text-xl font-semibold text-slate-900">Set a new password</h1>
                <input required type="password" minLength={8} className={input} placeholder="New password"
                    value={password} onChange={e => setPassword(e.target.value)} />
                {error && <p className="text-sm text-rose-600">{error}</p>}
                <button className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white">Reset password</button>
            </form>
        </div>
    )
}
