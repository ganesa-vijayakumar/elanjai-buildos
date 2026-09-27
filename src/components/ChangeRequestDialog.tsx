import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ChangeRequest, ChangeRequestType, ChangeRequestCategory, CHANGE_REQUEST_TYPE_LABELS, CHANGE_REQUEST_CATEGORY_LABELS } from '@/lib/types'
import { Plus, Minus, Upload } from '@phosphor-icons/react'

interface ChangeRequestDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Partial<ChangeRequest>) => void
  projectId: string
  projectName: string
  editingRequest?: ChangeRequest
}

export function ChangeRequestDialog({ open, onClose, onSubmit, projectId, projectName, editingRequest }: ChangeRequestDialogProps) {
  const [description, setDescription] = useState(editingRequest?.description || '')
  const [type, setType] = useState<ChangeRequestType>(editingRequest?.type || 'addition')
  const [requestedBy, setRequestedBy] = useState<'client' | 'builder'>(editingRequest?.requestedBy || 'client')
  const [category, setCategory] = useState<ChangeRequestCategory>(editingRequest?.category || 'electrical')
  const [costImpact, setCostImpact] = useState(editingRequest?.costImpact?.toString() || '')
  const [timelineImpact, setTimelineImpact] = useState(editingRequest?.timelineImpact?.toString() || '')
  const [referenceImage, setReferenceImage] = useState(editingRequest?.referenceImageUrl || '')

  const handleSubmit = () => {
    if (!description.trim() || !costImpact) {
      return
    }

    const data: Partial<ChangeRequest> = {
      description: description.trim(),
      type,
      requestedBy,
      category,
      costImpact: parseFloat(costImpact),
      timelineImpact: parseFloat(timelineImpact) || 0,
      referenceImageUrl: referenceImage || undefined,
      projectId,
      projectName,
    }

    onSubmit(data)
    handleClose()
  }

  const handleClose = () => {
    setDescription('')
    setType('addition')
    setRequestedBy('client')
    setCategory('electrical')
    setCostImpact('')
    setTimelineImpact('')
    setReferenceImage('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingRequest ? 'Edit Change Request' : 'Create Change Request'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Description <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="e.g., Add false ceiling in hall"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-semibold">
                Type <span className="text-red-600">*</span>
              </Label>
              <Select value={type} onValueChange={(val) => setType(val as ChangeRequestType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHANGE_REQUEST_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedBy" className="text-sm font-semibold">
                Requested By <span className="text-red-600">*</span>
              </Label>
              <Select value={requestedBy} onValueChange={(val) => setRequestedBy(val as 'client' | 'builder')}>
                <SelectTrigger id="requestedBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="builder">Builder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-semibold">
              Category <span className="text-red-600">*</span>
            </Label>
            <Select value={category} onValueChange={(val) => setCategory(val as ChangeRequestCategory)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHANGE_REQUEST_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costImpact" className="text-sm font-semibold">
                Cost Impact (₹) <span className="text-red-600">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="costImpact"
                  type="number"
                  placeholder="50000"
                  value={costImpact}
                  onChange={(e) => setCostImpact(e.target.value)}
                  className="pl-8"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                {type === 'removal' && parseFloat(costImpact) > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                    onClick={() => setCostImpact((-Math.abs(parseFloat(costImpact))).toString())}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {type === 'removal' ? 'Enter negative value for cost reduction' : 'Enter positive value for additional cost'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timelineImpact" className="text-sm font-semibold">
                Timeline Impact (days)
              </Label>
              <div className="relative">
                <Input
                  id="timelineImpact"
                  type="number"
                  placeholder="5"
                  value={timelineImpact}
                  onChange={(e) => setTimelineImpact(e.target.value)}
                />
                {parseFloat(timelineImpact) > 0 && (
                  <Plus className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                )}
              </div>
              <p className="text-xs text-gray-500">
                Enter positive for delay, negative for time saved
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceImage" className="text-sm font-semibold">
              Reference Image URL (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="referenceImage"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={referenceImage}
                onChange={(e) => setReferenceImage(e.target.value)}
              />
              <Button type="button" variant="outline" size="icon">
                <Upload />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Paste an image URL or upload a reference image
            </p>
          </div>

          {referenceImage && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Preview</Label>
              <div className="border rounded-lg overflow-hidden">
                <img src={referenceImage} alt="Reference" className="w-full h-48 object-cover" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || !costImpact}
            className="bg-red-600 hover:bg-red-700"
          >
            {editingRequest ? 'Update Request' : 'Create Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
