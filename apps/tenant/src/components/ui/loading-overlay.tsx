import { Spinner } from '@phosphor-icons/react'

interface LoadingOverlayProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingOverlay({ message = 'Loading...', fullScreen = false }: LoadingOverlayProps) {
  const baseClasses = "flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm"
  const classes = fullScreen 
    ? `${baseClasses} fixed inset-0 z-50`
    : `${baseClasses} absolute inset-0 rounded-lg`

  return (
    <div className={classes}>
      <Spinner size={48} className="text-primary animate-spin" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  )
}

export function PDFGeneratingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
        <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-8 rounded-2xl">
          <Spinner size={64} className="text-primary animate-spin" weight="bold" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Generating PDF...</h3>
        <p className="text-muted-foreground">This will just take a moment</p>
      </div>
      
      <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-accent animate-[shimmer_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
      </div>
    </div>
  )
}
