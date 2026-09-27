import { useState } from 'react';
import { Project, WORKER_ROLES_LIST, MATERIAL_TYPES, LaborEntry, MaterialEntry, PettyCashEntry, SitePhoto } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Hammer, Plus, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { PhotoUploadDialog } from './PhotoUploadDialog';
import { PhotoGallery } from './PhotoGallery';

interface SiteManagerViewProps {
  projects: Project[];
  onProjectUpdate: (project: Project) => void;
}

export function SiteManagerView({ projects, onProjectUpdate }: SiteManagerViewProps) {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const activeProjects = safeProjects.filter(p => p.status !== 'completed');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjects[0]?.id || '');
  const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([]);
  const [materialEntries, setMaterialEntries] = useState<MaterialEntry[]>([]);
  const [pettyCashEntries, setPettyCashEntries] = useState<PettyCashEntry[]>([]);

  const selectedProject = safeProjects.find(p => p.id === selectedProjectId);

  const addLaborEntry = () => {
    setLaborEntries([...laborEntries, { workerType: '', count: 0, dailyWage: 0, totalWage: 0 }]);
  };

  const updateLaborEntry = (index: number, field: keyof LaborEntry, value: any) => {
    const updated = [...laborEntries];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'workerType') {
      const worker = WORKER_ROLES_LIST.find(w => w.label === value);
      if (worker) {
        updated[index].dailyWage = worker.wage;
        updated[index].totalWage = worker.wage * updated[index].count;
      }
    }

    if (field === 'count') {
      updated[index].totalWage = updated[index].dailyWage * value;
    }

    setLaborEntries(updated);
  };

  const removeLaborEntry = (index: number) => {
    setLaborEntries(laborEntries.filter((_, i) => i !== index));
  };

  const addMaterialEntry = () => {
    setMaterialEntries([...materialEntries, { materialType: '', quantity: 0, unit: '', vendor: '', estimatedCost: 0 }]);
  };

  const updateMaterialEntry = (index: number, field: keyof MaterialEntry, value: any) => {
    const updated = [...materialEntries];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'materialType') {
      const material = MATERIAL_TYPES.find(m => m.label === value);
      if (material) {
        updated[index].unit = material.unit;
      }
    }

    setMaterialEntries(updated);
  };

  const removeMaterialEntry = (index: number) => {
    setMaterialEntries(materialEntries.filter((_, i) => i !== index));
  };

  const addPettyCashEntry = () => {
    setPettyCashEntries([...pettyCashEntries, { description: '', amount: 0 }]);
  };

  const updatePettyCashEntry = (index: number, field: keyof PettyCashEntry, value: any) => {
    const updated = [...pettyCashEntries];
    updated[index] = { ...updated[index], [field]: value };
    setPettyCashEntries(updated);
  };

  const removePettyCashEntry = (index: number) => {
    setPettyCashEntries(pettyCashEntries.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!selectedProject) return;

    const totalLabor = laborEntries.reduce((sum, entry) => sum + entry.totalWage, 0);
    const totalMaterial = materialEntries.reduce((sum, entry) => sum + entry.estimatedCost, 0);
    const totalPettyCash = pettyCashEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const totalAmount = totalLabor + totalMaterial + totalPettyCash;

    const updatedProject = { ...selectedProject };
    const currentStage = updatedProject.stages[updatedProject.currentStageIndex];
    currentStage.actualSpent += totalAmount;
    updatedProject.totalExpenses += totalAmount;

    if (!updatedProject.materialUsage) {
      updatedProject.materialUsage = {};
    }

    materialEntries.forEach(entry => {
      if (entry.materialType && entry.quantity > 0) {
        const currentQuantity = updatedProject.materialUsage![entry.materialType] || 0;
        updatedProject.materialUsage![entry.materialType] = currentQuantity + entry.quantity;
      }
    });

    onProjectUpdate(updatedProject);

    setLaborEntries([]);
    setMaterialEntries([]);
    setPettyCashEntries([]);

    toast.success('Daily report submitted successfully', {
      description: `Total amount: ₹${totalAmount.toLocaleString()}`,
    });
  };

  const handlePhotoUpload = (photo: SitePhoto) => {
    if (!selectedProject) return;

    const updatedProject = { ...selectedProject };
    if (!updatedProject.sitePhotos) {
      updatedProject.sitePhotos = [];
    }
    updatedProject.sitePhotos.push(photo);

    onProjectUpdate(updatedProject);
  };

  const handlePhotoDelete = (photoId: string) => {
    if (!selectedProject) return;

    const updatedProject = { ...selectedProject };
    if (updatedProject.sitePhotos) {
      updatedProject.sitePhotos = updatedProject.sitePhotos.filter(p => p.id !== photoId);
    }

    onProjectUpdate(updatedProject);
    toast.success('Photo deleted successfully');
  };

  const totalDailyAmount =
    laborEntries.reduce((sum, entry) => sum + entry.totalWage, 0) +
    materialEntries.reduce((sum, entry) => sum + entry.estimatedCost, 0) +
    pettyCashEntries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Hammer size={32} weight="fill" className="text-red-600" />
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Site Manager</h2>
          <p className="text-gray-600">Daily Data Entry</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Active Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="min-h-[44px] text-base">
              <SelectValue placeholder="Choose a project" />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map(project => (
                <SelectItem key={project.id} value={project.id} className="min-h-[44px]">
                  <div>
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-sm text-gray-600">Current: {project.currentStage}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedProject && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Client</p>
                  <p className="font-semibold">{selectedProject.clientName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Current Stage</p>
                  <p className="font-semibold">{selectedProject.currentStage}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProject && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Site Photos</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Upload photos to keep clients updated</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <PhotoUploadDialog
                projectStages={selectedProject.stages.map(s => s.name)}
                onPhotoUpload={handlePhotoUpload}
              />
              {selectedProject.sitePhotos && selectedProject.sitePhotos.length > 0 && (
                <div className="pt-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">
                    Recent Photos ({selectedProject.sitePhotos.length})
                  </h4>
                  <PhotoGallery
                    photos={selectedProject.sitePhotos}
                    onDeletePhoto={handlePhotoDelete}
                    allowDelete={true}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Labor Entry</CardTitle>
                <Button onClick={addLaborEntry} size="sm" className="bg-red-600 hover:bg-red-700">
                  <Plus size={16} weight="bold" className="mr-1" />
                  Add Worker
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {laborEntries.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No labor entries yet. Click "Add Worker" to start.</p>
                ) : (
                  laborEntries.map((entry, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm text-gray-700">Worker #{index + 1}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLaborEntry(index)}
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>

                      <div>
                        <Label htmlFor={`worker-type-${index}`}>Worker Type</Label>
                        <Select
                          value={entry.workerType}
                          onValueChange={(value) => updateLaborEntry(index, 'workerType', value)}
                        >
                          <SelectTrigger id={`worker-type-${index}`} className="min-h-[44px] mt-1">
                            <SelectValue placeholder="Select worker type" />
                          </SelectTrigger>
                          <SelectContent>
                            {WORKER_ROLES_LIST.map(worker => (
                              <SelectItem key={worker.label} value={worker.label} className="min-h-[44px]">
                                {worker.label} - ₹{worker.wage}/day
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor={`worker-count-${index}`}>Number of Workers</Label>
                        <Input
                          id={`worker-count-${index}`}
                          type="number"
                          min="0"
                          value={entry.count || ''}
                          onChange={(e) => updateLaborEntry(index, 'count', parseInt(e.target.value) || 0)}
                          className="min-h-[44px] mt-1 text-base"
                        />
                      </div>

                      {entry.totalWage > 0 && (
                        <div className="bg-emerald-50 p-3 rounded">
                          <p className="text-sm text-emerald-700">Total Wage</p>
                          <p className="text-xl font-bold text-emerald-600">₹{entry.totalWage.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Material Entry</CardTitle>
                <Button onClick={addMaterialEntry} size="sm" className="bg-red-600 hover:bg-red-700">
                  <Plus size={16} weight="bold" className="mr-1" />
                  Add Material
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {materialEntries.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No material entries yet.</p>
                ) : (
                  materialEntries.map((entry, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm text-gray-700">Material #{index + 1}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMaterialEntry(index)}
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>

                      <div>
                        <Label htmlFor={`material-type-${index}`}>Material Type</Label>
                        <Select
                          value={entry.materialType}
                          onValueChange={(value) => updateMaterialEntry(index, 'materialType', value)}
                        >
                          <SelectTrigger id={`material-type-${index}`} className="min-h-[44px] mt-1">
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {MATERIAL_TYPES.map(material => (
                              <SelectItem key={material.label} value={material.label} className="min-h-[44px]">
                                {material.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`material-quantity-${index}`}>Quantity</Label>
                          <Input
                            id={`material-quantity-${index}`}
                            type="number"
                            min="0"
                            value={entry.quantity || ''}
                            onChange={(e) => updateMaterialEntry(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="min-h-[44px] mt-1 text-base"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`material-cost-${index}`}>Cost (₹)</Label>
                          <Input
                            id={`material-cost-${index}`}
                            type="number"
                            min="0"
                            value={entry.estimatedCost || ''}
                            onChange={(e) => updateMaterialEntry(index, 'estimatedCost', parseInt(e.target.value) || 0)}
                            className="min-h-[44px] mt-1 text-base"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`material-vendor-${index}`}>Vendor Name</Label>
                        <Input
                          id={`material-vendor-${index}`}
                          value={entry.vendor}
                          onChange={(e) => updateMaterialEntry(index, 'vendor', e.target.value)}
                          className="min-h-[44px] mt-1 text-base"
                          placeholder="Vendor name"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Petty Cash</CardTitle>
                <Button onClick={addPettyCashEntry} size="sm" className="bg-red-600 hover:bg-red-700">
                  <Plus size={16} weight="bold" className="mr-1" />
                  Add Expense
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pettyCashEntries.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No petty cash entries yet.</p>
                ) : (
                  pettyCashEntries.map((entry, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm text-gray-700">Expense #{index + 1}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePettyCashEntry(index)}
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>

                      <div>
                        <Label htmlFor={`petty-desc-${index}`}>Description</Label>
                        <Input
                          id={`petty-desc-${index}`}
                          value={entry.description}
                          onChange={(e) => updatePettyCashEntry(index, 'description', e.target.value)}
                          className="min-h-[44px] mt-1 text-base"
                          placeholder="e.g., Tea/Snacks, Travel"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`petty-amount-${index}`}>Amount (₹)</Label>
                        <Input
                          id={`petty-amount-${index}`}
                          type="number"
                          min="0"
                          value={entry.amount || ''}
                          onChange={(e) => updatePettyCashEntry(index, 'amount', parseInt(e.target.value) || 0)}
                          className="min-h-[44px] mt-1 text-base"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-900">Total Daily Amount</span>
                <span className="text-3xl font-bold text-red-600">₹{totalDailyAmount.toLocaleString()}</span>
              </div>
              <Separator className="my-4" />
              <Button
                onClick={handleSubmit}
                disabled={totalDailyAmount === 0}
                className="w-full min-h-[52px] bg-red-600 hover:bg-red-700 text-white text-lg font-semibold"
                size="lg"
              >
                Submit Daily Report
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
