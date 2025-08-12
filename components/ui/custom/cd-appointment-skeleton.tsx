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

