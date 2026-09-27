import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, CollectionEntry } from '@/lib/types';
import { CurrencyInr } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onCollectionAdded: (project: Project, amount: number, entry: CollectionEntry) => void;
}

export function CollectionDialog({ open, onOpenChange, project, onCollectionAdded }: CollectionDialogProps) {
  const [amount, setAmount] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [notes, setNotes] = useState('');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    
    if (!amountValue || amountValue <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!selectedStage) {
      toast.error('Please select a construction stage');
      return;
    }

    const newCollection: CollectionEntry = {
      id: `collection-${Date.now()}`,
      amount: amountValue,
      stage: selectedStage,
      date: collectionDate,
      notes: notes,
      recordedBy: 'Owner',
      recordedAt: new Date().toISOString(),
    };

    onCollectionAdded(project, amountValue, newCollection);

    setAmount('');
    setSelectedStage('');
    setNotes('');
    setCollectionDate(new Date().toISOString().split('T')[0]);
    onOpenChange(false);

    toast.success(`₹${amountValue.toLocaleString()} collected successfully!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CurrencyInr className="w-6 h-6 text-red-600" weight="bold" />
            Record Collection
          </DialogTitle>
          <DialogDescription>
            Add payment received from {project.clientName} for {project.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-semibold">
              Amount Collected (₹) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-lg h-12"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Total collected so far: ₹{project.totalCollected.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage" className="text-base font-semibold">
              Associated Stage *
            </Label>
            <Select value={selectedStage} onValueChange={setSelectedStage} required>
              <SelectTrigger id="stage" className="h-12">
                <SelectValue placeholder="Select construction stage" />
              </SelectTrigger>
              <SelectContent>
                {project.stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.name}>
                    {stage.name} ({stage.percentage}% - ₹{stage.budgetAmount.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-base font-semibold">
              Collection Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={collectionDate}
              onChange={(e) => setCollectionDate(e.target.value)}
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Payment method, check number, transaction ID, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Record Collection
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
