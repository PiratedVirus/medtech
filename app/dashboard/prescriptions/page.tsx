"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import AppointmentListCard from "@/components/patients/appointments/view/ListCardAView";
import { useDecryptedProfile } from "@/hooks/use-profile";
import CdLoader from "@/components/ui/custom/cd-loader";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function PrescriptionViewHome() {
  const { clinicId, profile, isLoading: profileLoading } = useDecryptedProfile();
  const bookingData = useSelector((state: RootState) => state.appointment.bookingData);

  // Fetch appointments using React Query
  const { data: appointments, isLoading, isError } = useQuery({
    queryKey: ["appointments", clinicId, profile?.id],
    queryFn: async () => {
      if (!clinicId || !profile?.id) return { past: [], upcoming: [] };
      const response = await axios.get(
        `/api/appointments?clinicId=${clinicId}&patientId=${profile?.id}`,
        { withCredentials: true }
      );
      return response.data.success ? response.data.data : { past: [], upcoming: [] };
    },
    staleTime: 10 * 60 * 1000, // ✅ Keeps cache valid for 10 minutes
    gcTime: 60 * 60 * 1000, // ✅ Keeps cache for 1 hour
    refetchOnWindowFocus: false, // ✅ Prevents re-fetching on tab switch
    refetchOnMount: false, // ✅ Prevents re-fetching when navigating back
    refetchOnReconnect: true, // ✅ Fetches only if internet reconnects
    enabled: !!clinicId && !!profile?.id, // ✅ Runs only when clinicId & profile.id exist
  });

  if (profileLoading || isLoading) {
    return <CdLoader />;
  }

  if (isError) {
    return <p className="text-red-500 text-center py-5">Something went wrong. Failed to load appointments.</p>;
  }

  const pastAppointments = (appointments?.past ?? []).filter((a: any) => a.prescriptionLink);
  const futureAppointments = appointments?.upcoming ?? [];
  const upcoming = futureAppointments.length > 0 ? futureAppointments[0] : null;

  return (
    <div className="py-7 md:px-20 bg-muted">
      <div className="pastAppointments">
        <div className="py-7 mb-5 flex flex-col md:flex-row md:items-center justify-between border-b-2">
          <div>
            <p className="text-4xl font-bold text-gray-800">View Prescriptions from past Appointments</p>
            <div className="flex items-center gap-2 mt-5">
              <p className="text-lg">Here you can view your previous Prescriptions</p>
            </div>
          </div>
        </div>
        {pastAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pastAppointments.map((appointment: any) => (
              <AppointmentListCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-10">No past appointments available at the moment.</p>
        )}
      </div>
    </div>
  );
}