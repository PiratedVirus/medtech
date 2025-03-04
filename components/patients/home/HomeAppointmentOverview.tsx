import { ArrowRight, Clock, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useState, useEffect } from "react";
import axios from "axios";
import { useDecryptedProfile } from "@/hooks/use-profile";
import Link from "next/link";
import CdLoader from "@/components/ui/custom/cd-loader";

export function HomeAppointmentOverview() {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { clinicId, profile, isLoading: profileLoading } = useDecryptedProfile();

  useEffect(() => {
    async function fetchAppointments() {
      if (!clinicId) return;
      try {
        const response = await axios.get(
          `/api/appointments?clinicId=${clinicId}&patientId=${profile?.id}&upcomingOnly=true`,
          { withCredentials: true }
        );
        if (response.data.success) {
          setAppointment(response.data);
        } else {
          setError("Failed to load appointments");
        }
      } catch (error) {
        console.error("Failed to fetch appointments", error);
      } finally {
        setLoading(false);
      }
    }
    if (!profileLoading) fetchAppointments();
  }, [clinicId, profileLoading]);

  if (loading) return <CdLoader />;
  if (error) return <p className="text-red-500 text-center py-5">{error}</p>;
  if (!appointment)
    return (
      <div className="p-6 rounded-3xl bg-custom-mutedgreen">
        <h2 className="text-2xl font-semibold text-gray-800">Upcoming Appointment</h2>
        <p className="text-gray-600">No upcoming appointments scheduled.</p>
      </div>
    );

  //@ts-ignore  
  const { doctor, consultationType, appointmentLink, doctorAvailability } = appointment?.data;
  const formattedDate = new Date(doctorAvailability?.date ?? new Date()).toLocaleDateString(
    "en-IN",
    { day: "2-digit", month: "2-digit", year: "numeric" }
  );

  return (
    <Card className="max-w-sm">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <p className="text-lg pl-4">
              Upcoming Appointment with <br />
              <span className="font-semibold text-xl">{doctor.name}</span>
            </p>
          </div>

          <div className="flex justify-center items-center w-full">
            {consultationType !== "Physical" ? (
              <Card className="bg-gradient-to-r shadow to-[#134F30] from-[#56A67C] text-white p-4 rounded-2xl w-full md:w-fit flex justify-center items-center">
                <Link href={appointmentLink ?? "#"}>
                  <div className="flex items-center gap-4">
                    {/* Google Meet Icon */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <Image src="/images/gmeet.png?height=48&width=48" alt="gmeet" fill className="object-cover" />
                    </div>

                    {/* Join Button */}
                    <div className="flex-grow text-center">
                      <h3 className="font-semibold text-lg">JOIN</h3>
                    </div>

                    {/* Appointment Time & Date */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{doctorAvailability.startTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            ) : (
              <Card className="bg-gradient-to-tr from-[#134F30] to-[#56A67C] text-white p-4 rounded-2xl w-full md:w-auto flex justify-center items-center">
                <div className="flex items-center gap-4">
                  {/* Doctor Image */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <Image src="/images/doc.png?height=48&width=48" alt={doctor.name} fill className="object-cover" />
                  </div>

                  {/* Doctor Name & Type */}
                  <div className="flex-grow text-center">
                    <h3 className="font-semibold text-lg">{doctor.name}</h3>
                    <p className="text-sm text-white/90">{consultationType} consultation</p>
                  </div>

                  {/* Appointment Time & Date */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{doctorAvailability.startTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}