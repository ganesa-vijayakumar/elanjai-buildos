import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveTableWrapperProps {
  children: ReactNode
  className?: string
}

export function ResponsiveTableWrapper({ children, className }: ResponsiveTableWrapperProps) {
  return (
    <div className={cn("w-full overflow-x-auto -mx-4 sm:mx-0", className)}>
      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
        <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  )
}
