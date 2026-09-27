import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PackageConfiguration } from './settings/PackageConfiguration'
import { MaterialMaster } from './settings/MaterialMaster'
import { BrandMaster } from './settings/BrandMaster'
import { StageTemplate } from './settings/StageTemplate'
import { ExtraWorksMaster } from './settings/ExtraWorksMaster'
import { CompanyProfile } from './settings/CompanyProfile'
import { Building, Package, Cube, Tag, ListChecks, Wrench } from '@phosphor-icons/react'
import { UserRole } from '@/lib/types'

interface SettingsProps {
  currentRole?: UserRole
}

export function Settings({ currentRole = 'owner' }: SettingsProps) {
  // Admin cannot access Company Profile or Package Rates, default to materials
  const defaultTab = currentRole === 'admin' ? 'materials' : 'company'
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Check if current role can access restricted tabs
  const canAccessCompanyProfile = currentRole === 'owner'
  const canAccessPackageRates = currentRole === 'owner'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your company profile and master data</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-2 h-auto bg-transparent p-0">
          {/* Company Profile - Owner only */}
          {canAccessCompanyProfile && (
            <TabsTrigger
              value="company"
              className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <Building size={24} />
              <span className="text-xs font-medium">Company</span>
            </TabsTrigger>
          )}
          {/* Package Rates - Owner only */}
          {canAccessPackageRates && (
            <TabsTrigger
              value="packages"
              className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <Package size={24} />
              <span className="text-xs font-medium">Packages</span>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="materials"
            className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
          >
            <Cube size={24} />
            <span className="text-xs font-medium">Materials</span>
          </TabsTrigger>
          <TabsTrigger
            value="brands"
            className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
          >
            <Tag size={24} />
            <span className="text-xs font-medium">Brands</span>
          </TabsTrigger>
          <TabsTrigger
            value="stages"
            className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
          >
            <ListChecks size={24} />
            <span className="text-xs font-medium">Stages</span>
          </TabsTrigger>
          <TabsTrigger
            value="extra-works"
            className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
          >
            <Wrench size={24} />
            <span className="text-xs font-medium">Extra Works</span>
          </TabsTrigger>
        </TabsList>

        {canAccessCompanyProfile && (
          <TabsContent value="company">
            <CompanyProfile />
          </TabsContent>
        )}

        {canAccessPackageRates && (
          <TabsContent value="packages">
            <PackageConfiguration />
          </TabsContent>
        )}

        <TabsContent value="materials">
          <MaterialMaster />
        </TabsContent>

        <TabsContent value="brands">
          <BrandMaster />
        </TabsContent>

        <TabsContent value="stages">
          <StageTemplate />
        </TabsContent>

        <TabsContent value="extra-works">
          <ExtraWorksMaster />
        </TabsContent>
      </Tabs>
    </div>
  )
}

