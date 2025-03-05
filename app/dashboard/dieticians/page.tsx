"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setBookingData } from "@/store/appointmentSlice";
import { useDecryptedProfile } from "@/hooks/use-profile";
import axios from "axios";
import CdLoader from "@/components/ui/custom/cd-loader";
import { CircleCheckBig, CalendarIcon } from "lucide-react";
import DoctorCard from "@/components/patients/doctors/DoctorCard";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function DoctorsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { clinicId, isLoading: profileLoading } = useDecryptedProfile();

  const handleBookAppointment = (doctor: any, type: "video" | "clinic") => {
    dispatch(setBookingData({ doctor, type }));
    router.push(`/dashboard/appointments/${doctor.id}`);
  };

  // Fetch dieticians using React Query
  const { data: doctors, isLoading, isError } = useQuery({
    queryKey: ["dieticians", clinicId], // Unique cache key
    queryFn: async () => {
      if (!clinicId) return [];
      const response = await axios.get(
        `/api/dieticians/get-dieticians?clinicId=${clinicId}`,
        { withCredentials: true }
      );
      return response.data.success ? response.data.doctors : [];
    },
    staleTime: 10 * 60 * 1000, //  Keeps cache valid for 10 minutes
    gcTime: 60 * 60 * 1000, //  Keeps cache for 1 hour
    refetchOnWindowFocus: false, //  Prevents re-fetching on tab switch
    refetchOnMount: false, //  Prevents re-fetching when navigating back
    refetchOnReconnect: true, //  Fetches only if internet reconnects
    enabled: !!clinicId, //  Runs only when clinicId exists
  });

  if (profileLoading || isLoading) {
    return <CdLoader />;
  }

  if (isError) {
    return <p className="text-red-500 text-center py-5">Something went wrong. Failed to load dieticians.</p>;
  }

  return (
    <div className="bg-muted min-h-screen px-4 sm:px-8 md:px-12 lg:px-20 pb-10">
      <div className="py-7 mb-5 flex flex-col md:flex-row md:items-center justify-between border-b-2">
        <div>
          <p className="text-4xl font-bold text-gray-800">
            {doctors.length} Dieticians available for consultation
          </p>
          <div className="flex items-center gap-2 mt-5">
            <CircleCheckBig className="text-green-700 h-6 w-6" />
            <p className="text-lg">
              Book appointments with minimum wait-time and verified dietician details
            </p>
          </div>
        </div>

        <Button
          className="bg-teal-100 border-0 shadow-none rounded-lg p-6 flex items-center justify-center gap-2 w-full md:w-auto mt-5 md:mt-0"
        >
          <span className="text-green-800">
            <b>Choose Date</b>
          </span>
          <CalendarIcon className="text-green-800 h-6 w-6" />
        </Button>
      </div>

      {doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doctor: any) => (
            <DoctorCard key={doctor.id} doctor={doctor} onBookAppointment={handleBookAppointment} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 py-10">No dieticians available at the moment.</p>
      )}
    </div>
  );
}