'use client';
import { ArrowRight, Clock, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useDecryptedProfile } from "@/hooks/use-profile";
import Link from "next/link";
import AppointmentSkeleton from "@/components/ui/custom/cd-appointment-skeleton";

export function HomeAppointmentOverview() {
  const { clinicId, profile, isLoading: profileLoading } = useDecryptedProfile();

  // Fetch and cache appointment data using React Query
  const { data: appointment, isLoading, isError } = useQuery({
    queryKey: ["upcomingAppointment", clinicId, profile?.id], // Unique cache key
    queryFn: async () => {
      if (!clinicId || !profile?.id) return null;
      const response = await axios.get(
        `/api/appointments?clinicId=${clinicId}&patientId=${profile?.id}&upcomingOnly=true`,
        { withCredentials: true }
      );
      return response.data.success ? response.data.data : null;
    },
    staleTime: 10 * 60 * 1000, // Data remains fresh for 10 minutes
    gcTime: 60 * 60 * 1000, // Cache garbage collected after 1 hour
    refetchOnWindowFocus: false, // Prevents refetching when switching tabs
    refetchOnMount: false, // Prevents re-fetching on component mount
    refetchOnReconnect: true, // Fetches only if internet reconnects
    enabled: !!clinicId && !!profile?.id, // Runs only when values exist
  });

  if (isLoading || profileLoading) return <AppointmentSkeleton />;
  if (isError || !appointment)
    return (
      <div className="p-6 rounded-3xl max-w-sm bg-custom-mutedgreen">
        <h2 className="text-2xl font-semibold text-gray-800">Upcoming Appointment</h2>
        <p className="text-gray-600">No upcoming appointments scheduled.</p>
      </div>
    );

  const { doctor, consultationType, appointmentLink, doctorAvailability } = appointment;
  const formattedDate = new Date(doctorAvailability?.date ?? new Date()).toLocaleDateString(
    "en-IN",
    { day: "2-digit", month: "2-digit", year: "numeric" }
  );

  return (
    <Card className="w-full bg-custom-mutedgreen">
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
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <Image src="/images/gmeet.png?height=48&width=48" alt="gmeet" fill className="object-cover" />
                    </div>
                    <div className="flex-grow text-center">
                      <h3 className="font-semibold text-lg">JOIN</h3>
                    </div>
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
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <Image src="/images/doc.png?height=48&width=48" alt={doctor.name} fill className="object-cover" />
                  </div>
                  <div className="flex-grow text-center">
                    <h3 className="font-semibold text-lg">{doctor.name}</h3>
                    <p className="text-sm text-white/90">{consultationType} consultation</p>
                  </div>
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