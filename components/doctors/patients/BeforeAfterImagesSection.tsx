'use client'
import { useState, useEffect } from 'react';
import ImageGallery from '@/components/common/ImageGallery';
import { useToast } from '@/hooks/use-toast';

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
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const { toast } = useToast();

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

  // Handle image deletion
  const handleDeleteImage = async (imageId: number) => {
    // Find the image to get its appointmentId
    const imageToDelete = allImages.find(img => img.id === imageId);
    if (!imageToDelete) {
      toast({
        title: "Error",
        description: "Image not found",
        variant: "destructive",
      });
      return;
    }

    const appointmentId = imageToDelete.appointmentId;

    try {
      setDeletingImageId(imageId);
      const response = await fetch(`/api/doctor/appointments/${appointmentId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete image' }));
        throw new Error(errorData.error || 'Failed to delete image');
      }

      // Remove the image from local state
      setAllImages(prev => prev.filter(img => img.id !== imageId));
      
      toast({
        title: "Success",
        description: "Image deleted successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete image",
        variant: "destructive",
      });
    } finally {
      setDeletingImageId(null);
    }
  };

  // Format appointments for gallery component
  const formattedAppointments = appointments
    .filter(apt => apt.status === 'COMPLETED')
    .map(apt => ({
      id: apt.id,
      date: apt.date,
      status: apt.status,
    }));

  if (allImages.length === 0 && !loading) {
    return null; // Don't show section if no images
  }

  return (
    <div className="grid gap-4 grid-cols-12 mt-6">
      <div className="col-span-12">
        <ImageGallery
          images={allImages}
          appointments={formattedAppointments}
          loading={loading}
          showUpload={false}
          allowDelete={true}
          onDelete={handleDeleteImage}
        />
      </div>
    </div>
  );
}

