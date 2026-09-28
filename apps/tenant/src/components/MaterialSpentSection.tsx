import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    MaterialSpent,
    MaterialSpentType,
    MATERIAL_SPENT_TYPES,
} from '@/lib/types'
import { UserRole } from '@/lib/database.types'
import { Cube, PencilSimple, Check, X } from '@phosphor-icons/react'

interface MaterialSpentSectionProps {
    siteId: string
    materials: MaterialSpent[]
    onUpdateMaterial: (materialType: MaterialSpentType, quantity: number) => void
    currentRole: UserRole
    isLoading?: boolean
}

export function MaterialSpentSection({
    siteId,
    materials,
    onUpdateMaterial,
    currentRole,
    isLoading = false
}: MaterialSpentSectionProps) {
    const [editingMaterial, setEditingMaterial] = useState<MaterialSpentType | null>(null)
    const [editValue, setEditValue] = useState<string>('')

    // Check if user can edit (owner or admin only)
    const canEdit = currentRole === 'owner' || currentRole === 'admin'

    const getMaterialQuantity = (materialType: MaterialSpentType): number => {
        const material = materials.find(m => m.materialType === materialType)
        return material?.quantity || 0
    }

    const handleEditClick = (materialType: MaterialSpentType) => {
        setEditingMaterial(materialType)
        setEditValue(getMaterialQuantity(materialType).toString())
    }

    const handleSaveClick = () => {
        if (editingMaterial) {
            const quantity = parseFloat(editValue) || 0
            onUpdateMaterial(editingMaterial, quantity)
            setEditingMaterial(null)
            setEditValue('')
        }
    }

    const handleCancelClick = () => {
        setEditingMaterial(null)
        setEditValue('')
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Cube size={24} weight="fill" className="text-orange-600" />
                    Material Spent
                    {!canEdit && (
                        <Badge variant="outline" className="ml-auto text-xs font-normal">
                            Read-only
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {MATERIAL_SPENT_TYPES.map(({ type, label, unit }) => {
                        const quantity = getMaterialQuantity(type)
                        const isEditing = editingMaterial === type

                        return (
                            <div
                                key={type}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-200 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">{label}</span>
                                    {canEdit && !isEditing && (
                                        <button
                                            onClick={() => handleEditClick(type)}
                                            disabled={isLoading}
                                            className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                                            title="Edit"
                                        >
                                            <PencilSimple size={14} />
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-8 text-sm"
                                            min="0"
                                            step="0.5"
                                            autoFocus
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                                            onClick={handleSaveClick}
                                        >
                                            <Check size={16} />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-red-600 hover:text-red-700"
                                            onClick={handleCancelClick}
                                        >
                                            <X size={16} />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {quantity.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-xs text-gray-500">{unit}</span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
