'use client'
import { useState, useEffect, useMemo } from 'react';
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

interface BeforeAfterImagesSectionProps {
  patientId: string;
  appointments: Appointment[];
}

export default function BeforeAfterImagesSection({ patientId, appointments }: BeforeAfterImagesSectionProps) {
  const [allImages, setAllImages] = useState<AppointmentImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Fetch images from all appointments
  useEffect(() => {
    fetchAllImages();
  }, [patientId, appointments]);

  const fetchAllImages = async () => {
    try {
      setLoading(true);
      const completedAppointments = appointments.filter(
        apt => apt.status === 'COMPLETED'
      );

      const imagePromises = completedAppointments.map(async (apt) => {
        try {
          const response = await fetch(`/api/doctor/appointments/${apt.id}/images`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
              return data.data.map((img: any) => ({
                ...img,
                appointmentId: apt.id,
              }));
            }
          }
          return [];
        } catch (error) {
          console.error(`Error fetching images for appointment ${apt.id}:`, error);
          return [];
        }
      });

      const imageArrays = await Promise.all(imagePromises);
      const flattened = imageArrays.flat();
      setAllImages(flattened);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter images based on selected appointment
  const filteredImages = useMemo(() => {
    if (selectedAppointmentId === '') {
      return allImages;
    }
    return allImages.filter(img => img.appointmentId.toString() === selectedAppointmentId);
  }, [allImages, selectedAppointmentId]);

  const beforeImages = filteredImages.filter(img => img.type === 'BEFORE');
  const afterImages = filteredImages.filter(img => img.type === 'AFTER');

  // Get unique appointments that have images
  const appointmentsWithImages = useMemo(() => {
    const appointmentIds = new Set(allImages.map(img => img.appointmentId));
    return appointments
      .filter(apt => appointmentIds.has(apt.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, allImages]);

  const selectedAppointment = appointmentsWithImages.find(
    apt => apt.id.toString() === selectedAppointmentId
  );

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-12 mt-6">
        <div className="col-span-12">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Loading images...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (allImages.length === 0) {
    return null; // Don't show section if no images
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-12 mt-6">
        {/* Before Images - 6 columns */}
        <div className="col-span-6">
          <Card className="relative overflow-hidden rounded-xl border border-emerald-300 bg-white p-4 shadow-md">
            <div className="absolute inset-0 -skew-y-2 bg-gradient-to-tr from-emerald-100 via-emerald-50 to-lime-100 opacity-60" />
            
            <div className="relative z-10">
              {/* Header with selector */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">Before Images</h3>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full px-2 py-0.5 text-xs">
                    {beforeImages.length}
                  </Badge>
                </div>
                
                {/* Appointment Selector */}
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
              </div>

              {/* Images Grid */}
              {beforeImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {beforeImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-300 transition-all"
                      onClick={() => setExpandedImage(image.imageUrl)}
                    >
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={image.imageUrl}
                          alt="Before"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No before images available</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* After Images - 6 columns */}
        <div className="col-span-6">
          <Card className="relative overflow-hidden rounded-xl border border-emerald-300 bg-white p-4 shadow-md">
            <div className="absolute inset-0 -skew-y-2 bg-gradient-to-tr from-emerald-100 via-emerald-50 to-lime-100 opacity-60" />
            
            <div className="relative z-10">
              {/* Header with selector */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">After Images</h3>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full px-2 py-0.5 text-xs">
                    {afterImages.length}
                  </Badge>
                </div>
                
                {/* Appointment Selector */}
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
              </div>

              {/* Images Grid */}
              {afterImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {afterImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-300 transition-all"
                      onClick={() => setExpandedImage(image.imageUrl)}
                    >
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={image.imageUrl}
                          alt="After"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No after images available</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

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
          <img
            src={expandedImage}
            alt="Expanded"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

