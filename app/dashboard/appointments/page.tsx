'use client'
import { useEffect, useState } from "react";
import axios from "axios";
import UpcomingAppointment from "@/components/ui/custom/cd-upcoming-appointment-card";
import ArrowButton from "@/components/ui/custom/cd-arrow-button";
import AppointmentCard from "@/components/patients/AppointmentCard";
import { useDecryptedProfile } from "@/hooks/use-profile";


export default function Page() {
    const [appointments, setAppointments] = useState([]);
    const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { clinicId, isLoading: profileLoading } = useDecryptedProfile();

    useEffect(() => {
        async function fetchAppointments() {
            if (!clinicId) {
                return;
              }
            try {
                const response = await axios.get(`/api/appointments?clinicId=${clinicId}`, { withCredentials: true });
                if (response.data.success) {
                    setAppointments(response.data.past);
                    setUpcoming(response.data.upcoming);
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
        return (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
          </div>
        );
      }
    
      // Show error state
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
                    <ArrowButton buttonText="Book an Appointment" />
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

            {appointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {appointments.map((appointment) => (
                        <AppointmentCard key={appointment} appointment={appointment} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-600 py-10">
                    No dieticians available at the moment.
                </p>
            )}
        </div>
    );
}