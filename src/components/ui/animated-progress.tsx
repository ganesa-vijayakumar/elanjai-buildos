import { cn } from '@/lib/utils'

interface AnimatedProgressProps {
  value: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'auto' | 'primary' | 'green' | 'blue' | 'amber' | 'red'
}

export function AnimatedProgress({ 
  value, 
  className, 
  showLabel = false,
  size = 'md',
  color = 'auto'
}: AnimatedProgressProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const getColorClass = (val: number) => {
    if (color !== 'auto') {
      const colorMap = {
        primary: 'bg-primary',
        green: 'bg-green-600',
        blue: 'bg-blue-600',
        amber: 'bg-amber-600',
        red: 'bg-red-600'
      }
      return colorMap[color]
    }
    
    if (val >= 80) return 'bg-green-600'
    if (val >= 50) return 'bg-blue-600'
    if (val >= 30) return 'bg-amber-600'
    return 'bg-red-600'
  }

  return (
    <div className="space-y-2">
      <div className={cn(
        "relative w-full overflow-hidden rounded-full bg-gray-200",
        sizeClasses[size],
        className
      )}>
        <div 
          className={cn(
            "h-full transition-all duration-700 ease-out",
            getColorClass(value)
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-right text-muted-foreground font-medium">
          {Math.round(value)}%
        </p>
      )}
    </div>
  )
}

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
}

export function CircularProgress({ 
  value, 
  size = 120, 
  strokeWidth = 8,
  className,
  showValue = true 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  const getColor = (val: number) => {
    if (val >= 80) return 'text-green-600'
    if (val >= 50) return 'text-blue-600'
    if (val >= 30) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-700 ease-out", getColor(value))}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{Math.round(value)}%</span>
        </div>
      )}
    </div>
  )
}
