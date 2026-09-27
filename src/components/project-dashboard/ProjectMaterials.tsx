import { Project } from '../../lib/types'
import { MaterialTracking } from '../MaterialTracking'

interface ProjectMaterialsProps {
  project: Project
  onProjectUpdate: (project: Project) => void
}

export function ProjectMaterials({ project, onProjectUpdate }: ProjectMaterialsProps) {
  return <MaterialTracking project={project} onProjectUpdate={onProjectUpdate} />
}
