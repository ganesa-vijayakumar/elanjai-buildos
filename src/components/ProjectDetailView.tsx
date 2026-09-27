import { ProjectDashboard } from './ProjectDashboard';
import { Project } from '@/lib/types';

interface ProjectDetailViewProps {
  project: Project;
  onUpdate: (project: Project) => void;
  onBack?: () => void;
}

export function ProjectDetailView({ project, onUpdate, onBack }: ProjectDetailViewProps) {
  return (
    <ProjectDashboard 
      project={project} 
      onProjectUpdate={onUpdate}
      onBack={onBack || (() => {})}
    />
  );
}
