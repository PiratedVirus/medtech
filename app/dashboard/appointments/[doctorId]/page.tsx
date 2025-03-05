"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import axios from "axios";
import AppointmentBookingHomeOne from "@/appointment-book/HomeOneABooking";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setBookingData, clearBookingData } from "@/store/appointmentSlice";
import CdLoader from "@/components/ui/custom/cd-loader";
import { useQuery } from "@tanstack/react-query";

export default function AppointmentPage() {
  const { doctorId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const bookingData = useSelector((state: RootState) => state.appointment.bookingData);

  // Fetch doctor availability using React Query
  const { data: doctorData, isLoading, isError } = useQuery({
    queryKey: ["doctorAvailability", doctorId],
    queryFn: async () => {
      if (!doctorId) return null;
      const response = await axios.get(`/api/doctors/${doctorId}/availability`, { withCredentials: true });
      return response.data.success ? response.data.doctor : null;
    },
    staleTime: 2 * 60 * 1000, // ✅ Cache remains fresh for 10 minutes
    gcTime: 60 * 60 * 1000, // ✅ Keeps cache for 1 hour
    refetchOnWindowFocus: false, // ✅ Prevents refetch on tab switch
    refetchOnMount: false, // ✅ Prevents re-fetching on mount
    refetchOnReconnect: true, // ✅ Fetches only if internet reconnects
    enabled: !!doctorId, // ✅ Runs only when doctorId exists
  });

  // Dispatch data to Redux when available
  useEffect(() => {
    if (doctorData) {
      dispatch(setBookingData({ doctor: doctorData, type: null }));
    }
  }, [doctorData, dispatch]);

  if (isLoading) {
    return <CdLoader />;
  }

  if (isError || !doctorData) {
    return <p className="text-red-500 text-center py-5">Something went wrong. Failed to load doctor data.</p>;
  }

  return (
    <AppointmentBookingHomeOne
      doctor={doctorData}
      consultationType={bookingData?.type ?? null}
      onBack={() => {
        router.push("/dashboard/appointments");
        dispatch(clearBookingData());
      }}
    />
  );
}