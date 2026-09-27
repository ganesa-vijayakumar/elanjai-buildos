import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster } from 'sonner'
import { useIsMobile } from './hooks/use-mobile'
import { Navbar } from './components/Navbar'
import { OwnerDashboard } from './components/OwnerDashboard'
import { AdminDashboard } from './components/AdminDashboard'
import { SiteManagerView } from './components/SiteManagerView'
import { ClientPortal } from './components/ClientPortal'
import { ClientLogin } from './components/ClientLogin'
import { MaterialEstimator } from './components/MaterialEstimator'
import { LaborAttendanceTracker } from './components/LaborAttendanceTracker'
import { SmartQuotationEngine } from './components/SmartQuotationEngine'
import { ElectricalProvisionsComponent } from './components/ElectricalProvisions'
import { ConstructionStagesConfig, StagesConfiguration } from './components/ConstructionStagesConfig'
import { AgreementDocument } from './components/agreement/AgreementDocument'
import { QuotationListView } from './components/QuotationListView'
import { Settings } from './components/Settings'
import { ReportsPage } from './components/ReportsPage'
import { UserRole, Project, Notification, Quotation } from './lib/types'
import { generateMockProjects } from './lib/mockData'

function App() {
  const isMobile = useIsMobile()
  const [currentRole, setCurrentRole] = useState<UserRole>('owner')
  const [projects, setProjects] = useKV<Project[]>('construction-projects', generateMockProjects())
  const [activeView, setActiveView] = useState<'dashboard' | 'estimator' | 'labor' | 'quotation' | 'quotations' | 'electrical' | 'stages' | 'settings' | 'reports' | 'agreement'>('dashboard')
  const [clientPhone, setClientPhone] = useState<string | null>(null)
  const [selectedClientProject, setSelectedClientProject] = useState<Project | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [quotationToEdit, setQuotationToEdit] = useState<Quotation | null>(null)
  const [quotationForStages, setQuotationForStages] = useState<Quotation | null>(null)
  const [stagesConfig, setStagesConfig] = useState<StagesConfiguration | null>(null)

  const handleEditQuotation = (quotation: Quotation) => {
    setQuotationToEdit(quotation)
    setActiveView('quotation')
  }

  const handleNavigateToStages = (quotation: Quotation) => {
    setQuotationForStages(quotation)
    setActiveView('stages')
  }

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects((currentProjects) =>
      (currentProjects || []).map(p => p.id === updatedProject.id ? updatedProject : p)
    )
  }

  const handleAddProject = (newProject: Project) => {
    setProjects((currentProjects) => [...(currentProjects || []), newProject])
  }

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    )
  }

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole)
    setActiveView('dashboard')
    if (newRole === 'client') {
      setClientPhone(null)
      setSelectedClientProject(null)
    }
  }

  const handleClientLogin = (phoneNumber: string) => {
    setClientPhone(phoneNumber)
    const mockPhoneToProject: Record<string, number> = {
      '9876543210': 0,
      '9876543211': 1,
      '9876543212': 2,
    }
    const projectIndex = mockPhoneToProject[phoneNumber] || 0
    const safeProjects = Array.isArray(projects) ? projects : []
    if (safeProjects[projectIndex]) {
      setSelectedClientProject(safeProjects[projectIndex])
    }
  }

  const handleClientLogout = () => {
    setClientPhone(null)
    setSelectedClientProject(null)
    setCurrentRole('owner')
  }

  const renderRoleView = () => {
    const currentProjects = Array.isArray(projects) ? projects : []

    if (activeView === 'settings' && (currentRole === 'admin' || currentRole === 'owner')) {
      return <Settings currentRole={currentRole} />
    }

    // Reports only accessible to owner, not admin
    if (activeView === 'reports' && currentRole === 'owner') {
      return <ReportsPage />
    }

    if (activeView === 'quotations' && (currentRole === 'admin' || currentRole === 'owner')) {
      return (
        <QuotationListView
          onNewQuotation={() => { setQuotationToEdit(null); setActiveView('quotation'); }}
          onEditQuotation={handleEditQuotation}
          onNavigateToStages={handleNavigateToStages}
        />
      )
    }

    if (activeView === 'estimator' && (currentRole === 'admin' || currentRole === 'owner' || currentRole === 'site-manager')) {
      return <MaterialEstimator currentRole={currentRole} />
    }

    if (activeView === 'labor' && (currentRole === 'admin' || currentRole === 'owner' || currentRole === 'site-manager')) {
      return <LaborAttendanceTracker />
    }

    if (activeView === 'quotation' && (currentRole === 'admin' || currentRole === 'owner')) {
      return <SmartQuotationEngine quotationToEdit={quotationToEdit} onClearEdit={() => setQuotationToEdit(null)} />
    }

    if (activeView === 'electrical' && (currentRole === 'admin' || currentRole === 'owner' || currentRole === 'site-manager')) {
      return <ElectricalProvisionsComponent />
    }

    if (activeView === 'stages' && (currentRole === 'admin' || currentRole === 'owner')) {
      return (
        <ConstructionStagesConfig
          quotation={quotationForStages}
          onBack={() => {
            setQuotationForStages(null)
            setActiveView(quotationForStages ? 'quotations' : 'dashboard')
          }}
          onProceed={(config) => {
            setStagesConfig(config)
            setActiveView('agreement')
          }}
        />
      )
    }

    if (activeView === 'agreement' && quotationForStages && stagesConfig) {
      return (
        <AgreementDocument
          quotation={quotationForStages}
          stagesConfig={stagesConfig}
          onBack={() => setActiveView('stages')}
        />
      )
    }

    switch (currentRole) {
      case 'owner':
        return <OwnerDashboard onNewQuotation={() => setActiveView('quotation')} />
      case 'admin':
        return <AdminDashboard projects={currentProjects} onProjectUpdate={handleProjectUpdate} onNewQuotation={() => setActiveView('quotation')} />
      case 'site-manager':
        return <SiteManagerView projects={currentProjects} onProjectUpdate={handleProjectUpdate} />
      case 'client':
        if (!clientPhone) {
          return <ClientLogin onLogin={handleClientLogin} />
        }
        return selectedClientProject ? (
          <ClientPortal project={selectedClientProject} onLogout={handleClientLogout} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No project found for your account</p>
            <p className="text-sm text-gray-400 mt-2">Please contact support for assistance</p>
          </div>
        )
      default:
        return null
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
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
      />

      {(currentRole === 'admin' || currentRole === 'owner' || currentRole === 'site-manager') && (
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveView('dashboard')}
                aria-label="Go to Dashboard"
                aria-current={activeView === 'dashboard' ? 'page' : undefined}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${activeView === 'dashboard'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                Dashboard
              </button>
              {(currentRole === 'admin' || currentRole === 'owner') && (
                <>
                  <button
                    onClick={() => setActiveView('quotations')}
                    aria-label="View Quotations"
                    aria-current={activeView === 'quotations' ? 'page' : undefined}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${activeView === 'quotations'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Quotations
                  </button>
                  <button
                    onClick={() => setActiveView('quotation')}
                    aria-label="Create Smart Quotation"
                    aria-current={activeView === 'quotation' ? 'page' : undefined}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${activeView === 'quotation'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Smart Quotation
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveView('estimator')}
                aria-label="Material Estimator Tool"
                aria-current={activeView === 'estimator' ? 'page' : undefined}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${activeView === 'estimator'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                Material Estimator
              </button>
              <button
                onClick={() => setActiveView('labor')}
                aria-label="Labor & Attendance Management"
                aria-current={activeView === 'labor' ? 'page' : undefined}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${activeView === 'labor'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                Labor & Attendance
              </button>
              <button
                onClick={() => setActiveView('electrical')}
                aria-label="Electrical Provisions"
                aria-current={activeView === 'electrical' ? 'page' : undefined}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${activeView === 'electrical'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                Electrical Provisions
              </button>
              {(currentRole === 'admin' || currentRole === 'owner') && (
                <>
                  <button
                    onClick={() => setActiveView('stages')}
                    aria-label="Construction Stages Configuration"
                    aria-current={activeView === 'stages' ? 'page' : undefined}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${activeView === 'stages'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Construction Stages
                  </button>
                  {/* Reports tab - Owner only, hidden from Admin */}
                  {currentRole === 'owner' && (
                    <button
                      onClick={() => setActiveView('reports')}
                      aria-label="Reports & Analytics"
                      aria-current={activeView === 'reports' ? 'page' : undefined}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${activeView === 'reports'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Reports
                    </button>
                  )}
                  <button
                    onClick={() => setActiveView('settings')}
                    aria-label="Application Settings"
                    aria-current={activeView === 'settings' ? 'page' : undefined}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${activeView === 'settings'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Settings
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {renderRoleView()}
      </main>
    </div>
  )
}

export default App
