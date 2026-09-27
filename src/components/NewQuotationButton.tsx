import { Plus } from '@phosphor-icons/react'
import { Button } from './ui/button'

interface NewQuotationButtonProps {
    onClick: () => void
    size?: 'default' | 'sm' | 'lg' | 'icon'
    className?: string
}

export function NewQuotationButton({ onClick, size = 'lg', className = '' }: NewQuotationButtonProps) {
    return (
        <Button
            onClick={onClick}
            className={`bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg ${className}`}
            size={size}
        >
            <Plus size={size === 'sm' ? 16 : 20} weight="bold" className="mr-2" />
            New Quotation
        </Button>
    )
}
