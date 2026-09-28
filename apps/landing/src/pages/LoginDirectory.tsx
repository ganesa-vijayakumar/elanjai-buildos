import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { tenantUrl, adminUrl, BASE_DOMAIN } from '@buildos/shared/host'

/**
 * Sign-in directory: workspace sign-in lives on the tenant app's own host
 * (<slug>.<base>/login). This page routes users to their workspace and
 * confirms the workspace exists first via the public status endpoint.
 */
export function LoginDirectory() {
    const [slug, setSlug] = useState('')
    const [state, setState] = useState<'idle' | 'checking' | 'bad'>('idle')

    const go = async (e: React.FormEvent) => {
        e.preventDefault()
        // Accept a workspace slug OR a canonical username "local@slug" — the apex
        // only parses the suffix and navigates; no credentials or tenant lookup here.
        let s = slug.trim().toLowerCase()
        const at = s.lastIndexOf('@')
        if (at > 0) s = s.slice(at + 1)
        if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(s)) { setState('bad'); return }
        setState('checking')
        try {
            const { data } = await api.get(`/public/tenants/${s}/status`)
            if (data?.exists) {
                window.location.href = `${tenantUrl(s)}/login`
                return
            }
        } catch { /* fall through */ }
        setState('bad')
    }

    const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
    return (
        <div className="min-h-screen bg-slate-50 grid place-items-center px-6">
            <form onSubmit={go} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 space-y-4">
                <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white grid place-items-center text-sm font-bold">E</span>
                    ElanjaiBuildos
                </Link>
                <h1 className="text-xl font-semibold text-slate-900">Sign in to your workspace</h1>
                <div className="flex items-center gap-0">
                    <input required className={input + ' rounded-r-none'} value={slug}
                        onChange={e => { setSlug(e.target.value); setState('idle') }}
                        placeholder="your-workspace or name@workspace" />
                    <span className="rounded-r-lg border border-l-0 border-slate-300 px-3 py-2 text-sm text-slate-500 bg-slate-50">
                        .{BASE_DOMAIN}</span>
                </div>
                {state === 'bad' && <p className="text-sm text-rose-600">Workspace not found — check the address.</p>}
                <button disabled={state === 'checking'}
                    className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                    {state === 'checking' ? 'Checking…' : 'Continue'}
                </button>
                <p className="text-xs text-slate-500 pt-2">
                    Platform administrator? <a className="text-indigo-600 hover:underline"
                        href={`${adminUrl()}/admin/login`}>Admin console</a>
                </p>
            </form>
        </div>
    )
}
