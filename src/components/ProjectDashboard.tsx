import { useState } from 'react'
import { Project, ActivityLog, StageStatus } from '../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { 
  ArrowLeft, 
  Calendar, 
  IndianRupee, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Circle
} from 'lucide-react'
import { ProjectOverview } from './project-dashboard/ProjectOverview'
import { ProjectStages } from './project-dashboard/ProjectStages'
import { ProjectMaterials } from './project-dashboard/ProjectMaterials'
import { ProjectPayments } from './project-dashboard/ProjectPayments'
import { ProjectDocuments } from './project-dashboard/ProjectDocuments'
import { ProjectChangeRequests } from './project-dashboard/ProjectChangeRequests'
import { ProjectUnits } from './project-dashboard/ProjectUnits'

interface ProjectDashboardProps {
  project: Project
  onBack: () => void
  onProjectUpdate: (project: Project) => void
}

export function ProjectDashboard({ project, onBack, onProjectUpdate }: ProjectDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
      case 'completed':
        return 'bg-green-500'
      case 'delayed':
        return 'bg-red-500'
      case 'on-hold':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const completedStages = project.stages.filter(s => s.status === 'completed').length
  const totalStages = project.stages.length
  const daysElapsed = Math.floor(
    (new Date().getTime() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  const estimatedTotalDays = project.stages.reduce((sum, s) => sum + (s.estimatedDays || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <Badge className={getStatusColor(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">{project.location}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(project.totalCost)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Stages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {completedStages}/{totalStages} Completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {daysElapsed}/{estimatedTotalDays} Elapsed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(project.totalCollected || 0)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              of {formatCurrency(project.totalCost)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stages">Stages</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="change-requests">Change Requests</TabsTrigger>
          {project.type === 'apartment' && (
            <TabsTrigger value="units">Units</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ProjectOverview project={project} onProjectUpdate={onProjectUpdate} />
        </TabsContent>

        <TabsContent value="stages" className="mt-6">
          <ProjectStages project={project} onProjectUpdate={onProjectUpdate} />
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          <ProjectMaterials project={project} onProjectUpdate={onProjectUpdate} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <ProjectPayments project={project} onProjectUpdate={onProjectUpdate} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <ProjectDocuments project={project} />
        </TabsContent>

        <TabsContent value="change-requests" className="mt-6">
          <ProjectChangeRequests project={project} onProjectUpdate={onProjectUpdate} currentRole="owner" />
        </TabsContent>

        {project.type === 'apartment' && (
          <TabsContent value="units" className="mt-6">
            <ProjectUnits project={project} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
