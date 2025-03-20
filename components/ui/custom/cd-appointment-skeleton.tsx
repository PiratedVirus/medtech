import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AppointmentSkeleton() {
  return (
    <Card className="w-full bg-custom-mutedgreen/30">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="pl-4">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>

          <div className="flex justify-center items-center w-full">
            <Card className="bg-gradient-to-r from-gray-200 to-gray-300 p-4 rounded-2xl w-full md:w-fit">
              <div className="flex items-center gap-4">
                {/* Avatar skeleton */}
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />

                {/* Center content skeleton */}
                <div className="flex-grow text-center">
                  <Skeleton className="h-6 w-20 mx-auto mb-1" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>

                {/* Time and date skeletons */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

