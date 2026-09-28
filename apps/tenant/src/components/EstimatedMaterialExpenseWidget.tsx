import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Cube, PencilSimple, Check, X } from '@phosphor-icons/react'
import { UserRole } from '@/lib/database.types'

interface EstimatedMaterialExpenseWidgetProps {
    value: number
    onUpdate: (newValue: number) => void
    currentRole: UserRole
    isLoading?: boolean
}

export function EstimatedMaterialExpenseWidget({
    value,
    onUpdate,
    currentRole,
    isLoading = false
}: EstimatedMaterialExpenseWidgetProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState('')

    // Check if user can edit (owner or admin only)
    const canEdit = currentRole === 'owner' || currentRole === 'admin'

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(2)} Cr`
        } else if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)} L`
        } else {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount)
        }
    }

    const handleEditClick = () => {
        setIsEditing(true)
        setEditValue(value.toString())
    }

    const handleSaveClick = () => {
        const newValue = parseFloat(editValue) || 0
        onUpdate(newValue)
        setIsEditing(false)
        setEditValue('')
    }

    const handleCancelClick = () => {
        setIsEditing(false)
        setEditValue('')
    }

    return (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Cube size={20} weight="fill" className="text-orange-600" />
                            <p className="text-sm text-gray-600 font-medium">Est. Material Expense</p>
                        </div>

                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                    <Input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="pl-8 h-12 text-xl font-bold"
                                        min="0"
                                        step="1000"
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-10 w-10 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                        onClick={handleSaveClick}
                                        disabled={isLoading}
                                    >
                                        <Check size={20} weight="bold" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={handleCancelClick}
                                        disabled={isLoading}
                                    >
                                        <X size={20} weight="bold" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <p className="text-3xl font-bold text-orange-600">
                                    {formatCurrency(value)}
                                </p>
                                {canEdit && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-gray-400 hover:text-orange-600"
                                        onClick={handleEditClick}
                                        disabled={isLoading}
                                    >
                                        <PencilSimple size={16} />
                                    </Button>
                                )}
                            </div>
                        )}

                        <p className="text-xs text-gray-500 mt-1">
                            Included in margin calculation
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
