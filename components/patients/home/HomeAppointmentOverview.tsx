"use client"

import Link from "next/link"
import { Video, ArrowRight, Calendar, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useState } from "react"
import ArrowButton from "@/components/ui/custom/cd-arrow-button"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useDecryptedProfile } from "@/hooks/use-profile"
import AppointmentSkeleton from "@/components/ui/custom/cd-appointment-skeleton"

export default function HomeAppointmentOverview() {
  const [isHovered, setIsHovered] = useState(false)
  const { clinicId, profile, isLoading: profileLoading } = useDecryptedProfile()

  // Fetch and cache appointment data using React Query
  const { data: appointment, isLoading, isError } = useQuery({
    queryKey: ["upcomingAppointment", clinicId, profile?.id],
    queryFn: async () => {
      if (!clinicId || !profile?.id) return null
      const response = await axios.get(
        `/api/appointments?clinicId=${clinicId}&patientId=${profile?.id}&upcomingOnly=true`,
        { withCredentials: true }
      )
      return response.data.success ? response.data.data : null
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    enabled: !!clinicId && !!profile?.id,
  })

  if (isLoading || profileLoading) return <AppointmentSkeleton />

  if (isError || !appointment) {
    return (
      <div className="p-6 rounded-3xl w-full bg-custom-mutedgreen">
        <h2 className="text-2xl font-semibold text-gray-800">Upcoming Appointment</h2>
        <p className="text-gray-600">No upcoming appointments scheduled.</p>
      </div>
    )
  }

  const { doctor, appointmentLink, doctorAvailability } = appointment
  const formattedDate = new Date(doctorAvailability?.date ?? new Date()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

// className="group relative w-full md:w-[484px] aspect-[484/194] overflow-hidden border-0 shadow-md transition-all duration-300 hover:shadow-lg bg-gradient-to-..."

  return (
    <Link href={appointmentLink ?? "/join-appointment"} className="block">
     <Card className="group relative w-full max-w-[484px] h-[194px] md:aspect-[484/194] md:w-[484px] md:h-[184px] overflow-hidden border-0 bg-gradient-to-tl from-[#134F30] to-[#56A67C] shadow-md transition-all duration-300 hover:shadow-lg">
        {/* Large video camera outline in background - adjusted opacity and color */}
        <div className="absolute -right-12 -top-4 h-64 w-64 opacity-5">
          <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-white">
            <path
              d="M23 7L16 12L23 17V7Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="1"
              y="5"
              width="15"
              height="14"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="relative flex h-full p-6 text-white">
          {/* Left side content */}
          <div className="flex flex-col justify-between flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <Video className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-white/90">Upcoming Appointment</span>
            </div>

            <div>
              {/* filled-by-api-response - doctor name */}
              <h3 className="text-2xl font-bold">{doctor?.name ?? "Doctor Name"}</h3>

              {/* Custom Arrow Button */}
              <div className="mt-2">
                {/* filled-by-api-response - href to be replaced with meetLink */}
                <ArrowButton size="small" buttonText="Join Now" href={appointmentLink ?? "/join-appointment"} />
              </div>
            </div>
          </div>

          {/* Right side with stacked date and time - updated styling */}
          <div className="flex flex-col justify-center items-start gap-3 ml-1">
            <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-2 text-sm backdrop-blur-sm">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              {/* filled-by-api-response - appointment date */}
              <span className="font-semibold whitespace-nowrap">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-2 text-sm backdrop-blur-sm">
              <Clock className="h-4 w-4 flex-shrink-0" />
              {/* filled-by-api-response - appointment time */}
              <span className="font-semibold">{doctorAvailability?.startTime ?? "Time"}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}