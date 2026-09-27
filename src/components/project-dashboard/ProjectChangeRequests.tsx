import { Project } from '../../lib/types'
import { ChangeRequestManagement } from '../ChangeRequestManagement'

interface ProjectChangeRequestsProps {
  project: Project
  onProjectUpdate: (project: Project) => void
  currentRole?: 'admin' | 'owner' | 'site-manager' | 'client'
}

export function ProjectChangeRequests({ project, onProjectUpdate, currentRole = 'admin' }: ProjectChangeRequestsProps) {
  return (
    <ChangeRequestManagement
      project={project}
      onProjectUpdate={onProjectUpdate}
      currentRole={currentRole}
    />
  )
}
