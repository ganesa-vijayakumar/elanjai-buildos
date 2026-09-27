import { Project } from '../../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Building2 } from 'lucide-react'

interface ProjectUnitsProps {
  project: Project
}

export function ProjectUnits({ project }: ProjectUnitsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Apartment Units
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 text-center py-8">
            Unit management features will be available for apartment projects
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
