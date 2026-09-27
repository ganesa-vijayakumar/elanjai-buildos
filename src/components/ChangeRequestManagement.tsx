import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Label } from './ui/label'
import { ChangeRequestDialog } from './ChangeRequestDialog'
import { Project, ChangeRequest, ChangeRequestStatus, CHANGE_REQUEST_STATUS_LABELS, CHANGE_REQUEST_TYPE_LABELS, CHANGE_REQUEST_CATEGORY_LABELS } from '@/lib/types'
import { Plus, Check, X, Clock, FlagCheckered, Eye, FileText, Download } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ChangeRequestManagementProps {
  project: Project
  onProjectUpdate: (project: Project) => void
  currentRole: 'admin' | 'owner' | 'site-manager' | 'client'
}

export function ChangeRequestManagement({ project, onProjectUpdate, currentRole }: ChangeRequestManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approverNotes, setApproverNotes] = useState('')
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')

  const changeRequests = project.changeRequests || []
  const canManage = currentRole === 'admin' || currentRole === 'owner'

  const handleCreateRequest = (data: Partial<ChangeRequest>) => {
    const newRequest: ChangeRequest = {
      id: `cr-${Date.now()}`,
      crNumber: `CR-${project.id.split('-')[1]}-${(changeRequests.length + 1).toString().padStart(3, '0')}`,
      projectId: project.id,
      projectName: project.name,
      description: data.description!,
      type: data.type!,
      requestedBy: data.requestedBy!,
      category: data.category!,
      costImpact: data.costImpact!,
      timelineImpact: data.timelineImpact || 0,
      status: 'pending',
      referenceImageUrl: data.referenceImageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedProject = {
      ...project,
      changeRequests: [...changeRequests, newRequest],
    }

    onProjectUpdate(updatedProject)
    toast.success('Change request created successfully')
  }

  const handleApproval = () => {
    if (!selectedRequest) return

    const updatedRequest: ChangeRequest = {
      ...selectedRequest,
      status: approvalAction === 'approve' ? 'approved' : 'rejected',
      approverNotes: approverNotes || undefined,
      approvedBy: approvalAction === 'approve' ? 'Current User' : undefined,
      approvedAt: approvalAction === 'approve' ? new Date().toISOString() : undefined,
      rejectedBy: approvalAction === 'reject' ? 'Current User' : undefined,
      rejectedAt: approvalAction === 'reject' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    }

    const updatedProject = {
      ...project,
      changeRequests: changeRequests.map(cr => cr.id === selectedRequest.id ? updatedRequest : cr),
    }

    if (approvalAction === 'approve') {
      updatedProject.totalCost = project.totalCost + selectedRequest.costImpact
    }

    onProjectUpdate(updatedProject)
    toast.success(`Change request ${approvalAction === 'approve' ? 'approved' : 'rejected'}`)
    setShowApprovalDialog(false)
    setSelectedRequest(null)
    setApproverNotes('')
  }

  const handleStatusChange = (request: ChangeRequest, newStatus: ChangeRequestStatus) => {
    const updatedRequest: ChangeRequest = {
      ...request,
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : request.completedAt,
      updatedAt: new Date().toISOString(),
    }

    const updatedProject = {
      ...project,
      changeRequests: changeRequests.map(cr => cr.id === request.id ? updatedRequest : cr),
    }

    onProjectUpdate(updatedProject)
    toast.success(`Status updated to ${CHANGE_REQUEST_STATUS_LABELS[newStatus]}`)
  }

  const getStatusBadgeColor = (status: ChangeRequestStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-300'
    }
  }

  const approvedRequests = changeRequests.filter(cr => cr.status === 'approved' || cr.status === 'in-progress' || cr.status === 'completed')
  const totalChangeOrderCost = approvedRequests.reduce((sum, cr) => sum + cr.costImpact, 0)
  const originalContract = project.totalCost - totalChangeOrderCost
  const revisedTotal = project.totalCost

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Change Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalChangeOrderCost.toLocaleString('en-IN')}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {approvedRequests.length} approved request{approvedRequests.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Original Contract</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{originalContract.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Revised Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{revisedTotal.toLocaleString('en-IN')}
            </div>
            {totalChangeOrderCost !== 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {totalChangeOrderCost > 0 ? '+' : ''}₹{totalChangeOrderCost.toLocaleString('en-IN')} from changes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Change Requests</CardTitle>
              <CardDescription>
                Manage mid-project scope changes separately from original contract
              </CardDescription>
            </div>
            {canManage && (
              <Button onClick={() => setShowCreateDialog(true)} className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2" />
                New Change Request
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {changeRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No change requests</h3>
              <p className="mt-2 text-sm text-gray-500">
                {canManage ? 'Create a new change request to track scope changes.' : 'No change requests have been created for this project.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CR ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Cost Impact</TableHead>
                    <TableHead className="text-right">Timeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changeRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {request.crNumber}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="line-clamp-2">{request.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CHANGE_REQUEST_TYPE_LABELS[request.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {CHANGE_REQUEST_CATEGORY_LABELS[request.category]}
                      </TableCell>
                      <TableCell className="capitalize">
                        {request.requestedBy}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(request.createdAt), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${request.costImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {request.costImpact >= 0 ? '+' : ''}₹{request.costImpact.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className={`text-right ${request.timelineImpact > 0 ? 'text-red-600' : request.timelineImpact < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {request.timelineImpact > 0 ? '+' : ''}{request.timelineImpact} days
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(request.status)}>
                          {CHANGE_REQUEST_STATUS_LABELS[request.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManage && request.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setApprovalAction('approve')
                                  setShowApprovalDialog(true)
                                }}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setApprovalAction('reject')
                                  setShowApprovalDialog(true)
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {canManage && request.status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(request, 'in-progress')}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                          {canManage && request.status === 'in-progress' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(request, 'completed')}
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            >
                              <FlagCheckered className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ChangeRequestDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateRequest}
        projectId={project.id}
        projectName={project.name}
      />

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Change Request
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <span className="font-semibold">CR ID:</span> {selectedRequest.crNumber}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Description:</span> {selectedRequest.description}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Cost Impact:</span>{' '}
                  <span className={selectedRequest.costImpact >= 0 ? 'text-red-600' : 'text-green-600'}>
                    {selectedRequest.costImpact >= 0 ? '+' : ''}₹{selectedRequest.costImpact.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="approverNotes">Notes</Label>
              <Textarea
                id="approverNotes"
                placeholder={`Add notes about this ${approvalAction}...`}
                value={approverNotes}
                onChange={(e) => setApproverNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApproval}
              className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedRequest && !showApprovalDialog && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Change Request Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">CR ID</Label>
                  <div className="font-mono font-semibold">{selectedRequest.crNumber}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div>
                    <Badge className={getStatusBadgeColor(selectedRequest.status)}>
                      {CHANGE_REQUEST_STATUS_LABELS[selectedRequest.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Description</Label>
                <div className="mt-1">{selectedRequest.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Type</Label>
                  <div>{CHANGE_REQUEST_TYPE_LABELS[selectedRequest.type]}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Category</Label>
                  <div>{CHANGE_REQUEST_CATEGORY_LABELS[selectedRequest.category]}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Requested By</Label>
                  <div className="capitalize">{selectedRequest.requestedBy}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Request Date</Label>
                  <div>{format(new Date(selectedRequest.createdAt), 'dd MMM yyyy')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Cost Impact</Label>
                  <div className={`text-lg font-semibold ${selectedRequest.costImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedRequest.costImpact >= 0 ? '+' : ''}₹{selectedRequest.costImpact.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Timeline Impact</Label>
                  <div className={`text-lg font-semibold ${selectedRequest.timelineImpact > 0 ? 'text-red-600' : selectedRequest.timelineImpact < 0 ? 'text-green-600' : ''}`}>
                    {selectedRequest.timelineImpact > 0 ? '+' : ''}{selectedRequest.timelineImpact} days
                  </div>
                </div>
              </div>

              {selectedRequest.referenceImageUrl && (
                <div>
                  <Label className="text-xs text-gray-500">Reference Image</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <img src={selectedRequest.referenceImageUrl} alt="Reference" className="w-full h-64 object-cover" />
                  </div>
                </div>
              )}

              {selectedRequest.approverNotes && (
                <div>
                  <Label className="text-xs text-gray-500">Approver Notes</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedRequest.approverNotes}</div>
                </div>
              )}

              {selectedRequest.approvedBy && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Approved By</Label>
                    <div>{selectedRequest.approvedBy}</div>
                  </div>
                  {selectedRequest.approvedAt && (
                    <div>
                      <Label className="text-xs text-gray-500">Approved At</Label>
                      <div>{format(new Date(selectedRequest.approvedAt), 'dd MMM yyyy HH:mm')}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
