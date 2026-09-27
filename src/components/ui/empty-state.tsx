import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { 
  FolderOpen, 
  FileText, 
  Users, 
  Package, 
  Calendar,
  ClipboardText,
  Image as ImageIcon
} from '@phosphor-icons/react'

interface EmptyStateProps {
  icon?: 'folder' | 'document' | 'users' | 'package' | 'calendar' | 'clipboard' | 'image'
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

const icons = {
  folder: FolderOpen,
  document: FileText,
  users: Users,
  package: Package,
  calendar: Calendar,
  clipboard: ClipboardText,
  image: ImageIcon,
}

export function EmptyState({ icon = 'folder', title, description, action, children }: EmptyStateProps) {
  const Icon = icons[icon]

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 relative">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl" />
        <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-2xl">
          <Icon size={64} weight="duotone" className="text-primary/40" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      
      {action && (
        <Button onClick={action.onClick} size="lg">
          {action.label}
        </Button>
      )}
      
      {children}
    </div>
  )
}
