import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { MagnifyingGlass, Funnel, Download, Eye, PencilSimple, CopySimple, FileText, PaperPlaneTilt, X, DotsThreeVertical, CalendarBlank, Plus, Check } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'
import { Quotation, QuotationStatus, QUOTATION_STATUS_LABELS, BUILDING_TYPE_LABELS } from '../lib/types'
import { generateMockQuotations } from '../lib/mockData'
import { format } from 'date-fns'
import { ProjectCreationForm } from './ProjectCreationForm'
import { NewQuotationButton } from './NewQuotationButton'

interface QuotationListViewProps {
  onNewQuotation: () => void
  onEditQuotation: (quotation: Quotation) => void
  onNavigateToStages?: (quotation: Quotation) => void
}

export function QuotationListView({ onNewQuotation, onEditQuotation, onNavigateToStages }: QuotationListViewProps) {
  const [quotations, setQuotations] = useKV<Quotation[]>('quotations', generateMockQuotations())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | 'all'>('all')
  const [buildingTypeFilter, setBuildingTypeFilter] = useState<string>('all')
  const [selectedQuotations, setSelectedQuotations] = useState<string[]>([])
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [quotationToCancel, setQuotationToCancel] = useState<Quotation | null>(null)
  const [showProjectCreation, setShowProjectCreation] = useState(false)
  const [selectedQuotationForProject, setSelectedQuotationForProject] = useState<Quotation | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationNotes, setCancellationNotes] = useState('')
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [quotationToView, setQuotationToView] = useState<Quotation | null>(null)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [quotationToSend, setQuotationToSend] = useState<Quotation | null>(null)
  const [sendMethod, setSendMethod] = useState<'email' | 'whatsapp' | 'both'>('email')

  const getStatusBadgeVariant = (status: QuotationStatus) => {
    switch (status) {
      case 'draft':
        return 'secondary'
      case 'finalized':
        return 'default'
      case 'sent':
        return 'outline'
      case 'signed':
        return 'default'
      case 'converted':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getStatusBadgeClass = (status: QuotationStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100'
      case 'finalized':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
      case 'sent':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
      case 'signed':
        return 'bg-green-100 text-green-700 hover:bg-green-100'
      case 'converted':
        return 'bg-purple-100 text-purple-700 hover:bg-purple-100'
      case 'cancelled':
        return 'bg-red-100 text-red-700 hover:bg-red-100'
      default:
        return ''
    }
  }

  const filteredQuotations = (quotations || []).filter((quotation) => {
    const matchesSearch =
      searchQuery === '' ||
      quotation.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter

    const matchesBuildingType =
      buildingTypeFilter === 'all' || quotation.buildingType === buildingTypeFilter

    return matchesSearch && matchesStatus && matchesBuildingType
  })

  const handleSelectAll = () => {
    if (selectedQuotations.length === filteredQuotations.length) {
      setSelectedQuotations([])
    } else {
      setSelectedQuotations(filteredQuotations.map((q) => q.id))
    }
  }

  const handleSelectQuotation = (id: string) => {
    setSelectedQuotations((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    )
  }

  const handleDuplicate = (quotation: Quotation) => {
    const newQuotation: Quotation = {
      ...quotation,
      id: `quot-${Date.now()}`,
      quotationNumber: `Q-${new Date().getFullYear()}-${String((quotations?.length || 0) + 1).padStart(3, '0')}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cancelledAt: undefined,
      cancellationReason: undefined,
      cancellationNotes: undefined,
      convertedToProjectId: undefined,
    }
    setQuotations((current) => [...(current || []), newQuotation])
    toast.success(`Quotation duplicated as ${newQuotation.quotationNumber}`)
  }

  const handleOpenCancelDialog = (quotation: Quotation) => {
    setQuotationToCancel(quotation)
    setCancellationReason('')
    setCancellationNotes('')
    setCancelDialogOpen(true)
  }

  const handleCancelQuotation = () => {
    if (!quotationToCancel) return

    setQuotations((current) =>
      (current || []).map((q) =>
        q.id === quotationToCancel.id
          ? {
            ...q,
            status: 'cancelled' as QuotationStatus,
            cancelledAt: new Date().toISOString(),
            cancellationReason,
            cancellationNotes,
            updatedAt: new Date().toISOString(),
          }
          : q
      )
    )

    toast.success(`Quotation ${quotationToCancel.quotationNumber} has been cancelled`)
    setCancelDialogOpen(false)
    setQuotationToCancel(null)
    setCancellationReason('')
    setCancellationNotes('')
  }

  const handleExportToExcel = () => {
    const selectedData = (quotations || []).filter((q) => selectedQuotations.includes(q.id))
    if (selectedData.length === 0) {
      toast.error('Please select quotations to export')
      return
    }
    toast.success(`Exporting ${selectedData.length} quotation(s) to Excel`)
  }

  const handleCreateProject = (quotation: Quotation) => {
    setSelectedQuotationForProject(quotation)
    setShowProjectCreation(true)
  }

  const handleProjectCreated = (projectId: string) => {
    setShowProjectCreation(false)
    setSelectedQuotationForProject(null)
    toast.success('Project created successfully! Redirecting to projects...')
  }

  const handleViewQuotation = (quotation: Quotation) => {
    setQuotationToView(quotation)
    setViewDialogOpen(true)
  }

  const handleFinalizeQuotation = (quotation: Quotation) => {
    setQuotations((current) =>
      (current || []).map((q) =>
        q.id === quotation.id
          ? {
            ...q,
            status: 'finalized' as QuotationStatus,
            updatedAt: new Date().toISOString(),
          }
          : q
      )
    )
    toast.success(`Quotation ${quotation.quotationNumber} has been finalized`, {
      description: 'You can now send it to the client or generate an agreement.',
    })
  }

  const handleOpenSendDialog = (quotation: Quotation) => {
    setQuotationToSend(quotation)
    setSendMethod('email')
    setSendDialogOpen(true)
  }

  const handleSendToClient = () => {
    if (!quotationToSend) return

    setQuotations((current) =>
      (current || []).map((q) =>
        q.id === quotationToSend.id
          ? {
            ...q,
            status: 'sent' as QuotationStatus,
            updatedAt: new Date().toISOString(),
          }
          : q
      )
    )

    const methodLabel = sendMethod === 'email' ? 'Email' : sendMethod === 'whatsapp' ? 'WhatsApp' : 'Email and WhatsApp'
    toast.success(`Quotation sent via ${methodLabel}`, {
      description: `${quotationToSend.quotationNumber} has been sent to ${quotationToSend.clientName}.`,
    })
    setSendDialogOpen(false)
    setQuotationToSend(null)
  }

  const handleGenerateAgreement = (quotation: Quotation) => {
    if (onNavigateToStages) {
      onNavigateToStages(quotation)
    } else {
      toast.success('Generating Agreement...', {
        description: `Agreement for ${quotation.quotationNumber} is being prepared. Download will start shortly.`,
      })
      // In production, this would trigger PDF generation
    }
  }

  const handleMarkAsSigned = (quotation: Quotation) => {
    setQuotations((current) =>
      (current || []).map((q) =>
        q.id === quotation.id
          ? {
            ...q,
            status: 'signed' as QuotationStatus,
            updatedAt: new Date().toISOString(),
          }
          : q
      )
    )
    toast.success(`Quotation ${quotation.quotationNumber} marked as signed`, {
      description: 'You can now convert this to a project.',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (showProjectCreation && selectedQuotationForProject) {
    return (
      <ProjectCreationForm
        quotation={selectedQuotationForProject}
        onCancel={() => {
          setShowProjectCreation(false)
          setSelectedQuotationForProject(null)
        }}
        onProjectCreated={handleProjectCreated}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all project quotations
          </p>
        </div>
        <NewQuotationButton onClick={onNewQuotation} size="default" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search by client, location, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as QuotationStatus | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="finalized">Finalized</SelectItem>
              <SelectItem value="sent">Sent to Client</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="converted">Converted to Project</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={buildingTypeFilter} onValueChange={setBuildingTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by building type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Building Types</SelectItem>
              <SelectItem value="individual_home">Individual Home</SelectItem>
              <SelectItem value="duplex">Duplex</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>

          {selectedQuotations.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExportToExcel}
              className="w-full"
            >
              <Download className="mr-2" weight="bold" />
              Export ({selectedQuotations.length})
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedQuotations.length === filteredQuotations.length && filteredQuotations.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Quotation ID</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Sq.ft</TableHead>
                <TableHead>Package</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                    No quotations found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedQuotations.includes(quotation.id)}
                        onChange={() => handleSelectQuotation(quotation.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {quotation.quotationNumber}
                    </TableCell>
                    <TableCell>{quotation.clientName}</TableCell>
                    <TableCell className="text-gray-600">
                      {quotation.location}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {quotation.sqft.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {quotation.selectedPackage}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(quotation.estimatedTotal)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(quotation.status)}
                        className={getStatusBadgeClass(quotation.status)}
                      >
                        {quotation.status === 'cancelled' && (
                          <span className="line-through">
                            {QUOTATION_STATUS_LABELS[quotation.status]}
                          </span>
                        )}
                        {quotation.status !== 'cancelled' &&
                          QUOTATION_STATUS_LABELS[quotation.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {format(new Date(quotation.createdAt), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <DotsThreeVertical weight="bold" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewQuotation(quotation)}>
                            <Eye className="mr-2" size={16} weight="bold" />
                            View
                          </DropdownMenuItem>
                          {quotation.status === 'draft' && (
                            <>
                              <DropdownMenuItem onClick={() => onEditQuotation(quotation)}>
                                <PencilSimple className="mr-2" size={16} weight="bold" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-blue-600 focus:text-blue-600"
                                onClick={() => handleFinalizeQuotation(quotation)}
                              >
                                <Check className="mr-2" size={16} weight="bold" />
                                Finalize
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleDuplicate(quotation)}>
                            <CopySimple className="mr-2" size={16} weight="bold" />
                            Duplicate
                          </DropdownMenuItem>
                          {quotation.status === 'finalized' && (
                            <DropdownMenuItem onClick={() => handleGenerateAgreement(quotation)}>
                              <FileText className="mr-2" size={16} weight="bold" />
                              Generate Agreement
                            </DropdownMenuItem>
                          )}
                          {(quotation.status === 'finalized' || quotation.status === 'signed') && (
                            <DropdownMenuItem onClick={() => handleOpenSendDialog(quotation)}>
                              <PaperPlaneTilt className="mr-2" size={16} weight="bold" />
                              Send to Client
                            </DropdownMenuItem>
                          )}
                          {quotation.status === 'sent' && (
                            <DropdownMenuItem
                              className="text-green-600 focus:text-green-600"
                              onClick={() => handleMarkAsSigned(quotation)}
                            >
                              <Check className="mr-2" size={16} weight="bold" />
                              Mark as Signed
                            </DropdownMenuItem>
                          )}
                          {quotation.status === 'signed' && (
                            <DropdownMenuItem
                              className="text-green-600 focus:text-green-600"
                              onClick={() => handleCreateProject(quotation)}
                            >
                              <Plus className="mr-2" size={16} weight="bold" />
                              Create Project
                            </DropdownMenuItem>
                          )}
                          {quotation.status !== 'cancelled' && quotation.status !== 'converted' && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleOpenCancelDialog(quotation)}
                            >
                              <X className="mr-2" size={16} weight="bold" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Cancel Quotation {quotationToCancel?.quotationNumber}?
            </DialogTitle>
            <DialogDescription>
              This action will mark the quotation as cancelled. You can provide a reason for cancellation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">Reason *</Label>
              <Select value={cancellationReason} onValueChange={setCancellationReason}>
                <SelectTrigger id="cancellation-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Client not interested">
                    Client not interested
                  </SelectItem>
                  <SelectItem value="Competitor selected">
                    Competitor selected
                  </SelectItem>
                  <SelectItem value="Budget constraints">
                    Budget constraints
                  </SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="cancellation-notes"
                placeholder="Add any additional notes about the cancellation..."
                value={cancellationNotes}
                onChange={(e) => setCancellationNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelQuotation}
              disabled={!cancellationReason}
            >
              Cancel Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Quotation Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Quotation Details - {quotationToView?.quotationNumber}
            </DialogTitle>
            <DialogDescription>
              View complete quotation information
            </DialogDescription>
          </DialogHeader>

          {quotationToView && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Client Name</Label>
                  <p className="font-medium">{quotationToView.clientName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Location</Label>
                  <p className="font-medium">{quotationToView.location}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Building Type</Label>
                  <p className="font-medium">{BUILDING_TYPE_LABELS[quotationToView.buildingType]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Total Area</Label>
                  <p className="font-medium">{quotationToView.sqft.toLocaleString()} sq.ft</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Floors</Label>
                  <p className="font-medium">{quotationToView.floors}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Package</Label>
                  <p className="font-medium capitalize">{quotationToView.selectedPackage}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Rate per Sq.ft</Label>
                  <p className="font-medium">{formatCurrency(quotationToView.baseRatePerSqft)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Estimated Total</Label>
                  <p className="font-bold text-lg text-primary">{formatCurrency(quotationToView.estimatedTotal)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground text-xs">Project Description</Label>
                <p className="text-sm mt-1">{quotationToView.projectDescription}</p>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-4">
                <span>Created: {format(new Date(quotationToView.createdAt), 'dd MMM yyyy')}</span>
                <span>Updated: {format(new Date(quotationToView.updatedAt), 'dd MMM yyyy')}</span>
                <Badge variant={getStatusBadgeVariant(quotationToView.status)} className={getStatusBadgeClass(quotationToView.status)}>
                  {QUOTATION_STATUS_LABELS[quotationToView.status]}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {quotationToView?.status === 'draft' && (
              <Button onClick={() => {
                setViewDialogOpen(false)
                handleFinalizeQuotation(quotationToView)
              }}>
                <Check className="mr-2" size={16} weight="bold" />
                Finalize
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Client Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send Quotation to Client
            </DialogTitle>
            <DialogDescription>
              Choose how to send {quotationToSend?.quotationNumber} to {quotationToSend?.clientName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Send Method</Label>
              <Select value={sendMethod} onValueChange={(v) => setSendMethod(v as 'email' | 'whatsapp' | 'both')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="both">Both Email and WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {quotationToSend?.email && sendMethod !== 'whatsapp' && (
              <div>
                <Label className="text-muted-foreground text-xs">Email Address</Label>
                <p className="font-medium">{quotationToSend.email}</p>
              </div>
            )}

            {quotationToSend?.mobileNumber && sendMethod !== 'email' && (
              <div>
                <Label className="text-muted-foreground text-xs">Mobile Number</Label>
                <p className="font-medium">{quotationToSend.mobileNumber}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendToClient}>
              <PaperPlaneTilt className="mr-2" size={16} weight="bold" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >

  )
}
