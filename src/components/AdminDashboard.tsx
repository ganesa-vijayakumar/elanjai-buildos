import { useState, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Project, Quotation, ChangeRequest } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartLine,
  ChartBar,
  ChartDonut,
  FolderOpen,
  FileText,
  CurrencyInr,
  WarningCircle,
  CheckCircle,
  Clock,
  TrendUp,
  CalendarCheck,
  Wallet,
  ArrowRight,
  Plus
} from '@phosphor-icons/react';
import { MaterialInventory } from './MaterialInventory';
import { CollectionDialog } from './CollectionDialog';
import { ProjectDetailView } from './ProjectDetailView';
import { NewQuotationButton } from './NewQuotationButton';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, addDays } from 'date-fns';

interface AdminDashboardProps {
  projects: Project[];
  onProjectUpdate: (project: Project) => void;
  onNewQuotation: () => void;
}

export function AdminDashboard({ projects, onProjectUpdate, onNewQuotation }: AdminDashboardProps) {
  const [selectedProjectForCollection, setSelectedProjectForCollection] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [quotations] = useKV<Quotation[]>('quotations', []);
  const [changeRequests] = useKV<ChangeRequest[]>('change-requests', []);

  const safeProjects = Array.isArray(projects) ? projects : [];
  const activeProjects = safeProjects.filter(p => ['pre-construction', 'foundation', 'structure', 'finishing', 'handover'].includes(p.status));
  const delayedProjects = safeProjects.filter(p => p.status === 'delayed');
  const pendingQuotations = (quotations || []).filter(q => ['draft', 'finalized', 'sent'].includes(q.status));
  const totalContractValue = activeProjects.reduce((sum, p) => sum + p.totalCost, 0);
  const pendingChangeRequests = (changeRequests || []).filter(cr => cr.status === 'pending');

  const totalRevenue = safeProjects.reduce((sum, p) => sum + p.totalCost, 0);
  const totalCollected = safeProjects.reduce((sum, p) => sum + p.totalCollected, 0);
  const totalExpenses = safeProjects.reduce((sum, p) => sum + p.totalExpenses, 0);
  const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;

  const projectsByStatus = useMemo(() => {
    const statusMap = {
      'pre-construction': 0,
      'in-progress': 0,
      'completed': 0,
      'on-hold': 0
    };

    projects.forEach(p => {
      if (p.status === 'pre-construction') statusMap['pre-construction']++;
      else if (p.status === 'completed') statusMap['completed']++;
      else if (p.status === 'on-hold') statusMap['on-hold']++;
      else statusMap['in-progress']++;
    });

    return statusMap;
  }, [safeProjects]);

  const monthlyQuotationData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM yyyy'),
        date: date,
        total: 0,
        signed: 0
      };
    });

    (quotations || []).forEach(q => {
      const createdDate = new Date(q.createdAt);
      const monthData = last6Months.find(m =>
        isWithinInterval(createdDate, {
          start: startOfMonth(m.date),
          end: endOfMonth(m.date)
        })
      );

      if (monthData) {
        monthData.total++;
        if (q.status === 'signed' || q.status === 'converted') {
          monthData.signed++;
        }
      }
    });

    return last6Months;
  }, [quotations]);

  const revenueByMonth = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM yyyy'),
        revenue: 0
      };
    });

    safeProjects.forEach(p => {
      const createdDate = new Date(p.createdAt);
      const monthData = last6Months.find(m =>
        format(createdDate, 'MMM yyyy') === m.month
      );

      if (monthData) {
        monthData.revenue += p.totalCost;
      }
    });

    return last6Months;
  }, [safeProjects]);

  const recentActivity = useMemo(() => {
    const activities: Array<{
      id: string;
      type: 'quotation' | 'stage' | 'change-request';
      icon: React.ReactNode;
      title: string;
      timestamp: string;
    }> = [];

    (quotations || [])
      .filter(q => q.status === 'signed')
      .slice(0, 3)
      .forEach(q => {
        activities.push({
          id: `q-${q.id}`,
          type: 'quotation',
          icon: <CheckCircle size={20} weight="fill" className="text-emerald-600" />,
          title: `Quotation ${q.quotationNumber} signed by ${q.clientName}`,
          timestamp: q.updatedAt
        });
      });

    safeProjects.forEach(p => {
      const completedStages = p.stages.filter(s => s.status === 'completed');
      if (completedStages.length > 0) {
        const lastCompleted = completedStages[completedStages.length - 1];
        if (lastCompleted.completion?.completedAt) {
          activities.push({
            id: `stage-${p.id}-${lastCompleted.id}`,
            type: 'stage',
            icon: <CheckCircle size={20} weight="fill" className="text-blue-600" />,
            title: `Project ${p.name} completed ${lastCompleted.name} stage`,
            timestamp: lastCompleted.completion.completedAt
          });
        }
      }
    });

    (changeRequests || [])
      .filter(cr => cr.status === 'approved')
      .slice(0, 3)
      .forEach(cr => {
        activities.push({
          id: `cr-${cr.id}`,
          type: 'change-request',
          icon: <TrendUp size={20} weight="fill" className="text-amber-600" />,
          title: `Change Request ${cr.crNumber} approved (+₹${cr.costImpact.toLocaleString('en-IN')})`,
          timestamp: cr.approvedAt || cr.updatedAt
        });
      });

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [quotations, safeProjects, changeRequests]);

  const upcomingMilestones = useMemo(() => {
    const milestones: Array<{
      id: string;
      projectName: string;
      stageName: string;
      dueDate: string;
      type: 'stage' | 'payment';
    }> = [];

    const today = new Date();
    const next7Days = addDays(today, 7);

    safeProjects.forEach(p => {
      const inProgressStages = p.stages.filter(s => s.status === 'in-progress');
      inProgressStages.forEach(stage => {
        if (stage.plannedEndDate) {
          const endDate = new Date(stage.plannedEndDate);
          if (isWithinInterval(endDate, { start: today, end: next7Days })) {
            milestones.push({
              id: `${p.id}-${stage.id}`,
              projectName: p.name,
              stageName: stage.name,
              dueDate: stage.plannedEndDate,
              type: 'stage'
            });
          }
        }
      });

      const pendingPayments = p.stages.filter(s =>
        s.status === 'completed' &&
        (p.totalCollected < s.budgetAmount)
      );

      pendingPayments.forEach(stage => {
        milestones.push({
          id: `payment-${p.id}-${stage.id}`,
          projectName: p.name,
          stageName: `${stage.name} Payment`,
          dueDate: stage.completion?.completedAt || new Date().toISOString(),
          type: 'payment'
        });
      });
    });

    return milestones.slice(0, 5);
  }, [safeProjects]);

  const handleCollectionAdded = (proj: Project, amount: number, entry: import('@/lib/types').CollectionEntry) => {
    const updatedProject = {
      ...proj,
      totalCollected: proj.totalCollected + amount,
      collections: [...(proj.collections || []), entry],
    };

    onProjectUpdate(updatedProject);
    setSelectedProjectForCollection(null);
  };

  if (selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        onUpdate={onProjectUpdate}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  const maxRevenue = Math.max(...revenueByMonth.map(m => m.revenue), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChartBar size={32} weight="fill" className="text-red-600" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard & Analytics</h2>
            <p className="text-gray-600">Overview dashboard with key metrics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <NewQuotationButton onClick={onNewQuotation} size="default" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Projects</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{activeProjects.length}</p>
                <p className="text-xs text-gray-500 mt-1">Click to view list</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FolderOpen size={32} weight="fill" className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Quotations</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{pendingQuotations.length}</p>
                <p className="text-xs text-gray-500 mt-1">Click to view</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <FileText size={32} weight="fill" className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Contract Value</p>
                <p className="text-4xl font-bold text-emerald-600 mt-2">
                  ₹{totalContractValue >= 10000000
                    ? `${(totalContractValue / 10000000).toFixed(1)}Cr`
                    : `${(totalContractValue / 100000).toFixed(1)}L`
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">All active projects</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CurrencyInr size={32} weight="fill" className="text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={delayedProjects.length > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Delayed Projects</p>
                <p className={`text-4xl font-bold mt-2 ${delayedProjects.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {delayedProjects.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </div>
              <div className={`p-3 rounded-lg ${delayedProjects.length > 0 ? 'bg-red-200' : 'bg-gray-100'}`}>
                <WarningCircle size={32} weight="fill" className={delayedProjects.length > 0 ? 'text-red-600' : 'text-gray-600'} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartDonut size={24} weight="fill" className="text-red-600" />
              Project Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(projectsByStatus).map(([status, count]) => {
                const total = projects.length;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const statusConfig = {
                  'pre-construction': { label: 'Pre-Construction', color: 'bg-gray-500' },
                  'in-progress': { label: 'In Progress', color: 'bg-blue-500' },
                  'completed': { label: 'Completed', color: 'bg-emerald-500' },
                  'on-hold': { label: 'On Hold', color: 'bg-amber-500' }
                };
                const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-500' };

                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{config.label}</span>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`${config.color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar size={24} weight="fill" className="text-red-600" />
              Monthly Quotations
              <span className="text-sm font-normal text-gray-500 ml-auto">Last 6 months</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyQuotationData.map((month) => {
                const conversionRate = month.total > 0 ? (month.signed / month.total) * 100 : 0;
                const maxCount = Math.max(...monthlyQuotationData.map(m => m.total), 1);

                return (
                  <div key={month.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 w-24">{month.month}</span>
                      <span className="text-xs text-gray-600">
                        {month.total} total, {month.signed} signed ({conversionRate.toFixed(0)}% conversion)
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-blue-500 h-6 rounded-full"
                          style={{ width: `${(month.total / maxCount) * 100}%` }}
                        />
                        <div
                          className="bg-emerald-500 h-6 rounded-full absolute top-0 left-0"
                          style={{ width: `${(month.signed / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>Total Quotations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span>Signed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLine size={24} weight="fill" className="text-red-600" />
            Revenue Trend
            <span className="text-sm font-normal text-gray-500 ml-auto">Total contract value by month</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {revenueByMonth.map((month) => (
              <div key={month.month} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-24">{month.month}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-8 rounded-full flex items-center justify-end pr-3"
                    style={{ width: `${(month.revenue / maxRevenue) * 100}%` }}
                  >
                    {month.revenue > 0 && (
                      <span className="text-white text-xs font-bold">
                        ₹{month.revenue >= 10000000
                          ? `${(month.revenue / 10000000).toFixed(1)}Cr`
                          : `${(month.revenue / 100000).toFixed(1)}L`
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={24} weight="fill" className="text-red-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3 border-l-2 border-gray-200 pl-3">
                    {activity.icon}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck size={24} weight="fill" className="text-red-600" />
              Upcoming Milestones
              <span className="text-sm font-normal text-gray-500 ml-auto">Next 7 days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMilestones.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming milestones</p>
              ) : (
                upcomingMilestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${milestone.type === 'stage' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                      {milestone.type === 'stage' ? (
                        <CheckCircle size={20} weight="fill" className="text-blue-600" />
                      ) : (
                        <Wallet size={20} weight="fill" className="text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{milestone.projectName}</p>
                      <p className="text-sm text-gray-600">{milestone.stageName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Approvals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingChangeRequests.length}</p>
                <Button variant="link" className="text-red-600 p-0 h-auto mt-2 text-sm">
                  View all <ArrowRight size={16} className="ml-1" />
                </Button>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock size={32} weight="fill" className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Collection Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{collectionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-2">
                  ₹{(totalCollected / 100000).toFixed(1)}L / ₹{(totalRevenue / 100000).toFixed(1)}L
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendUp size={32} weight="fill" className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Expenses</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  ₹{(totalExpenses / 100000).toFixed(1)}L
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  All project expenses
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <CurrencyInr size={32} weight="fill" className="text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedProjectForCollection && (
        <CollectionDialog
          open={true}
          onOpenChange={(open) => !open && setSelectedProjectForCollection(null)}
          project={selectedProjectForCollection}
          onCollectionAdded={handleCollectionAdded}
        />
      )}
    </div>
  );
}
