import { useState } from 'react'
import { Toaster } from 'sonner'
import { useIsMobile } from './hooks/use-mobile'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { NavbarMVP } from './components/mvp/NavbarMVP'
import { LoginPage } from './components/mvp/LoginPage'
import { OwnerDashboardMVP } from './components/mvp/OwnerDashboardMVP'
import { SiteManagerViewMVP } from './components/mvp/SiteManagerViewMVP'
import { ClientPortalMVP } from './components/mvp/ClientPortalMVP'
import { SiteDetailMVP } from './components/mvp/SiteDetailMVP'
import { QuotationsMVP } from './components/mvp/QuotationsMVP'
import { ReportsMVP } from './components/mvp/ReportsMVP'
import { SettingsMVP } from './components/mvp/SettingsMVP'
import { UserManagementMVP } from './components/mvp/UserManagementMVP'
import { useNavigate } from 'react-router-dom'

// Type for active views in the MVP
export type ActiveView = 'dashboard' | 'site-detail' | 'quotations' | 'reports' | 'settings' | 'users' | 'billing'

function AppContent() {
    const isMobile = useIsMobile()
    const { user, loading, role } = useAuth()
    const nav = useNavigate()
    const [activeView, setActiveView] = useState<ActiveView>('dashboard')
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)

    const goTo = (view: ActiveView) => {
        if (view === 'billing') { nav('/billing'); return }
        setSelectedSiteId(null)
        setActiveView(view)
    }

    // Handle site selection
    const handleSiteSelect = (siteId: string) => {
        setSelectedSiteId(siteId)
        setActiveView('site-detail')
    }

    // Handle back navigation
    const handleBack = () => {
        setSelectedSiteId(null)
        setActiveView('dashboard')
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // Not logged in - show login page
    if (!user) {
        return <LoginPage />
    }

    // Render view based on role and active view
    const renderView = () => {
        // Site detail view (accessible by owner and site manager for assigned sites)
        if (activeView === 'site-detail' && selectedSiteId) {
            return <SiteDetailMVP siteId={selectedSiteId} onBack={handleBack} />
        }

        // Role-specific views
        switch (role) {
            case 'owner':
            case 'admin':
                switch (activeView) {
                    case 'quotations':
                        return <QuotationsMVP onSiteCreated={() => setActiveView('dashboard')} />
                    case 'reports':
                        return <ReportsMVP />
                    case 'users':
                        return <UserManagementMVP />
                    case 'settings':
                        return <SettingsMVP />
                    default:
                        return <OwnerDashboardMVP onSiteSelect={handleSiteSelect} />
                }

            case 'site_manager':
                return <SiteManagerViewMVP onSiteSelect={handleSiteSelect} />

            case 'client':
                return <ClientPortalMVP />

            default:
                return (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Unknown role. Please contact support.</p>
                    </div>
                )
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster
                position={isMobile ? "top-center" : "top-right"}
                richColors
                closeButton
                toastOptions={{
                    className: 'shadow-lg',
                }}
            />

            <NavbarMVP
                activeView={activeView}
                onViewChange={(view) => goTo(view as ActiveView)}
            />

            {/* Navigation tabs for owner or admin */}
            {(role === 'owner' || role === 'admin') && activeView !== 'site-detail' && (
                <div className="bg-white border-b shadow-sm">
                    <div className="container mx-auto px-4">
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveView('dashboard')}
                                aria-current={activeView === 'dashboard' ? 'page' : undefined}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeView === 'dashboard'
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => setActiveView('quotations')}
                                aria-current={activeView === 'quotations' ? 'page' : undefined}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeView === 'quotations'
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Quotations
                            </button>
                            <button
                                onClick={() => setActiveView('reports')}
                                aria-current={activeView === 'reports' ? 'page' : undefined}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeView === 'reports'
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Reports
                            </button>
                            <button
                                onClick={() => goTo('users')}
                                aria-current={activeView === 'users' ? 'page' : undefined}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeView === 'users'
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Users
                            </button>
                            {role === 'owner' && (
                                <button
                                    onClick={() => goTo('billing')}
                                    className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
                                >
                                    Billing
                                </button>
                            )}
                            <button
                                onClick={() => setActiveView('settings')}
                                aria-current={activeView === 'settings' ? 'page' : undefined}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeView === 'settings'
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="container mx-auto px-4 py-8">
                {renderView()}
            </main>
        </div>
    )
}

function AppMVP() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    )
}

export default AppMVP
