'use client'
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

interface AppointmentImage {
  id: number;
  imageUrl: string;
  type: 'BEFORE' | 'AFTER';
  createdAt: string;
  appointmentId: number;
}

interface Appointment {
  id: number;
  date: string;
  status: string;
}

interface ImageGalleryProps {
  images: AppointmentImage[];
  appointments: Appointment[];
  loading?: boolean;
  showUpload?: boolean;
  onUpload?: () => void;
  isUploading?: boolean;
  allowDelete?: boolean;
  onDelete?: (imageId: number) => void;
  currentAppointmentId?: number;
}

export default function ImageGallery({
  images,
  appointments,
  loading = false,
  showUpload = false,
  onUpload,
  isUploading = false,
  allowDelete = false,
  onDelete,
  currentAppointmentId,
}: ImageGalleryProps) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Filter images based on selected appointment
  const filteredImages = useMemo(() => {
    if (selectedAppointmentId === '') {
      return images;
    }
    return images.filter(img => img.appointmentId.toString() === selectedAppointmentId);
  }, [images, selectedAppointmentId]);

  // Get unique appointments that have images
  const appointmentsWithImages = useMemo(() => {
    const appointmentIds = new Set(images.map(img => img.appointmentId));
    return appointments
      .filter(apt => appointmentIds.has(apt.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, images]);

  const selectedAppointment = appointmentsWithImages.find(
    apt => apt.id.toString() === selectedAppointmentId
  );

  if (loading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500">Loading images...</p>
      </Card>
    );
  }

  if (images.length === 0 && !showUpload) {
    return null;
  }

  return (
    <>
      <Card className="relative overflow-hidden rounded-xl border border-emerald-300 bg-white p-4 shadow-md">
        <div className="absolute inset-0 -skew-y-2 bg-gradient-to-tr from-emerald-100 via-emerald-50 to-lime-100 opacity-60" />
        
        <div className="relative z-10">
          {/* Header with selector and upload */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">Images</h3>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full px-2 py-0.5 text-xs">
                {filteredImages.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Appointment Selector */}
              {appointmentsWithImages.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 min-h-0 px-2 py-0 leading-none text-xs flex items-center gap-1 rounded-full">
                      <span>
                        {selectedAppointmentId
                          ? `${new Date(selectedAppointment?.date || '').toLocaleDateString()}`
                          : 'All Appointments'}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white" align="end">
                    <DropdownMenuItem onClick={() => setSelectedAppointmentId('')}>
                      All Appointments
                    </DropdownMenuItem>
                    {appointmentsWithImages.map(apt => (
                      <DropdownMenuItem 
                        key={apt.id} 
                        onClick={() => setSelectedAppointmentId(apt.id.toString())}
                      >
                        {new Date(apt.date).toLocaleDateString()}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Upload Button */}
              {showUpload && onUpload && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onUpload}
                  disabled={isUploading}
                  className="h-7 min-h-0 px-3 py-0 text-xs"
                >
                  {isUploading ? 'Uploading...' : 'Upload Images'}
                </Button>
              )}
            </div>
          </div>

          {/* Images Grid */}
          {filteredImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-300 transition-all"
                  onClick={() => setExpandedImage(image.imageUrl)}
                >
                  <div className="aspect-square bg-gray-100">
                    <Image
                      src={image.imageUrl}
                      alt="Image"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {allowDelete && onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(image.id);
                      }}
                      className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded hover:bg-red-600 transition-colors z-10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No images available</p>
            </div>
          )}
        </div>
      </Card>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={() => setExpandedImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative w-full h-full max-w-7xl max-h-[90vh]">
            <Image
              src={expandedImage}
              alt="Expanded"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}

