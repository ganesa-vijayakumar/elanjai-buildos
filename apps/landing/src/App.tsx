import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
    Landing, Pricing, Signup, VerifyEmail, PendingApproval, WorkspaceNotFound,
} from './pages/public'
import { LoginDirectory } from './pages/LoginDirectory'
import { adminUrl } from '@buildos/shared/host'

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

/** Legacy /admin/* links on the apex host redirect to the admin app's own host. */
function AdminRedirect() {
    window.location.replace(`${adminUrl()}${window.location.pathname}${window.location.search}`)
    return null
}

/**
 * Landing app routes — public realm only. Tenant auth flows
 * (accept-invite / forgot / reset / workspace login) live on the tenant app's
 * own host; workspace lookup goes through the sign-in directory.
 */
export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/pending" element={<PendingApproval />} />
                    <Route path="/workspace-not-found" element={<WorkspaceNotFound />} />
                    <Route path="/login" element={<LoginDirectory />} />
                    <Route path="/admin/*" element={<AdminRedirect />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    )
}
