import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SitePhoto } from '@/lib/types';
import { X, CaretLeft, CaretRight, Calendar, HardHat, DownloadSimple } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { showToast } from '@/lib/toast';

interface PhotoGalleryProps {
  photos: SitePhoto[];
  onDeletePhoto?: (photoId: string) => void;
  allowDelete?: boolean;
}

export function PhotoGallery({ photos, onDeletePhoto, allowDelete = false }: PhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
  };

  const goToPrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const handleDelete = (photoId: string) => {
    if (onDeletePhoto) {
      onDeletePhoto(photoId);
      closeLightbox();
    }
  };

  const handleDownload = async (photo: SitePhoto) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `${photo.stage.replace(/\s+/g, '_')}_${new Date(photo.uploadedAt).toISOString().split('T')[0]}.jpg`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast.success('Photo downloaded successfully', `Saved as ${fileName}`)
    } catch (error) {
      showToast.error('Failed to download photo', 'Please try again')
      console.error('Download error:', error);
    }
  };

  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  const sortedPhotos = [...photos].sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  if (photos.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {sortedPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden card-hover-effect"
          >
            <img 
              src={photo.url} 
              alt={photo.caption} 
              className="w-full h-full object-cover cursor-pointer"
              loading="lazy"
              onClick={() => openLightbox(photos.findIndex(p => p.id === photo.id))}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-medium line-clamp-2">{photo.caption}</p>
                <p className="text-white/80 text-xs mt-1">{photo.stage}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(photo);
                }}
                aria-label={`Download ${photo.caption}`}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                title="Download photo"
              >
                <DownloadSimple size={18} weight="bold" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={selectedPhotoIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-4xl p-0 gap-0">
          {selectedPhoto && (
            <div className="relative">
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              >
                <X size={24} weight="bold" />
              </button>

              {selectedPhotoIndex !== null && selectedPhotoIndex > 0 && (
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <CaretLeft size={32} weight="bold" />
                </button>
              )}

              {selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1 && (
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <CaretRight size={32} weight="bold" />
                </button>
              )}

              <div className="bg-black">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption}
                  className="w-full max-h-[70vh] object-contain"
                />
              </div>

              <div className="bg-white p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedPhoto.caption}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Badge className="bg-red-600">
                      <HardHat size={14} weight="fill" className="mr-1" />
                      {selectedPhoto.stage}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar size={16} weight="regular" />
                      <span>
                        {formatDistanceToNow(new Date(selectedPhoto.uploadedAt), { addSuffix: true })}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      Uploaded by {selectedPhoto.uploadedBy}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-sm text-gray-500">
                    Photo {selectedPhotoIndex !== null ? selectedPhotoIndex + 1 : 0} of {photos.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedPhoto)}
                      className="flex items-center gap-2"
                    >
                      <DownloadSimple size={16} weight="bold" />
                      Download
                    </Button>
                    {allowDelete && onDeletePhoto && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(selectedPhoto.id)}
                      >
                        Delete Photo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
