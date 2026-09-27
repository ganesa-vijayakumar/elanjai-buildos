import { Project } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Clock, Camera, Money, CalendarBlank, Phone, WhatsappLogo, SignOut, HouseLine, DownloadSimple } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

interface ClientPortalProps {
  project: Project;
  onLogout?: () => void;
}

export function ClientPortal({ project, onLogout }: ClientPortalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const getStageIcon = (status: string, isCurrent: boolean) => {
    if (status === 'completed') {
      return <CheckCircle size={32} weight="fill" className="text-emerald-600" />;
    }
    if (isCurrent) {
      return <Clock size={32} weight="fill" className="text-red-600" />;
    }
    return <Circle size={32} weight="regular" className="text-gray-400" />;
  };

  const recentActivities = project.stages
    .filter(stage => stage.status === 'completed')
    .slice(-5)
    .reverse()
    .map((stage, index) => ({
      stage: stage.name,
      date: new Date(Date.now() - (index + 1) * 3 * 24 * 60 * 60 * 1000),
    }));

  const paymentMilestones = [
    { stage: 'Agreement Signing', percentage: 10, amount: project.totalCost * 0.1, paid: project.completionPercentage > 0 },
    { stage: 'Foundation Complete', percentage: 25, amount: project.totalCost * 0.25, paid: project.completionPercentage >= 20 },
    { stage: 'Roofing Complete', percentage: 40, amount: project.totalCost * 0.40, paid: project.completionPercentage >= 45 },
    { stage: 'Finishing Work Complete', percentage: 15, amount: project.totalCost * 0.15, paid: project.completionPercentage >= 90 },
    { stage: 'Handover', percentage: 10, amount: project.totalCost * 0.10, paid: project.completionPercentage === 100 },
  ];

  const nextPayment = paymentMilestones.find(m => !m.paid);
  const totalPaid = paymentMilestones.filter(m => m.paid).reduce((sum, m) => sum + m.amount, 0);
  const totalDue = project.totalCost - totalPaid;

  const expectedHandover = 'TBD';

  const statusBadgeConfig = {
    'on-track': { label: 'On Track', className: 'bg-emerald-600 hover:bg-emerald-700' },
    'delayed': { label: 'In Progress', className: 'bg-amber-500 hover:bg-amber-600' },
    'completed': { label: 'Completed', className: 'bg-blue-600 hover:bg-blue-700' },
  }

  const currentStatus = statusBadgeConfig[project.status as keyof typeof statusBadgeConfig] || statusBadgeConfig['on-track'];

  const handleDownloadPhoto = (photoUrl: string) => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `site-photo-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Photo downloaded');
  };

  const handleCallBuilder = () => {
    window.location.href = 'tel:9677265045';
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/919677265045?text=Hi, I have a query about my project', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HouseLine size={32} weight="fill" className="text-red-600" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">ELANJAI BUILDOS</h1>
              <p className="text-xs text-gray-600">Client Portal</p>
            </div>
          </div>
          {onLogout && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="gap-2"
            >
              <SignOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl space-y-6">
        <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-0 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-red-100 text-sm mb-1">Welcome back,</p>
                <h2 className="text-3xl sm:text-4xl font-bold">{project.clientName.split(' ')[0]}!</h2>
              </div>
              <Badge className={currentStatus.className}>
                {currentStatus.label}
              </Badge>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white/95 mb-1">{project.name}</h3>
            <p className="text-red-100 flex items-start gap-2">
              <CalendarBlank size={20} className="mt-0.5 flex-shrink-0" />
              <span>{project.location}</span>
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-2 border-red-100">
            <CardContent className="p-6 text-center">
              <div className="mb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-3">
                  <span className="text-3xl font-bold text-red-600">{project.completionPercentage}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">Overall Progress</p>
              <Progress value={project.completionPercentage} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-100">
            <CardContent className="p-6">
              <Clock size={24} weight="fill" className="text-amber-600 mb-3" />
              <p className="text-sm font-medium text-gray-600 mb-1">Current Stage</p>
              <p className="text-lg font-bold text-gray-900">{project.currentStage}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-100">
            <CardContent className="p-6">
              <CalendarBlank size={24} weight="fill" className="text-emerald-600 mb-3" />
              <p className="text-sm font-medium text-gray-600 mb-1">Expected Handover</p>
              <p className="text-lg font-bold text-gray-900">{expectedHandover}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Project Type</p>
                <p className="font-semibold text-gray-900 capitalize">{project.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Built-Up Area</p>
                <p className="font-semibold text-gray-900">{project.squareFootage.toLocaleString()} sq.ft</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Package</p>
                <p className="font-semibold text-gray-900 capitalize">{project.packageType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Start Date</p>
                <p className="font-semibold text-gray-900">
                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Contract Value</p>
                <p className="font-semibold text-gray-900">₹{(project.totalCost / 100000).toFixed(2)}L</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Construction Timeline</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Track your dream home's progress</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {project.stages.map((stage, index) => {
                const isCurrent = index === project.currentStageIndex;
                const isPast = index < project.currentStageIndex;

                return (
                  <div key={stage.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      {getStageIcon(stage.status, isCurrent)}
                      {index < project.stages.length - 1 && (
                        <div className={`w-1 flex-1 min-h-[40px] mt-2 ${
                          isPast ? 'bg-emerald-600' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>

                    <div className="flex-1 pb-4">
                      <h4 className={`text-lg font-semibold ${
                        isCurrent ? 'text-red-600' : isPast ? 'text-emerald-600' : 'text-gray-500'
                      }`}>
                        {stage.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {stage.status === 'completed' 
                          ? '✓ Completed' 
                          : isCurrent 
                          ? '⏱ In Progress' 
                          : '○ Upcoming'}
                      </p>
                      {isCurrent && (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-red-900">
                            This stage is currently in progress. Our team is working hard on your dream home!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Money size={24} weight="fill" className="text-emerald-600" />
              Payment Schedule
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Stage-based payment milestones</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ₹{(totalPaid / 100000).toFixed(2)}L
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{(totalDue / 100000).toFixed(2)}L
                  </p>
                </div>
              </div>

              {nextPayment && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CalendarBlank size={24} weight="fill" className="text-red-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Next Payment Due</p>
                      <p className="text-sm text-red-700 mt-1">{nextPayment.stage}</p>
                      <p className="text-2xl font-bold text-red-600 mt-2">
                        ₹{(nextPayment.amount / 100000).toFixed(2)}L
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        ({nextPayment.percentage}% of total cost)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {paymentMilestones.map((milestone, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      milestone.paid
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {milestone.paid ? (
                        <CheckCircle size={24} weight="fill" className="text-emerald-600" />
                      ) : (
                        <Clock size={24} weight="regular" className="text-gray-400" />
                      )}
                      <div>
                        <p className={`font-semibold ${milestone.paid ? 'text-emerald-900' : 'text-gray-900'}`}>
                          {milestone.stage}
                        </p>
                        <p className="text-sm text-gray-600">
                          {milestone.percentage}% - ₹{(milestone.amount / 100000).toFixed(2)}L
                        </p>
                      </div>
                    </div>
                    {milestone.paid ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700">Paid</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">Upcoming</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Camera size={24} weight="fill" className="text-red-600" />
              Site Photos
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Visual updates from your construction site</p>
          </CardHeader>
          <CardContent className="p-6">
            {project.sitePhotos && project.sitePhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {project.sitePhotos.map((photo, index) => (
                  <div key={index} className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-red-400 transition-colors">
                    <img
                      src={photo.url}
                      alt={photo.caption || `Site photo ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                      onClick={() => setSelectedPhoto(photo.url)}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedPhoto(photo.url)}
                        className="bg-white/90 hover:bg-white text-gray-900"
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadPhoto(photo.url)}
                        className="bg-red-600 hover:bg-red-700 gap-2"
                      >
                        <DownloadSimple size={16} weight="bold" />
                        Download
                      </Button>
                    </div>
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Camera size={48} weight="light" className="text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Site photos will be uploaded soon</p>
                <p className="text-sm text-gray-400 mt-1">
                  Our team will regularly update photos of your construction progress
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
          <CardHeader className="border-b border-blue-200">
            <CardTitle className="text-xl text-blue-900">Contact Builder</CardTitle>
            <p className="text-sm text-blue-700 mt-1">Get in touch with our team</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Er. P. Sathish Kumar</p>
                <p className="font-semibold text-gray-900 text-lg">ELANJAI BUILDOS</p>
                <p className="text-sm text-gray-600 mt-1">Civil Engineering Contractor</p>
              </div>
              
              <div className="pt-4 border-t border-blue-200 space-y-3">
                <div className="flex items-center gap-3">
                  <Phone size={20} weight="fill" className="text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">9677265045</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarBlank size={20} weight="fill" className="text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">elanjaibuildos@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  onClick={handleCallBuilder}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <Phone size={20} weight="fill" />
                  Call Now
                </Button>
                <Button
                  onClick={handleWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                >
                  <WhatsappLogo size={20} weight="fill" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-6xl w-full">
            <Button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white"
            >
              Close
            </Button>
            <img
              src={selectedPhoto}
              alt="Site photo"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
            <Button
              onClick={() => handleDownloadPhoto(selectedPhoto)}
              className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 gap-2"
            >
              <DownloadSimple size={20} weight="bold" />
              Download Photo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
