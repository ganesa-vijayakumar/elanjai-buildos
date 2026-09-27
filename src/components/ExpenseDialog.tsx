import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Project, ConstructionStage, ExpenseEntry } from '@/lib/types';
import { toast } from 'sonner';

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  stage?: ConstructionStage;
  onExpenseAdded: (project: Project, stageId: string, expense: ExpenseEntry) => void;
}

export function ExpenseDialog({ 
  open, 
  onOpenChange, 
  project, 
  stage, 
  onExpenseAdded 
}: ExpenseDialogProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>(stage?.id || '');
  const [category, setCategory] = useState<ExpenseEntry['category']>('material');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setSelectedStageId(stage?.id || '');
    setCategory('material');
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const handleSubmit = () => {
    if (!selectedStageId || !description || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedStage = project.stages.find(s => s.id === selectedStageId);
    if (!selectedStage) {
      toast.error('Invalid stage selected');
      return;
    }

    const expense: ExpenseEntry = {
      id: `expense-${Date.now()}`,
      stageId: selectedStageId,
      stageName: selectedStage.name,
      category,
      description,
      amount: parseFloat(amount),
      date,
      recordedBy: 'Owner',
      recordedAt: new Date().toISOString(),
      notes: notes || undefined,
    };

    onExpenseAdded(project, selectedStageId, expense);
    toast.success('Expense added successfully');
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={selectedStageId} onValueChange={setSelectedStageId}>
              <SelectTrigger id="stage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {project.stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseEntry['category'])}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="material">Material</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Add Expense
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
