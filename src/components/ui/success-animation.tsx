import { CheckCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface SuccessCheckmarkProps {
  className?: string
  size?: number
  onAnimationComplete?: () => void
}

export function SuccessCheckmark({ className, size = 64, onAnimationComplete }: SuccessCheckmarkProps) {
  return (
    <div 
      className={cn("inline-flex items-center justify-center", className)}
      onAnimationEnd={onAnimationComplete}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping" />
        <CheckCircle 
          size={size} 
          weight="fill" 
          className="relative text-green-600 animate-in zoom-in duration-300" 
        />
      </div>
    </div>
  )
}

interface SuccessMessageProps {
  title: string
  message?: string
  onClose?: () => void
  autoClose?: number
  className?: string
}

export function SuccessMessage({ 
  title, 
  message, 
  onClose, 
  autoClose,
  className 
}: SuccessMessageProps) {
  if (autoClose && onClose) {
    setTimeout(onClose, autoClose)
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center animate-fade-in",
      className
    )}>
      <SuccessCheckmark size={80} />
      <h3 className="text-2xl font-bold text-gray-900 mt-4">{title}</h3>
      {message && (
        <p className="text-gray-600 mt-2 max-w-md">{message}</p>
      )}
    </div>
  )
}
