import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload } from '@phosphor-icons/react';
import { SitePhoto } from '@/lib/types';
import { toast } from 'sonner';

interface PhotoUploadDialogProps {
  projectStages: string[];
  onPhotoUpload: (photo: SitePhoto) => void;
}

export function PhotoUploadDialog({ projectStages, onPhotoUpload }: PhotoUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [stage, setStage] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!imageDataUrl) {
      toast.error('Please select an image');
      return;
    }
    if (!stage) {
      toast.error('Please select a construction stage');
      return;
    }
    if (!caption.trim()) {
      toast.error('Please add a caption');
      return;
    }

    setIsUploading(true);

    const newPhoto: SitePhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: imageDataUrl,
      caption: caption.trim(),
      stage: stage,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Site Manager',
    };

    onPhotoUpload(newPhoto);
    
    toast.success('Photo uploaded successfully');
    
    setCaption('');
    setStage('');
    setImageDataUrl('');
    setIsUploading(false);
    setOpen(false);
  };

  const handleCancel = () => {
    setCaption('');
    setStage('');
    setImageDataUrl('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full bg-red-600 hover:bg-red-700">
          <Camera size={24} weight="fill" className="mr-2" />
          Upload Site Photo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera size={24} weight="fill" className="text-red-600" />
            Upload Site Photo
          </DialogTitle>
          <DialogDescription>
            Add photos to keep clients updated on construction progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="photo-file">Photo</Label>
            <div className="mt-2">
              <Input
                id="photo-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
            </div>
            {imageDataUrl && (
              <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                <img src={imageDataUrl} alt="Preview" className="w-full h-48 object-cover" />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="photo-stage">Construction Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger id="photo-stage" className="mt-2">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {projectStages.map((stageName) => (
                  <SelectItem key={stageName} value={stageName}>
                    {stageName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="photo-caption">Caption</Label>
            <Textarea
              id="photo-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe what's shown in this photo..."
              className="mt-2 min-h-[80px]"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{caption.length}/200 characters</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isUploading || !imageDataUrl}
            >
              <Upload size={20} weight="bold" className="mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
