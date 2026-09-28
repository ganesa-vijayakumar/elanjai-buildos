import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppMVP from './AppMVP'
import { TenantShell } from './saas/TenantShell'
import { TenantBilling } from './saas/TenantBilling'
import { AdminConsole, AdminLogin } from './saas/AdminConsole'
import {
    Landing, Pricing, Signup, VerifyEmail, PendingApproval,
    WorkspaceNotFound, AcceptInvite, ForgotPassword, ResetPassword,
} from './saas/pages'
import { isAdminHost } from './lib/tenant'

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

/**
 * SaaS router:
 *  - admin.<domain> (or localStorage admin_console=1) → platform console
 *  - everything else → public site + tenant workspace
 * The tenant workspace mounts the existing MVP app; tenant APIs resolve via
 * subdomain or X-Tenant-ID (see lib/tenant.ts, lib/api.ts).
 */
export default function SaasApp() {
    const admin = isAdminHost()
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {admin ? (
                    <Routes>
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin/*" element={<AdminConsole />} />
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                ) : (
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        <Route path="/pending" element={<PendingApproval />} />
                        <Route path="/workspace-not-found" element={<WorkspaceNotFound />} />
                        <Route path="/accept-invite" element={<AcceptInvite />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/billing" element={
                            <TenantShell><TenantBilling /></TenantShell>
                        } />
                        {/* tenant workspace — existing app */}
                        <Route path="/*" element={<TenantShell><AppMVP /></TenantShell>} />
                    </Routes>
                )}
            </BrowserRouter>
        </QueryClientProvider>
    )
}
