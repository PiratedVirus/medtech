"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setBookingData } from "@/store/appointmentSlice";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import axios from "axios";
import CdLoader from "@/components/ui/custom/cd-loader";
import { CircleCheckBig, CalendarIcon } from "lucide-react";
import DoctorCard from "@/components/patients/doctors/DoctorCard";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function DoctorsPage() {
  const activeTab: 'doctors' | 'dieticians' = 'dieticians';
  const router = useRouter();
  const dispatch = useDispatch();
  const { clinicId, isLoading: profileLoading, profile } = useDecryptedProfile();

  // Debug logging to see what's happening
  console.log('[DieticiansPage] Debug Info:', {
    profileLoading,
    clinicId,
    profileId: profile?.id,
    hasProfile: !!profile,
    enabledCondition: !!clinicId && !!profile?.id,
    profileKeys: profile ? Object.keys(profile) : [],
  });

  const { toast } = useToast();

  const handleBookAppointment = (doctor: any, type: "video" | "clinic") => {
    dispatch(setBookingData({ doctor, type, isDietician: true }));
    router.push(`/dashboard/appointments/${doctor.id}`);
  };

  // Diet plan requests are now handled entirely inside the View Diet modal on the home page

  // Fetch dieticians using React Query
  const { data: dieticians, isLoading, isError, error } = useQuery({
    queryKey: ["dieticians", clinicId], // Unique cache key
    queryFn: async () => {
      console.log('[DieticiansQuery] API call triggered!', { clinicId });
      if (!clinicId) return [];
      const response = await axios.get(
        `/api/dieticians/get-dieticians?clinicId=${clinicId}`,
        { withCredentials: true }
      );
      console.log("Dieticians response", response.data);
      return response.data.success ? response.data.dieticians : [];
    },
    // Temporarily override global defaults to force initial fetch
    enabled: !!clinicId && !!profile?.id, // Only run when clinicId and profile.id exist
    refetchOnMount: true, // Override global default to ensure initial fetch
    staleTime: 0, // Temporarily disable stale time to force fresh fetch
  });

  console.log('[DieticiansQuery] Query state:', {
    isLoading,
    isError,
    error: error?.message,
    hasData: !!dieticians,
    dataLength: dieticians?.length || 0,
  });

  if (profileLoading || isLoading) {
    return <CdLoader />;
  }

  if (isError) {
    return <p className="text-red-500 text-center py-5">Something went wrong. Failed to load dieticians.</p>;
  }

  return (
    <div className="bg-muted min-h-screen px-4 sm:px-8 md:px-12 lg:px-20 pb-10">
      {/* Mobile tab navigation */}
      <div className="flex justify-center space-x-4 md:hidden py-3">
        <button
          onClick={() => router.push('/dashboard/doctors')}
          //@ts-ignore
          className={`px-4 py-2 font-medium ${activeTab === 'doctors'
            ? 'border-b-2 border-green-700 text-green-700'
            : 'text-gray-600'}`}
        >
          Doctors
        </button>
        <button
          onClick={() => router.push('/dashboard/dieticians')}
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
            {dieticians?.length || 0} Dieticians available for consultation
          </p>
          <div className="flex items-center gap-2 mt-5">
            <CircleCheckBig className="text-green-700 h-6 w-6" />
            <p className="text-lg">
              Book appointments with minimum wait-time and verified dietician details
            </p>
          </div>
        </div>
        <div className="hidden md:block" />
      </div>

      {dieticians && dieticians.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dieticians.map((doctor: any) => (
            <DoctorCard key={doctor.id} doctor={doctor} onBookAppointment={handleBookAppointment} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 py-10">No dieticians available at the moment.</p>
      )}
    </div>
  );
}