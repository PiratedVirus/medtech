"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setBookingData } from "@/store/appointmentSlice";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import axios from "axios";
import CdLoader from "@/components/ui/custom/cd-loader";
import { CircleCheckBig, CalendarIcon, Stethoscope } from "lucide-react";
import DoctorCard from "@/components/patients/doctors/DoctorCard";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useDoctors } from "@/hooks/use-smart-queries";
import EmptyState from "@/components/ui/EmptyState";

export default function DoctorsPage() {
  const activeTab: 'doctors' | 'dieticians' = 'doctors';

  const router = useRouter();
  const dispatch = useDispatch();
  const { clinicId, isLoading: profileLoading, profile } = useDecryptedProfile();


  const handleBookAppointment = (doctor: any, type: "video" | "clinic") => {
    dispatch(setBookingData({ doctor, type }));
    router.push(`/dashboard/appointments/${doctor.id}`);
  };

  // Fetch doctors using React Query
  const { data: doctors, isLoading, isError } = useQuery({
    queryKey: ["doctors", clinicId], // Unique cache key
    queryFn: async () => {
      if (!clinicId) return [];
      const response = await axios.get(
        `/api/doctors/get-doctors?clinicId=${clinicId}`,
        { withCredentials: true }
      );
      return response.data.success ? response.data.doctors : [];
    },
    enabled: !!clinicId && !!profile?.id, // Only run when clinicId and profile.id exist
    staleTime: 15 * 60 * 1000,  // 15 minutes - doctor list rarely changes
    refetchOnMount: false,      // Use cached data when available
  });

  if (profileLoading || isLoading) {
    return <CdLoader />;
  }

  if (isError) {
    return <p className="text-red-500 text-center py-5">Something went wrong. Failed to load doctors?.</p>;
  }

  return (
    <div className="bg-muted min-h-screen px-4 sm:px-8 md:px-12 lg:px-20 pb-10">
      {/* Mobile tab navigation */}
      <div className="flex justify-center space-x-4 md:hidden py-3">
        <button
          onClick={() => router.push('/dashboard/doctors')}
          className={`px-4 py-2 font-medium ${activeTab === 'doctors'
            ? 'border-b-2 border-green-700 text-green-700'
            : 'text-gray-600'}`}
        >
          Doctors
        </button>
        <button
          onClick={() => router.push('/dashboard/dieticians')}
          //@ts-ignore
          className={`px-4 py-2 font-medium ${activeTab === 'dieticians'
            ? 'border-b-2 border-green-700 text-green-700'
            : 'text-gray-600'}`}
        >
          Dieticians
        </button>
      </div>
      <div className="py-7 mb-5 flex flex-col md:flex-row md:items-center justify-between border-b-2">
        <div>
          <p className="text-4xl font-bold text-gray-800">
            {doctors?.length} Doctors available for consultation
          </p>
          <div className="flex items-center gap-2 mt-5">
            <CircleCheckBig className="text-green-700 h-6 w-6" />
            <p className="text-lg">
              Book appointments with minimum wait-time and verified doctor details
            </p>
          </div>
        </div>

  
      </div>

      {doctors?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors?.map((doctor: any) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onBookAppointment={handleBookAppointment}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Stethoscope}
          title="No Doctors Available"
          description="Doctors are not currently available for this clinic. Please check back later or contact your clinic administrator for more information."
        />
      )}
    </div>
  );
}