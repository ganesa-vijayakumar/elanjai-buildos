import { useQuery } from '@tanstack/react-query'
import api, { tenantSession } from '../lib/api'
import { currentTenantSlug } from '../lib/tenant'

/**
 * Wraps the tenant app: shows lifecycle banners (trial countdown / grace /
 * suspended) above the workspace, and PLAN_LIMIT/FEATURE_LOCKED upsells are
 * surfaced by callers via axios error responses.
 */
export function TenantShell({ children }: { children: React.ReactNode }) {
    const slug = currentTenantSlug()
    const { data } = useQuery({
        queryKey: ['tenant-billing-status', slug],
        queryFn: async () => (await api.get('/billing')).data,
        retry: false,
        enabled: !!slug && !!tenantSession.token(),
    })

    const status = data?.status
    return (
        <div className="min-h-screen flex flex-col">
            {status === 'TRIAL' && data.trialEndsAt && (
                <div className="bg-sky-50 border-b border-sky-200 px-4 py-2 text-center text-sm text-sky-800">
                    Trial — ends {new Date(data.trialEndsAt).toLocaleDateString('en-IN')}.
                    <a href="#/billing" className="ml-2 font-semibold underline">Choose a plan</a>
                </div>
            )}
            {status === 'GRACE' && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
                    Payment due — workspace is read-only until the invoice is paid.
                    <a href="#/billing" className="ml-2 font-semibold underline">Pay now</a>
                </div>
            )}
            {status === 'SUSPENDED' && (
                <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 text-center text-sm text-rose-800">
                    Workspace suspended. Contact support or clear dues to restore access.
                </div>
            )}
            <div className="flex-1">{children}</div>
        </div>
    )
}
