import { useSites } from '../../hooks/useSites'
import { useCollections, useCollectionsByStage } from '../../hooks/useCollections'
import { formatCurrency, formatFullCurrency } from '../../hooks/useDashboard'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import {
    House,
    MapPin,
    Calendar,
    CheckCircle,
    Clock,
    Money
} from '@phosphor-icons/react'
import { DEFAULT_STAGES } from '../../lib/database.types'

export function ClientPortalMVP() {
    const { user } = useAuth()
    const { sites, loading: sitesLoading } = useSites()

    // Client sees only their site(s) - for now we show the first one
    const clientSite = sites[0]
    const { collections, totalCollections } = useCollections(clientSite?.id)
    const { collectionsByStage } = useCollectionsByStage(clientSite?.id)

    // Calculate progress based on stage
    const getStageProgress = (stage: string | null) => {
        const stageProgress: Record<string, number> = {
            advance: 5,
            foundation: 15,
            plinth: 25,
            rcc_roof: 40,
            brickwork: 55,
            plastering: 70,
            electrical_plumbing: 80,
            finishing: 92,
            handover: 100,
        }
        return stageProgress[stage || 'advance'] || 0
    }

    const progress = clientSite ? getStageProgress(clientSite.current_stage) : 0
    const pendingAmount = (clientSite?.total_value || 0) - totalCollections

    if (sitesLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-32 bg-gray-200 rounded-xl"></div>
                <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
        )
    }

    if (!clientSite) {
        return (
            <div className="text-center py-12">
                <House className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">No Project Found</h2>
                <p className="text-gray-500 mt-2">
                    Your project details will appear here once assigned.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                    Please contact ELANJAI BUILDOS for assistance.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Welcome Header */}
            <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <House className="w-8 h-8 text-green-600" weight="duotone" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome, {user?.fullName || 'Valued Customer'}!
                </h1>
                <p className="text-gray-500">Track your dream home progress</p>
            </div>

            {/* Project Card */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
                    <h2 className="text-xl font-bold">{clientSite.site_name}</h2>
                    <div className="flex items-center gap-2 mt-2 text-red-100">
                        <MapPin className="w-4 h-4" />
                        <span>{clientSite.location || 'Location not specified'}</span>
                    </div>
                </div>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-gray-500">Total Value</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatFullCurrency(clientSite.total_value || 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Start Date</p>
                            <p className="text-xl font-bold text-gray-900">
                                {clientSite.start_date
                                    ? new Date(clientSite.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'Not set'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Expected Completion</p>
                            <p className="text-xl font-bold text-green-600">
                                {clientSite.expected_end_date
                                    ? new Date(clientSite.expected_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'TBD'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Progress Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                        Construction Progress
                        <Badge className="bg-green-100 text-green-700">
                            {progress}% Complete
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Progress value={progress} className="h-3 mb-4" />
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Current Stage:</span>
                        </div>
                        <span className="font-medium text-gray-900">
                            {DEFAULT_STAGES.find(s => s.stage === clientSite.current_stage)?.label || 'Not Started'}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Money className="w-5 h-5 text-gray-400" />
                        Payment Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-green-50 rounded-lg text-center">
                            <p className="text-sm text-green-600 font-medium">Total Paid</p>
                            <p className="text-2xl font-bold text-green-700 mt-1">
                                {formatCurrency(totalCollections)}
                            </p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg text-center">
                            <p className="text-sm text-orange-600 font-medium">Pending</p>
                            <p className="text-2xl font-bold text-orange-700 mt-1">
                                {formatCurrency(pendingAmount)}
                            </p>
                        </div>
                    </div>

                    {/* Stage-wise payments */}
                    <div className="space-y-3">
                        {DEFAULT_STAGES.map((stage) => {
                            const stageCollections = collectionsByStage[stage.stage]?.total || 0
                            const expectedAmount = clientSite.total_value ? (stage.percentage / 100) * clientSite.total_value : 0
                            const isPaid = stageCollections >= expectedAmount
                            const isPartial = stageCollections > 0 && stageCollections < expectedAmount

                            return (
                                <div key={stage.stage} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPaid ? 'bg-green-100' : isPartial ? 'bg-yellow-100' : 'bg-gray-100'
                                            }`}>
                                            {isPaid ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                                            ) : (
                                                <Clock className={`w-5 h-5 ${isPartial ? 'text-yellow-600' : 'text-gray-400'}`} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{stage.label}</p>
                                            <p className="text-xs text-gray-500">{stage.percentage}%</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${isPaid ? 'text-green-600' : 'text-gray-400'}`}>
                                            {formatCurrency(expectedAmount)}
                                        </p>
                                        {isPartial && (
                                            <p className="text-xs text-yellow-600">
                                                Paid: {formatCurrency(stageCollections)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="bg-gray-50">
                <CardContent className="py-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Have questions about your project?</p>
                        <p className="font-medium text-gray-900 mt-1">
                            Contact ELANJAI BUILDOS
                        </p>
                        <p className="text-sm text-red-600 mt-1">+91 98765 43210</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
