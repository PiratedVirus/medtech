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
  const isDietician = bookingData?.isDietician || false;

  // Fetch doctor availability using React Query
  const { data: doctorData, isLoading, isError } = useQuery({
    queryKey: ["doctorAvailability", doctorId],
    queryFn: async () => {
      if (!doctorId) return null;
      const response = await axios.get(`/api/doctors/${doctorId}/availability`, { withCredentials: true });
      return response.data.success ? response.data.doctor : null;
    },
    // Using global defaults for consistent caching behavior
    enabled: !!doctorId, // ✅ Runs only when doctorId exists
  });

  // Dispatch data to Redux when available
  useEffect(() => {
    if (doctorData) {
      dispatch(setBookingData({ doctor: doctorData, type:bookingData?.type ?? "video", isDietician}));
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
      consultationType={bookingData?.type ?? "video"}
      onBack={() => {
        router.push("/dashboard/appointments");
        dispatch(clearBookingData());
      }}
    />
  );
}