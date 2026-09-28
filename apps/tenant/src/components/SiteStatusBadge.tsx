import { Badge } from '@/components/ui/badge'
import { SiteStatus } from '@/lib/database.types'
import { Circle, Pause, XCircle, CheckCircle, Play, CircleNotch } from '@phosphor-icons/react'

export const SITE_STATUS_LABELS: Record<SiteStatus, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    hold: 'On Hold',
    cancelled: 'Cancelled',
    completed: 'Completed'
}

interface SiteStatusBadgeProps {
    status: SiteStatus
    size?: 'sm' | 'md' | 'lg'
    showIcon?: boolean
}

const statusConfig: Record<SiteStatus, {
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    className: string
    icon: React.ReactNode
}> = {
    open: {
        variant: 'outline',
        className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
        icon: <Circle size={12} weight="bold" />
    },
    in_progress: {
        variant: 'default',
        className: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500',
        icon: <CircleNotch size={12} weight="bold" className="animate-spin-slow" />
    },
    hold: {
        variant: 'outline',
        className: 'bg-amber-100 text-amber-800 border-amber-500 hover:bg-amber-200',
        icon: <Pause size={12} weight="fill" />
    },
    cancelled: {
        variant: 'destructive',
        className: 'bg-red-500 hover:bg-red-600 text-white border-red-500',
        icon: <XCircle size={12} weight="fill" />
    },
    completed: {
        variant: 'secondary',
        className: 'bg-gray-800 hover:bg-gray-900 text-white border-gray-800',
        icon: <CheckCircle size={12} weight="fill" />
    }
}

export function SiteStatusBadge({ status, size = 'md', showIcon = true }: SiteStatusBadgeProps) {
    // Fallback to 'open' if status is undefined or unknown
    const safeStatus = statusConfig[status] ? status : 'open'
    const config = statusConfig[safeStatus]
    const label = SITE_STATUS_LABELS[safeStatus]

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-0.5',
        lg: 'text-base px-3 py-1'
    }

    return (
        <Badge
            variant={config.variant}
            className={`${config.className} ${sizeClasses[size]} font-medium inline-flex items-center gap-1`}
        >
            {showIcon && config.icon}
            {label}
        </Badge>
    )
}

// Status action buttons for changing site status
interface SiteStatusActionsProps {
    currentStatus: SiteStatus
    onStatusChange: (newStatus: SiteStatus) => void
    disabled?: boolean
}

export function SiteStatusActions({ currentStatus, onStatusChange, disabled = false }: SiteStatusActionsProps) {
    const getAvailableTransitions = (status: SiteStatus): SiteStatus[] => {
        switch (status) {
            case 'open':
                return ['in_progress', 'cancelled']
            case 'in_progress':
                return ['hold', 'completed', 'cancelled']
            case 'hold':
                return ['in_progress', 'cancelled']
            case 'cancelled':
                return [] // Cannot transition from cancelled? Maybe reopen?
            case 'completed':
                return [] // Cannot transition from completed? Maybe reopen?
            default:
                return []
        }
    }

    const availableTransitions = getAvailableTransitions(currentStatus)

    if (availableTransitions.length === 0) {
        return null
    }

    return (
        <div className="flex gap-2 flex-wrap">
            {availableTransitions.map((newStatus) => (
                <button
                    key={newStatus}
                    onClick={() => onStatusChange(newStatus)}
                    disabled={disabled}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'
                        } ${newStatus === 'in_progress'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : newStatus === 'hold'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                : newStatus === 'cancelled'
                                    ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                                    : newStatus === 'completed'
                                        ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                                        : 'bg-gray-50 text-gray-700 border-gray-300'
                        }`}
                >
                    {newStatus === 'in_progress' && (currentStatus === 'hold' ? 'Resume Work' : 'Start Work')}
                    {newStatus === 'hold' && 'Put on Hold'}
                    {newStatus === 'cancelled' && 'Cancel Site'}
                    {newStatus === 'completed' && 'Mark Completed'}
                </button>
            ))}
        </div>
    )
}
