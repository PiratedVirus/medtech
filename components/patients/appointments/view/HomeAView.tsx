"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import UpcomingAppointment from "@/appointment-view/UpcomingACardAView";
import ArrowButton from "@/components/ui/custom/cd-arrow-button";
import AppointmentListCard from "@/appointment-view/ListCardAView";
import { useDecryptedProfile } from "@/hooks/use-profile";
import CdLoader from "@/components/ui/custom/cd-loader";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";

export default function AppointmentViewHome() {
  const [appointments, setAppointments] = useState([]);
  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { clinicId, profile, isLoading: profileLoading } = useDecryptedProfile();
  const dispatch = useDispatch();
  const bookingData = useSelector(
    (state: RootState) => state.appointment.bookingData,
  );

  useEffect(() => {
    async function fetchAppointments() {
      if (!clinicId) {
        return;
      }
      try {
        const response = await axios.get(
          `/api/appointments?clinicId=${clinicId}&patientId=${profile?.id}`,
          { withCredentials: true },
        );
        if (response.data.success) {
          // console.log(`all appointments: ${JSON.stringify(response?.data)}`);
          // console.log(`upcoming appointments: ${response?.data?.data.upcoming}`);
          setAppointments(response.data.data.past);
          setUpcoming(response.data.data.upcoming);
        } else {
          setError("Failed to load appointments");
        }
      } catch (error) {
        console.error("Failed to fetch appointments", error);
      } finally {
        setLoading(false);
      }
    }
    if (!profileLoading) {
      fetchAppointments();
    }
  }, [clinicId, profileLoading]);

  if (profileLoading || loading) {
    return <CdLoader />;
  }

  if (error) {
    return <p className="text-red-500 text-center py-5">{error}</p>;
  }

  return (
    <div className="py-7 md:px-20 bg-muted">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-7">
        <div className="md:col-span-8 ">
          <UpcomingAppointment appointment={upcoming} />
        </div>

        <div className="md:col-span-4 p-6 rounded-3xl relative overflow-hidden bg-custom-mutedgreen flex items-center justify-center">
          <ArrowButton buttonText="Book an Appointment" href="/dashboard/doctors" />
        </div>
      </div>
      <div className="py-7 mb-5 flex flex-col md:flex-row md:items-center justify-between border-b-2">
        <div>
          <p className="text-4xl font-bold text-gray-800">
            Past Appointments
          </p>
          <div className="flex items-center gap-2 mt-5">
            <p className="text-lg">
              Here you can view your previous appointments
            </p>
          </div>
        </div>
      </div>

      {appointments?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map((appointment) => (
            //@ts-ignore
            <AppointmentListCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 py-10">
          No appointments available at the moment.
        </p>
      )}
    </div>
  );
}