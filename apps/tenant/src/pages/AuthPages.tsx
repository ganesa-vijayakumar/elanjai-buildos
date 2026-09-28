import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { TENANT_TOKEN_KEY, TENANT_USER_KEY } from '@buildos/shared/storage'

const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none"

/** Invite acceptance — tenant-scoped (runs on the workspace host). */
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
            localStorage.setItem(TENANT_TOKEN_KEY, data.token)
            localStorage.setItem(TENANT_USER_KEY, JSON.stringify(data.user))
            nav('/')
        } catch (err: any) { setError(err.response?.data?.message || 'Invite invalid or expired') }
    }
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
