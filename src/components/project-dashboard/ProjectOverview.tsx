import { useState, useEffect } from 'react'
import { Project, ActivityLog } from '../../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'

interface ProjectOverviewProps {
  project: Project
  onProjectUpdate: (project: Project) => void
}

export function ProjectOverview({ project, onProjectUpdate }: ProjectOverviewProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([])

  useEffect(() => {
    const mockActivities: ActivityLog[] = [
      {
        id: '1',
        projectId: project.id,
        type: 'stage-complete',
        title: 'Stage Completed',
        description: `${project.stages[4]?.name || 'Ground Floor Slab'} completed`,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        user: 'Site Manager',
      },
      {
        id: '2',
        projectId: project.id,
        type: 'payment',
        title: 'Payment Received',
        description: 'Received ₹3,60,000 for Ground Floor Slab completion',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        user: 'Owner',
      },
      {
        id: '3',
        projectId: project.id,
        type: 'stage-start',
        title: 'Stage Started',
        description: `${project.currentStage} work initiated`,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        user: 'Site Manager',
      },
    ]
    setActivities(mockActivities)
  }, [project])

  const completionPercentage = project.completionPercentage || 0
  const currentStageObj = project.stages.find(s => s.status === 'in-progress') || project.stages[0]
  
  const getTimelineStatus = () => {
    const daysElapsed = Math.floor(
      (new Date().getTime() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    const estimatedDays = project.stages.reduce((sum, s) => sum + (s.estimatedDays || 0), 0)
    const expectedProgress = (daysElapsed / estimatedDays) * 100

    if (completionPercentage > expectedProgress + 10) {
      return { label: 'Ahead of Schedule', color: 'bg-blue-500', icon: TrendingUp }
    } else if (completionPercentage < expectedProgress - 10) {
      return { label: 'Delayed', color: 'bg-red-500', icon: AlertTriangle }
    } else {
      return { label: 'On Track', color: 'bg-green-500', icon: CheckCircle2 }
    }
  }

  const timelineStatus = getTimelineStatus()
  const TimelineIcon = timelineStatus.icon

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-40 h-40">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - completionPercentage / 100)}`}
                    className="text-red-600"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {Math.round(completionPercentage)}%
                    </div>
                    <div className="text-xs text-gray-600">Complete</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current Stage:</span>
                <span className="font-medium text-gray-900">{project.currentStage}</span>
              </div>
              {currentStageObj && currentStageObj.progress !== undefined && (
                <div className="space-y-1">
                  <Progress value={currentStageObj.progress} className="h-2" />
                  <p className="text-xs text-gray-600 text-right">
                    {currentStageObj.progress}% of stage complete
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`${timelineStatus.color} p-3 rounded-full text-white`}>
                <TimelineIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-semibold text-lg text-gray-900">
                  {timelineStatus.label}
                </div>
                <p className="text-sm text-gray-600">
                  Project is progressing as planned
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <div className="text-xs text-gray-600">Start Date</div>
                <div className="text-sm font-medium text-gray-900">
                  {format(new Date(project.createdAt), 'dd MMM yyyy')}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Expected Completion</div>
                <div className="text-sm font-medium text-gray-900">
                  {format(
                    new Date(
                      new Date(project.createdAt).getTime() +
                        project.stages.reduce((sum, s) => sum + (s.estimatedDays || 0), 0) *
                          24 *
                          60 *
                          60 *
                          1000
                    ),
                    'dd MMM yyyy'
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-8">
                No recent activity
              </p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      {activity.type === 'stage-complete' && (
                        <CheckCircle2 className="h-5 w-5 text-red-600" />
                      )}
                      {activity.type === 'payment' && (
                        <TrendingUp className="h-5 w-5 text-red-600" />
                      )}
                      {activity.type === 'stage-start' && (
                        <Clock className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600 flex-shrink-0">
                        {format(new Date(activity.timestamp), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      By {activity.user}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
