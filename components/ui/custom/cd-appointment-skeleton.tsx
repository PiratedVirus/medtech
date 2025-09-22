import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AppointmentSkeleton() {
  return (
    <Card className="w-full bg-custom-mutedgreen/30">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Left text skeletons */}
          <div className="space-y-2 w-full md:w-auto">
            <Skeleton className="h-6 w-56" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          {/* Right card skeleton to mirror UpcomingACardAView */}
          <Card className="bg-gradient-to-r from-gray-200 to-gray-300 p-4 rounded-2xl w-full md:w-auto">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />

              {/* Center title */}
              <div className="flex-grow">
                <Skeleton className="h-6 w-16 mb-1" />
              </div>

              {/* Time/Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              {/* Start button placeholder */}
              <div className="ml-4">
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact skeleton tuned for the patient home upcoming card
export function PatientUpcomingSkeleton() {
  return (
    <Card className="group relative w-full h-[194px] md:aspect-[484/194] md:h-[184px] overflow-hidden border-0 bg-gradient-to-tl from-[#134F30]/20 to-[#56A67C]/20 shadow-md">
      {/* Background video camera outline - matching the real card */}
      <div className="absolute -right-12 -top-4 h-64 w-64 opacity-5">
        <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-gray-400">
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

      <div className="relative flex h-full p-6">
        {/* Left side content */}
        <div className="flex flex-col justify-between flex-1">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full bg-white/20" />
            <Skeleton className="h-4 w-32 bg-white/20" />
          </div>

          <div>
            {/* Doctor name skeleton */}
            <Skeleton className="h-8 w-48 mb-2 bg-white/20" />
            
            {/* Join button skeleton */}
            <Skeleton className="h-8 w-20 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Right side with stacked date and time pills */}
        <div className="flex flex-col justify-center items-start gap-3 ml-1">
          <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-2">
            <Skeleton className="h-4 w-4 bg-white/40" />
            <Skeleton className="h-4 w-16 bg-white/40" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-2">
            <Skeleton className="h-4 w-4 bg-white/40" />
            <Skeleton className="h-4 w-12 bg-white/40" />
          </div>
        </div>
      </div>
    </Card>
  )
}

// Wider skeleton tuned for the doctor home upcoming card
export function DoctorUpcomingSkeleton() {
  return (
    <div className="p-6 rounded-3xl relative overflow-hidden bg-custom-mutedgreen/30">
      {/* Background pattern placeholder */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gray-200/20 to-transparent" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        {/* Left Section */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 bg-gray-300" />
          <Skeleton className="h-5 w-80 bg-gray-300" />
        </div>

        {/* Right Section - Appointment Card */}
        <Card className="bg-gradient-to-r to-[#134F30]/20 from-[#56A67C]/20 p-4 rounded-2xl w-full md:w-auto">
          <div className="flex items-center gap-4">
            {/* Image */}
            <Skeleton className="w-12 h-12 rounded-full bg-white/30" />

            {/* Appointment Details */}
            <div className="flex-grow">
              <Skeleton className="h-5 w-16 mb-1 bg-white/30" />
              <Skeleton className="h-4 w-24 bg-white/30" />
            </div>

            {/* Time and Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 bg-white/30" />
                <Skeleton className="h-4 w-12 bg-white/30" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 bg-white/30" />
                <Skeleton className="h-4 w-16 bg-white/30" />
              </div>
            </div>
            
            {/* Start button */}
            <div className="ml-4">
              <Skeleton className="h-6 w-12 rounded-full bg-white/50" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

