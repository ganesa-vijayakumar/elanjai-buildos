import { forwardRef, ComponentPropsWithoutRef } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export interface ButtonWithLoadingProps extends ComponentPropsWithoutRef<typeof Button> {
  loading?: boolean
  loadingText?: string
}

export const ButtonWithLoading = forwardRef<HTMLButtonElement, ButtonWithLoadingProps>(
  ({ loading = false, loadingText, children, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={cn(className)}
        {...props}
      >
        {loading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
        {loading && loadingText ? loadingText : children}
      </Button>
    )
  }
)

ButtonWithLoading.displayName = 'ButtonWithLoading'
