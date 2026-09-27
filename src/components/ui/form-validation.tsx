import { cn } from '@/lib/utils'

interface FormFieldErrorProps {
  error?: string
  className?: string
}

export function FormFieldError({ error, className }: FormFieldErrorProps) {
  if (!error) return null

  return (
    <p className={cn("text-sm text-red-600 mt-1 animate-in fade-in slide-in-from-top-1 duration-200", className)}>
      {error}
    </p>
  )
}

interface FormFieldWrapperProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  htmlFor?: string
  className?: string
}

export function FormFieldWrapper({
  label,
  error,
  required,
  children,
  htmlFor,
  className,
}: FormFieldWrapperProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {children}
      <FormFieldError error={error} />
    </div>
  )
}

export function getInputClassName(hasError?: boolean) {
  return cn(
    "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm transition-colors",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    hasError 
      ? "border-red-500 focus-visible:ring-red-500" 
      : "border-input focus-visible:ring-ring"
  )
}
