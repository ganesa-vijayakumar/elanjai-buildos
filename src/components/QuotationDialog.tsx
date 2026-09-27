import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, PackageType, PACKAGE_RATES, CONSTRUCTION_STAGES } from '@/lib/types';
import { CheckCircle } from '@phosphor-icons/react';

interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (project: Project) => void;
}

export function QuotationDialog({ open, onOpenChange, onCreateProject }: QuotationDialogProps) {
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [projectType, setProjectType] = useState<'villa' | 'apartment' | 'duplex'>('villa');
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const totalCost = selectedPackage ? parseInt(squareFootage || '0') * PACKAGE_RATES[selectedPackage] : 0;

  const resetForm = () => {
    setStep(1);
    setClientName('');
    setLocation('');
    setSquareFootage('');
    setProjectType('villa');
    setSelectedPackage(null);
    setIsCreating(false);
  };

  const handleCreateProject = async () => {
    if (!selectedPackage) return;

    setIsCreating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      // Fetch building-specific stage template
      const stageKey = `stage-template-${projectType}`
      const buildingStageTemplate = localStorage.getItem(`kv:${stageKey}`)
      let stageTemplate = CONSTRUCTION_STAGES

      if (buildingStageTemplate) {
        try {
          stageTemplate = JSON.parse(buildingStageTemplate)
        } catch {
          stageTemplate = CONSTRUCTION_STAGES
        }
      }

      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: `${clientName.split(' ')[clientName.split(' ').length - 1]}'s ${projectType.charAt(0).toUpperCase() + projectType.slice(1)}`,
        clientName,
        location,
        type: projectType,
        squareFootage: parseInt(squareFootage),
        packageType: selectedPackage,
        totalCost,
        status: 'on-track',
        currentStage: 'Site Preparation',
        currentStageIndex: 0,
        completionPercentage: 0,
        totalCollected: 0,
        totalExpenses: 0,
        createdAt: new Date().toISOString().split('T')[0],
        materialUsage: {},
        sitePhotos: [],
        stages: stageTemplate.map((stage, index) => ({
          id: `proj-${Date.now()}-stage-${index}`,
          name: stage.name,
          percentage: stage.percentage,
          budgetAmount: (totalCost * stage.percentage) / 100,
          actualSpent: 0,
          status: index === 0 ? 'in-progress' : 'pending',
        })),
      };

      onCreateProject(newProject);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const packages = [
    {
      type: 'basic' as PackageType,
      name: 'Basic',
      rate: 2000,
      features: ['Standard materials', 'Basic fixtures', '1 year warranty'],
    },
    {
      type: 'standard' as PackageType,
      name: 'Standard',
      rate: 2300,
      features: ['Premium materials', 'Designer fixtures', '3 year warranty'],
    },
    {
      type: 'premium' as PackageType,
      name: 'Premium',
      rate: 2800,
      features: ['Luxury materials', 'Imported fixtures', '5 year warranty'],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {step === 1 ? 'Project Details' : step === 2 ? 'Select Package' : 'Review & Confirm'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  placeholder="Mr. Rajesh Sharma"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location">Site Location</Label>
                <Input
                  id="location"
                  placeholder="Banjara Hills, Hyderabad"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input
                  id="squareFootage"
                  type="number"
                  placeholder="3200"
                  value={squareFootage}
                  onChange={(e) => setSquareFootage(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="projectType">Project Type</Label>
                <Select value={projectType} onValueChange={(value: any) => setProjectType(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="duplex">Duplex</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!clientName || !location || !squareFootage || isCreating}
                className="bg-red-600 hover:bg-red-700"
              >
                Next: Select Package
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card
                  key={pkg.type}
                  className={`cursor-pointer transition-all ${selectedPackage === pkg.type
                      ? 'ring-2 ring-red-600 bg-red-50'
                      : 'hover:shadow-md'
                    }`}
                  onClick={() => setSelectedPackage(pkg.type)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                        <p className="text-2xl font-bold text-red-600 mt-2">
                          ₹{pkg.rate.toLocaleString()}/sq.ft
                        </p>
                      </div>
                      {selectedPackage === pkg.type && (
                        <CheckCircle size={24} weight="fill" className="text-red-600" />
                      )}
                    </div>
                    <ul className="space-y-2">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedPackage && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Estimated Total Cost:</span>
                  <span className="text-3xl font-bold text-red-600">
                    ₹{totalCost.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isCreating}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedPackage || isCreating}
                className="bg-red-600 hover:bg-red-700"
              >
                Review Quotation
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Client Name:</span>
                <span className="font-semibold text-gray-900">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Location:</span>
                <span className="font-semibold text-gray-900">{location}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Square Footage:</span>
                <span className="font-semibold text-gray-900">{squareFootage} sq.ft</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Type:</span>
                <span className="font-semibold text-gray-900 capitalize">{projectType}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Package:</span>
                <span className="font-semibold text-gray-900 capitalize">{selectedPackage}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-bold text-gray-900">Total Cost:</span>
                <span className="text-2xl font-bold text-red-600">₹{totalCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> This project will be automatically split into 15 construction stages
                with pre-allocated budgets based on industry standards.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(2)} disabled={isCreating}>
                Back
              </Button>
              <Button
                onClick={handleCreateProject}
                className="bg-red-600 hover:bg-red-700"
                size="lg"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating Project...
                  </>
                ) : (
                  'Lock & Create Project'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
