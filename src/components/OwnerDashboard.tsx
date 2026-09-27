import { useState, useEffect } from 'react';
import { useSites } from '@/hooks/useSites';
import { useMaterialSpent } from '@/hooks/useMaterialSpent';
import { mapSiteToProject } from '@/lib/siteMapper';
import { SiteWithFinancials, SiteStatus } from '@/lib/database.types';
import { KPICard } from './KPICard';
import { HardHat, ChartLineUp, Money, TrendUp } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProjectDetailView } from './ProjectDetailView';
import { NewQuotationButton } from './NewQuotationButton';
import { SiteStatusBadge } from './SiteStatusBadge';
import { SiteSearchFilter } from './SiteSearchFilter';

interface OwnerDashboardProps {
  onNewQuotation: () => void;
}

export function OwnerDashboard({ onNewQuotation }: OwnerDashboardProps) {
  const { sites, loading, refetch } = useSites();
  const { materialSpentList, fetchMaterialSpent } = useMaterialSpent(); // Generic fetch? No, hook needs adjustment or we fetch all?
  // Current useMaterialSpent fetches BY SITE ID. 
  // We need to fetch materials when checking detailed view.

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<SiteStatus[]>(['open', 'in_progress']);
  const [selectedSite, setSelectedSite] = useState<SiteWithFinancials | null>(null);

  useEffect(() => {
    if (selectedSite) {
      fetchMaterialSpent(selectedSite.id);
    }
  }, [selectedSite]);

  // Filter sites based on search and status
  const filteredSites = sites.filter(site => {
    const matchesSearch = searchQuery === '' ||
      site.site_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site.location && site.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatuses.includes(site.status as SiteStatus); // Cast to Enum

    return matchesSearch && matchesStatus;
  });

  const activeSites = sites.filter(s => s.status === 'in_progress' || s.status === 'open');
  // Backend returns totalCollections/expenses as numbers (floats/doubles), formatted checks needed.

  const totalCollections = sites.reduce((sum, s) => sum + (s.total_collections || 0), 0);
  const totalExpenses = sites.reduce((sum, s) => sum + (s.total_expenses || 0), 0);
  const netMargin = totalCollections - totalExpenses;

  // Handle Search and Filter
  const handleFilterChange = (filtered: any[]) => { // Kept for safety if legacy code calls it, though unused
    // no-op
  };

  if (loading && sites.length === 0) {
    return <div className="p-8 text-center bg-white rounded-lg shadow mt-8">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="text-gray-500">Loading your projects...</p>
      </div>
    </div>;
  }

  if (selectedSite) {
    // Map to Project
    const mappedProject = mapSiteToProject(selectedSite, materialSpentList);

    return (
      <ProjectDetailView
        project={mappedProject}
        onUpdate={() => refetch()}
        onBack={() => setSelectedSite(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Owner Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage your construction projects and finances</p>
        </div>
        <NewQuotationButton onClick={onNewQuotation} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Active Sites"
          value={activeSites.length.toString()}
          icon={HardHat}
          trend="neutral"
        />
        <KPICard
          label="Total Collections"
          value={`₹${(totalCollections / 100000).toFixed(2)}L`}
          icon={Money}
          trend="positive"
          valueColor="text-emerald-600"
        />
        <KPICard
          label="Total Expenses"
          value={`₹${(totalExpenses / 100000).toFixed(2)}L`}
          icon={ChartLineUp}
          trend="negative"
          valueColor="text-rose-600"
        />
        <KPICard
          label="Net Margin"
          value={`₹${(netMargin / 100000).toFixed(2)}L`}
          icon={TrendUp}
          trend={netMargin > 0 ? 'positive' : 'negative'}
          valueColor={netMargin > 0 ? 'text-gray-900' : 'text-rose-600'}
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Project Portfolio</h3>
        </div>
        <div className="p-4">
          <SiteSearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStatuses={selectedStatuses}
            onStatusFilterChange={setSelectedStatuses}
            resultCount={filteredSites.length}
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Site Name</TableHead>
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Package</TableHead>
                <TableHead className="font-semibold">Current Stage</TableHead>
                <TableHead className="font-semibold">Financials</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSites.map((site) => (
                <TableRow key={site.id} className="hover:bg-gray-50">
                  <TableCell className="font-semibold text-gray-900">{site.site_name}</TableCell>
                  <TableCell className="text-gray-700">{site.client_name}</TableCell>
                  <TableCell className="text-gray-700">{site.location}</TableCell>
                  <TableCell>
                    <span className="capitalize text-gray-700">{site.package_name}</span>
                  </TableCell>
                  <TableCell className="text-gray-700 capitalize">
                    {site.current_stage ? site.current_stage.replace('_', ' ') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div className="text-emerald-600">Coll: ₹{site.total_collections.toLocaleString()}</div>
                      <div className="text-rose-600">Exp: ₹{site.total_expenses.toLocaleString()}</div>
                    </div>
                  </TableCell>
                  <TableCell><SiteStatusBadge status={site.status} /></TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSite(site)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  );
}
