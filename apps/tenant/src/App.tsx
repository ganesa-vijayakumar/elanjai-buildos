import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import AppMVP from './AppMVP'
import { TenantShell } from './saas/TenantShell'
import { TenantBilling } from './saas/TenantBilling'
import { AcceptInvite, ForgotPassword, ResetPassword } from './pages/AuthPages'
import api from './lib/api'
import { currentTenantSlug } from './lib/tenant'
import { landingUrl } from '@buildos/shared/host'

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function WorkspaceNotFound() {
    return (
        <div className="min-h-screen bg-slate-50 grid place-items-center px-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">Workspace not found</h1>
                <p className="mt-2 text-slate-600">
                    The address <code>{window.location.hostname}</code> doesn't match any workspace.
                </p>
                <a href={`${landingUrl()}/login`}
                    className="mt-6 inline-block text-indigo-600 font-medium hover:underline">
                    Find your workspace →</a>
            </div>
        </div>
    )
}

/**
 * Guard: confirm the host-resolved workspace exists before mounting the app.
 * Authoritative checks still happen server-side (Host + JWT realm/tenant) —
 * this is only the UX shell for bad addresses.
 */
function WorkspaceGuard({ children }: { children: React.ReactNode }) {
    const slug = currentTenantSlug()
    const { data, isLoading } = useQuery({
        queryKey: ['workspace-status', slug],
        queryFn: async () => (await api.get(`/public/tenants/${slug}/status`)).data,
        enabled: !!slug,
        retry: false,
        staleTime: 60_000,
    })

    if (!slug) return <WorkspaceNotFound />
    if (isLoading) {
        return <div className="min-h-screen bg-slate-50 grid place-items-center text-slate-500">Loading workspace…</div>
    }
    if (data && !data.exists) return <WorkspaceNotFound />
    if (data && (data.status === 'OFFBOARDED' || data.status === 'CANCELLED')) return <WorkspaceNotFound />
    return <>{children}</>
}

/**
 * Tenant workspace app — served on <slug>.<base-domain> hosts.
 * Login is handled inside AppMVP (unauthenticated → LoginPage).
 */
export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <WorkspaceGuard>
                    <Routes>
                        <Route path="/accept-invite" element={<AcceptInvite />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/billing" element={
                            <TenantShell><TenantBilling /></TenantShell>
                        } />
                        {/* workspace — the BuildOS app itself */}
                        <Route path="/*" element={<TenantShell><AppMVP /></TenantShell>} />
                    </Routes>
                </WorkspaceGuard>
            </BrowserRouter>
        </QueryClientProvider>
    )
}
