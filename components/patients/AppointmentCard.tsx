import { ArrowRight } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function AppointmentCard() {
  return (
    <Card className="max-w-sm">
      <CardContent className="p-4">
        <div className="flex flex-col gap-[15px]">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-[58px] w-[58px]">
              <AvatarImage src="/image-14.png" alt="Appointment" />
              <AvatarFallback>AP</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold">Upcoming Appointment</h3>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-[11px]">
              <div className="flex items-center gap-[9px]">
                <span className="text-sm">Dr. Abhinav</span>
                <span className="text-sm">|</span>
                <span className="text-sm">Video Consultation</span>
              </div>
              <span className="text-sm">02:45 pm, Today</span>
            </div>
          </div>

          <Button className="h-[51px] w-[267px] rounded-[59px]  text-white hover:bg-popover">
            <span className="mr-2">Join Video Consultation</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

