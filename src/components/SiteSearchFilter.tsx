import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SiteStatus } from '@/lib/database.types'
import { SITE_STATUS_LABELS } from '@/components/SiteStatusBadge'
import { MagnifyingGlass, X, Funnel } from '@phosphor-icons/react'

interface SiteSearchFilterProps {
    searchQuery: string
    onSearchChange: (query: string) => void
    selectedStatuses: SiteStatus[]
    onStatusFilterChange: (statuses: SiteStatus[]) => void
    resultCount?: number
}

const ALL_STATUSES: SiteStatus[] = ['open', 'in_progress', 'hold', 'cancelled', 'completed']

export function SiteSearchFilter({
    searchQuery,
    onSearchChange,
    selectedStatuses,
    onStatusFilterChange,
    resultCount
}: SiteSearchFilterProps) {
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    const toggleStatus = (status: SiteStatus) => {
        if (selectedStatuses.includes(status)) {
            onStatusFilterChange(selectedStatuses.filter(s => s !== status))
        } else {
            onStatusFilterChange([...selectedStatuses, status])
        }
    }

    const clearFilters = () => {
        onSearchChange('')
        onStatusFilterChange(['open', 'in_progress']) // Default
    }

    const hasActiveFilters = searchQuery ||
        !(selectedStatuses.length === 2 && selectedStatuses.includes('open') && selectedStatuses.includes('in_progress'))

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                {/* Search Input */}
                <div className="relative flex-1">
                    <MagnifyingGlass
                        size={18}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <Input
                        type="text"
                        placeholder="Search by site name, client, or location..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 pr-10"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Filter Toggle */}
                <Button
                    variant={isFilterOpen ? "secondary" : "outline"}
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="gap-2"
                >
                    <Funnel size={18} weight={isFilterOpen ? "fill" : "regular"} />
                    Filter
                    {hasActiveFilters && (
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                    )}
                </Button>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters} className="text-gray-500">
                        Clear
                    </Button>
                )}
            </div>

            {/* Status Filter Pills */}
            {isFilterOpen && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                    <span className="text-sm font-medium text-gray-600 mr-2">Status:</span>
                    {ALL_STATUSES.map((status) => {
                        const isSelected = selectedStatuses.includes(status)
                        return (
                            <button
                                key={status}
                                onClick={() => toggleStatus(status)}
                                className={`px-3 py-1 text-sm font-medium rounded-full border transition-colors ${isSelected
                                    ? status === 'open'
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : status === 'in_progress'
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                            : status === 'hold'
                                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                                : status === 'cancelled'
                                                    ? 'bg-red-100 text-red-800 border-red-300'
                                                    : 'bg-gray-100 text-gray-800 border-gray-300'
                                    : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                {SITE_STATUS_LABELS[status]}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Results Count */}
            {resultCount !== undefined && (
                <div className="text-sm text-gray-500">
                    Showing {resultCount} site{resultCount !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    )
}
