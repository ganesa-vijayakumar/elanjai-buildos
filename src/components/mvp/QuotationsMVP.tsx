import { useState } from 'react'
import api from '../../lib/api'
import { useQuotations, getQuotationStatusInfo, getPackageInfo, fetchStageTemplates } from '../../hooks/useQuotations'
import { useUsers } from '../../hooks/useUsers'
import { formatFullCurrency } from '../../hooks/useDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'
import {
    Plus,
    FileText,
    Phone,
    MapPin,
    Trash,
    ArrowRight,
    User,
    UsersThree,
    CheckCircle,
    CalendarCheck,
    PencilSimple
} from '@phosphor-icons/react'
import { PackageName, PACKAGE_RATES, DEFAULT_STAGES, StageBreakdown } from '../../lib/database.types'

interface QuotationsMVPProps {
    onSiteCreated?: () => void;
}

export function QuotationsMVP({ onSiteCreated }: QuotationsMVPProps) {
    const { quotations, loading, createQuotation, updateQuotation, deleteQuotation, convertToSite } = useQuotations()
    const { clients, siteManagers, loading: usersLoading, createUser } = useUsers()

    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showDetailDialog, setShowDetailDialog] = useState(false)
    const [showConvertDialog, setShowConvertDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [selectedQuotation, setSelectedQuotation] = useState<typeof quotations[0] | null>(null)
    const [converting, setConverting] = useState(false)
    const [savingEdit, setSavingEdit] = useState(false)

    // Form state for creating quotation
    const [createStep, setCreateStep] = useState<1 | 2 | 3>(1)
    const [selectedClientId, setSelectedClientId] = useState<string>('')
    const [isCreatingClient, setIsCreatingClient] = useState(false)
    const [creatingClientLoading, setCreatingClientLoading] = useState(false)

    const [form, setForm] = useState({
        client_name: '',
        client_phone: '',
        client_email: '',
        location: '',
        builtup_area: '',
        package_name: 'standard' as PackageName,
    })

    // Form state for converting to site
    const [convertForm, setConvertForm] = useState({
        clientUserId: '',
        managerIds: [] as string[],
        expectedEndDate: '',
    })

    // Form state for editing draft quotation
    const [editForm, setEditForm] = useState({
        client_name: '',
        client_phone: '',
        client_email: '',
        location: '',
        builtup_area: '',
        package_name: 'standard' as PackageName,
    })

    const resetForm = () => {
        setCreateStep(1)
        setSelectedClientId('')
        setIsCreatingClient(false)
        setForm({
            client_name: '',
            client_phone: '',
            client_email: '',
            location: '',
            builtup_area: '',
            package_name: 'standard',
        })
    }

    const resetConvertForm = () => {
        setConvertForm({
            clientUserId: '',
            managerIds: [],
            expectedEndDate: '',
        })
    }

    const handleCreateClient = async () => {
        if (!form.client_name || !form.client_phone || !form.client_email || !form.location) {
            toast.error('All fields (Name, Phone, Email, Location) are mandatory for new clients')
            return false
        }

        // Basic validations
        const phoneRegex = /^\+?[0-9]{10,12}$/
        if (!phoneRegex.test(form.client_phone.replace(/\s+/g, ''))) {
            toast.error('Please enter a valid phone number (10-12 digits)')
            return false
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(form.client_email)) {
            toast.error('Please enter a valid email address')
            return false
        }

        setCreatingClientLoading(true)
        const { data, error } = await createUser({
            role: 'CLIENT',
            full_name: form.client_name,
            phone: form.client_phone,
            email: form.client_email,
            location: form.location
        })
        setCreatingClientLoading(false)

        if (error || !data) {
            toast.error('Failed to create client: ' + error)
            return false
        }

        toast.success('Client created successfully')
        setSelectedClientId(data.id)
        return true
    }

    const handleNextStep = async () => {
        if (createStep === 1) {
            if (isCreatingClient) {
                const success = await handleCreateClient()
                if (success) setCreateStep(2)
            } else {
                if (!selectedClientId) {
                    toast.error('Please select a client or create a new one')
                    return
                }
                const client = clients.find(c => c.id === selectedClientId)
                if (client) {
                    setForm(prev => ({
                        ...prev,
                        client_name: client.full_name || '',
                        client_phone: client.phone || '',
                        client_email: client.email || '',
                        location: client.location || prev.location || ''
                    }))
                }
                setCreateStep(2)
            }
        } else if (createStep === 2) {
            if (!form.builtup_area || Number(form.builtup_area) <= 0) {
                toast.error('Please enter a valid built-up area')
                return
            }
            setCreateStep(3)
        }
    }

    const handleCreate = async () => {
        if (!form.client_name || !form.builtup_area) {
            toast.error('Missing required fields')
            return
        }

        const { error } = await createQuotation({
            client_name: form.client_name,
            client_phone: form.client_phone || undefined,
            client_email: form.client_email || undefined,
            location: form.location || undefined,
            builtup_area: Number(form.builtup_area),
            package_name: form.package_name,
        })

        if (error) {
            toast.error('Failed to create quotation: ' + error.message)
        } else {
            toast.success('Quotation created successfully!')
            setShowCreateDialog(false)
            resetForm()
        }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this quotation?')) return

        const { error } = await deleteQuotation(id)
        if (error) {
            toast.error('Failed to delete: ' + error.message)
        } else {
            toast.success('Quotation deleted')
        }
    }

    const openConvertDialog = (quotation: typeof quotations[0]) => {
        if (quotation.status !== 'signed') {
            toast.error('Only signed quotations can be converted to sites')
            return
        }
        setSelectedQuotation(quotation)
        resetConvertForm()
        setShowConvertDialog(true)
    }

    const handleConvertToSite = async () => {
        if (!selectedQuotation) return

        if (!convertForm.clientUserId) {
            toast.error('Please select a client user for this site')
            return
        }

        if (!convertForm.expectedEndDate) {
            toast.error('Please select an expected end date')
            return
        }

        setConverting(true)
        try {
            const { error, siteId } = await convertToSite(selectedQuotation.id, {
                clientUserId: convertForm.clientUserId,
                managerIds: convertForm.managerIds.length > 0 ? convertForm.managerIds : undefined,
                expectedEndDate: convertForm.expectedEndDate,
            })

            if (error) {
                toast.error('Failed to convert: ' + error.message)
            } else {
                toast.success('Quotation converted to site successfully!')
                setShowConvertDialog(false)
                setShowDetailDialog(false)
                resetConvertForm()
                if (onSiteCreated) {
                    onSiteCreated()
                }
            }
        } finally {
            setConverting(false)
        }
    }

    const handleMarkAsSigned = async (id: string) => {
        const { error } = await updateQuotation(id, { status: 'signed' })
        if (error) {
            toast.error('Failed to update status: ' + error.message)
        } else {
            toast.success('Quotation marked as signed!')
            if (selectedQuotation && selectedQuotation.id === id) {
                setSelectedQuotation({ ...selectedQuotation, status: 'signed' })
            }
        }
    }

    const openEditDialog = (quotation: typeof quotations[0]) => {
        setSelectedQuotation(quotation)
        setEditForm({
            client_name: quotation.client_name,
            client_phone: quotation.client_phone || '',
            client_email: quotation.client_email || '',
            location: quotation.location || '',
            builtup_area: String(quotation.builtup_area || ''),
            package_name: quotation.package_name || 'standard',
        })
        setShowEditDialog(true)
    }

    const handleSaveEdit = async () => {
        if (!selectedQuotation) return
        if (!editForm.client_name || !editForm.builtup_area) {
            toast.error('Please enter client name and built-up area')
            return
        }

        setSavingEdit(true)
        try {
            const rate = PACKAGE_RATES[editForm.package_name]
            const totalValue = Number(editForm.builtup_area) * rate
            const stageBreakdown: StageBreakdown[] = await fetchStageTemplates(totalValue)

            const { error } = await updateQuotation(selectedQuotation.id, {
                client_name: editForm.client_name,
                client_phone: editForm.client_phone || null,
                client_email: editForm.client_email || null,
                location: editForm.location || null,
                builtup_area: Number(editForm.builtup_area),
                package_name: editForm.package_name,
                rate_per_sqft: rate,
                total_value: totalValue,
                stage_breakdown: stageBreakdown,
            })

            if (error) {
                toast.error('Failed to update quotation: ' + error.message)
            } else {
                toast.success('Quotation updated successfully!')
                setShowEditDialog(false)
                setShowDetailDialog(false)
            }
        } finally {
            setSavingEdit(false)
        }
    }

    const viewQuotation = (quotation: typeof quotations[0]) => {
        setSelectedQuotation(quotation)
        setShowDetailDialog(true)
    }

    const toggleManagerSelection = (managerId: string) => {
        setConvertForm(prev => {
            const isSelected = prev.managerIds.includes(managerId)
            return {
                ...prev,
                managerIds: isSelected
                    ? prev.managerIds.filter(id => id !== managerId)
                    : [...prev.managerIds, managerId]
            }
        })
    }

    // Calculate totals for form preview
    const previewRate = PACKAGE_RATES[form.package_name]
    const previewTotal = form.builtup_area ? Number(form.builtup_area) * previewRate : 0

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-10 w-40 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
                    <p className="text-gray-500">Create and manage construction quotations</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Quotation
                </Button>
            </div>

            {/* Quotations List */}
            {quotations.length === 0 ? (
                <Card className="py-12">
                    <div className="text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No quotations yet</p>
                        <p className="text-sm text-gray-400 mt-1">Create your first quotation to get started</p>
                        <Button
                            onClick={() => setShowCreateDialog(true)}
                            className="mt-4 bg-red-600 hover:bg-red-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Quotation
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quotations.map((quotation) => {
                        const statusInfo = getQuotationStatusInfo(quotation.status)
                        const packageInfo = getPackageInfo(quotation.package_name!)

                        return (
                            <Card
                                key={quotation.id}
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => viewQuotation(quotation)}
                            >
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-xs text-gray-400 font-mono">{quotation.quotation_number}</p>
                                            <h3 className="font-semibold text-gray-900 mt-1">{quotation.client_name}</h3>
                                        </div>
                                        <Badge className={`${statusInfo.bgColor} ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <MapPin className="w-4 h-4" />
                                            <span>{quotation.location || 'No location'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Phone className="w-4 h-4" />
                                            <span>{quotation.client_phone || 'No phone'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-400">{quotation.builtup_area} sq.ft × ₹{packageInfo.rate}</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {formatFullCurrency(quotation.total_value || 0)}
                                            </p>
                                        </div>
                                        <Badge variant="outline">{packageInfo.label}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Create Dialog (Multi-Step Wizard) */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Create New Quotation - Step {createStep} of 3
                        </DialogTitle>
                    </DialogHeader>

                    {/* Step 1: Client Selection */}
                    {createStep === 1 && (
                        <div className="space-y-4 py-4">
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg max-w-xs">
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingClient(false)}
                                    className={`flex-1 text-sm font-medium py-1.5 rounded-md ${!isCreatingClient ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Select Existing
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingClient(true)}
                                    className={`flex-1 text-sm font-medium py-1.5 rounded-md ${isCreatingClient ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Create New
                                </button>
                            </div>

                            {!isCreatingClient ? (
                                <div>
                                    <Label>Select Client *</Label>
                                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a client..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map(client => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.full_name || 'Unnamed Client'} {client.phone && `- ${client.phone}`}
                                                </SelectItem>
                                            ))}
                                            {clients.length === 0 && (
                                                <SelectItem value="none" disabled>No clients found</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <Label>Client Name *</Label>
                                        <Input
                                            placeholder="Mr. Ravi Kumar"
                                            value={form.client_name}
                                            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Phone *</Label>
                                            <Input
                                                placeholder="+91 98765 43210"
                                                value={form.client_phone}
                                                onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Email *</Label>
                                            <Input
                                                type="email"
                                                placeholder="client@email.com"
                                                value={form.client_email}
                                                onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Location *</Label>
                                        <Input
                                            placeholder="RS Puram, Coimbatore"
                                            value={form.location}
                                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Step 2: Area & Package Details */}
                    {createStep === 2 && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Built-up Area (sq.ft) *</Label>
                                    <Input
                                        type="number"
                                        placeholder="1200"
                                        value={form.builtup_area}
                                        onChange={(e) => setForm({ ...form, builtup_area: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Package</Label>
                                    <Select
                                        value={form.package_name}
                                        onValueChange={(v) => setForm({ ...form, package_name: v as PackageName })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="economy">Economy - ₹1500/sqft</SelectItem>
                                            <SelectItem value="standard">Standard - ₹1650/sqft</SelectItem>
                                            <SelectItem value="premium">Premium - ₹1800/sqft</SelectItem>
                                            <SelectItem value="luxury">Luxury - ₹2100/sqft</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {createStep === 3 && (
                        <div className="space-y-4 py-4">
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Client Details</p>
                                    <p className="font-medium text-gray-900 break-all">{form.client_name}</p>
                                    {(form.client_phone || form.client_email) && (
                                        <p className="text-sm text-gray-600 break-all">
                                            {[form.client_phone, form.client_email].filter(Boolean).join(' • ')}
                                        </p>
                                    )}
                                </div>
                                <div className="border-t border-gray-200 pt-3">
                                    <p className="text-sm text-gray-500">Quotation Summary</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-gray-700">
                                            {form.builtup_area} sq.ft × ₹{previewRate}/sqft ({(form.package_name).charAt(0).toUpperCase() + form.package_name.slice(1)} Package)
                                        </span>
                                        <span className="text-xl font-bold text-gray-900 break-all pl-2 text-right">
                                            {formatFullCurrency(previewTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {createStep === 1 ? (
                            <>
                                <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleNextStep} disabled={creatingClientLoading}>
                                    {isCreatingClient ? (creatingClientLoading ? 'Creating Client...' : 'Create & Continue') : 'Continue'}
                                </Button>
                            </>
                        ) : createStep === 2 ? (
                            <>
                                <Button variant="outline" onClick={() => setCreateStep(1)}>
                                    Back
                                </Button>
                                <Button onClick={handleNextStep}>
                                    Review
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setCreateStep(2)}>
                                    Back
                                </Button>
                                <Button onClick={handleCreate} className="bg-red-600 hover:bg-red-700">
                                    Confirm & Create
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    {selectedQuotation && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center justify-between">
                                    <span>Quotation {selectedQuotation.quotation_number}</span>
                                    <Badge className={`${getQuotationStatusInfo(selectedQuotation.status).bgColor} ${getQuotationStatusInfo(selectedQuotation.status).color}`}>
                                        {getQuotationStatusInfo(selectedQuotation.status).label}
                                    </Badge>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="py-4">
                                {/* Client Info */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-500">Client Name</p>
                                        <p className="font-medium">{selectedQuotation.client_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="font-medium">{selectedQuotation.client_phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Location</p>
                                        <p className="font-medium">{selectedQuotation.location || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Created</p>
                                        <p className="font-medium">
                                            {new Date(selectedQuotation.created_at).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="p-4 bg-gray-50 rounded-lg mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Package</p>
                                            <p className="font-medium">{getPackageInfo(selectedQuotation.package_name!).label}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Rate</p>
                                            <p className="font-medium">₹{selectedQuotation.rate_per_sqft}/sqft</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <span className="text-gray-600">
                                            {selectedQuotation.builtup_area} sq.ft × ₹{selectedQuotation.rate_per_sqft}
                                        </span>
                                        <span className="text-2xl font-bold text-gray-900">
                                            {formatFullCurrency(selectedQuotation.total_value || 0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Stage Breakdown */}
                                <div className="mb-6">
                                    <h4 className="font-medium text-gray-900 mb-3">Stage-wise Breakdown</h4>
                                    <div className="space-y-2">
                                        {(selectedQuotation.stage_breakdown?.length
                                            ? selectedQuotation.stage_breakdown
                                            : DEFAULT_STAGES).map((stage: StageBreakdown) => {
                                                const amount = stage.amount ||
                                                    (selectedQuotation.total_value
                                                        ? (stage.percentage / 100) * selectedQuotation.total_value
                                                        : 0)
                                                return (
                                                    <div key={stage.stage} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                        <span className="text-sm text-gray-600">{stage.label} ({stage.percentage}%)</span>
                                                        <span className="font-medium">{formatFullCurrency(amount)}</span>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(selectedQuotation.id)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash className="w-4 h-4 mr-1" />
                                    Delete
                                </Button>
                                <div className="flex-1"></div>
                                {selectedQuotation.status === 'draft' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(selectedQuotation)}
                                        >
                                            <PencilSimple className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleMarkAsSigned(selectedQuotation.id)}
                                        >
                                            Mark as Signed
                                        </Button>
                                    </>
                                )}
                                {selectedQuotation.status === 'signed' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                try {
                                                    const r = await api.get(`/quotations/${selectedQuotation.id}/agreement.pdf`, { responseType: 'blob' })
                                                    const url = URL.createObjectURL(r.data)
                                                    window.open(url, '_blank')
                                                } catch { toast.error('Failed to generate agreement') }
                                            }}
                                        >
                                            <FileText className="w-4 h-4 mr-1" />
                                            Agreement
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => openConvertDialog(selectedQuotation)}
                                        >
                                            <ArrowRight className="w-4 h-4 mr-1" />
                                            Convert to Site
                                        </Button>
                                    </>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Convert to Site Dialog */}
            <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Convert Quotation to Site</DialogTitle>
                    </DialogHeader>

                    {selectedQuotation && (
                        <div className="py-4 space-y-6">
                            {/* Quotation Summary */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-2">Converting Quotation</p>
                                <p className="font-medium text-gray-900">{selectedQuotation.client_name}</p>
                                <p className="text-sm text-gray-500">{selectedQuotation.location}</p>
                                <p className="text-lg font-bold text-gray-900 mt-2">
                                    {formatFullCurrency(selectedQuotation.total_value || 0)}
                                </p>
                            </div>

                            {/* Client User Selection (Required) */}
                            <div>
                                <Label className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Select Client User *
                                </Label>
                                <p className="text-xs text-gray-500 mb-2">
                                    The client will be able to view their site progress and updates
                                </p>
                                <Select
                                    value={convertForm.clientUserId}
                                    onValueChange={(v) => setConvertForm({ ...convertForm, clientUserId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a client..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.length === 0 ? (
                                            <SelectItem value="" disabled>No clients available</SelectItem>
                                        ) : (
                                            clients.map(client => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.full_name || client.phone || 'Unnamed Client'}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Expected End Date (Required) */}
                            <div>
                                <Label className="flex items-center gap-2">
                                    <CalendarCheck className="w-4 h-4" />
                                    Expected End Date *
                                </Label>
                                <p className="text-xs text-gray-500 mb-2">
                                    When is this project expected to complete?
                                </p>
                                <Input
                                    type="date"
                                    value={convertForm.expectedEndDate}
                                    onChange={(e) => setConvertForm({ ...convertForm, expectedEndDate: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full"
                                />
                            </div>

                            {/* Site Manager Selection (Optional) */}
                            <div>
                                <Label className="flex items-center gap-2">
                                    <UsersThree className="w-4 h-4" />
                                    Assign Site Managers (Optional)
                                </Label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Site managers can add expenses and update progress
                                </p>
                                {siteManagers.length === 0 ? (
                                    <p className="text-sm text-gray-400 p-3 bg-gray-50 rounded">
                                        No site managers available. You can assign them later.
                                    </p>
                                ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {siteManagers.map(manager => {
                                            const isSelected = convertForm.managerIds.includes(manager.id)
                                            return (
                                                <button
                                                    key={manager.id}
                                                    type="button"
                                                    onClick={() => toggleManagerSelection(manager.id)}
                                                    className={`flex items-center justify-between w-full p-3 rounded-lg border transition-colors text-left ${isSelected
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <span className="font-medium text-gray-900">
                                                        {manager.full_name || manager.phone || 'Unnamed Manager'}
                                                    </span>
                                                    {isSelected && (
                                                        <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowConvertDialog(false); resetConvertForm(); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConvertToSite}
                            disabled={converting || !convertForm.clientUserId || !convertForm.expectedEndDate}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {converting ? 'Converting...' : 'Create Site'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Draft Quotation Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Quotation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Client Name *</Label>
                            <Input
                                placeholder="Mr. Ravi Kumar"
                                value={editForm.client_name}
                                onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    placeholder="+91 98765 43210"
                                    value={editForm.client_phone}
                                    onChange={(e) => setEditForm({ ...editForm, client_phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    placeholder="client@email.com"
                                    value={editForm.client_email}
                                    onChange={(e) => setEditForm({ ...editForm, client_email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Location</Label>
                            <Input
                                placeholder="RS Puram, Coimbatore"
                                value={editForm.location}
                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Built-up Area (sq.ft) *</Label>
                                <Input
                                    type="number"
                                    placeholder="1200"
                                    value={editForm.builtup_area}
                                    onChange={(e) => setEditForm({ ...editForm, builtup_area: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Package</Label>
                                <Select
                                    value={editForm.package_name}
                                    onValueChange={(v) => setEditForm({ ...editForm, package_name: v as PackageName })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="economy">Economy - ₹1500/sqft</SelectItem>
                                        <SelectItem value="standard">Standard - ₹1650/sqft</SelectItem>
                                        <SelectItem value="premium">Premium - ₹1800/sqft</SelectItem>
                                        <SelectItem value="luxury">Luxury - ₹2100/sqft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Live Preview */}
                        {editForm.builtup_area && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-2">Updated Price Preview</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">
                                        {editForm.builtup_area} sq.ft × ₹{PACKAGE_RATES[editForm.package_name]}/sqft
                                    </span>
                                    <span className="text-xl font-bold text-gray-900">
                                        {formatFullCurrency(Number(editForm.builtup_area) * PACKAGE_RATES[editForm.package_name])}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={savingEdit} className="bg-red-600 hover:bg-red-700">
                            {savingEdit ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
