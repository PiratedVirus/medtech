"use client";
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import axios from "axios";
import AppointmentBookingHomeOne from "@/appointment-book/HomeOneABooking";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setBookingData, clearBookingData } from "@/store/appointmentSlice";
import CdLoader from "@/components/ui/custom/cd-loader";

export default function AppointmentPage() {
  const { doctorId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const bookingData = useSelector((state: RootState) => state.appointment.bookingData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctorData = async () => {
      try {
        const response = await axios.get(`/api/doctors/${doctorId}/availability`, { withCredentials: true });
        if (response.data.success) {
          dispatch(setBookingData({ doctor: response.data.doctor, type: null }));
          console.log(response);
        } else {
          setError("Failed to load doctor data");
        }
      } catch (error) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (!bookingData) {
      fetchDoctorData();
    } else {
      setLoading(false);
    }
  }, [doctorId, bookingData, dispatch]);

  if (loading) {
    return <CdLoader />;
  }

  if (error) {
    return <p className="text-red-500 text-center py-5">{error}</p>;
  }

  return (
    <AppointmentBookingHomeOne
      doctor={bookingData?.doctor}
      consultationType={bookingData?.type ?? null}
      onBack={() => {
        router.push('/dashboard/appointments');
        dispatch(clearBookingData());
      }}
    />
  );
}