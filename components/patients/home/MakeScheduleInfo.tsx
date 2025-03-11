import Image from "next/image"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MakeScheduleInfo() {
  return (
    <div className="max-w-full bg-muted mx-auto px-20 py-16 md:py-4">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="relative">
          <div className="rounded-full m-16 border-4 border-[#56a67c] overflow-hidden">
            <Image
              src="/images/make-schedule.png"
              alt="Doctor consulting with patient"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[#56a67c] text-2xl font-medium">Make a Shedule</h3>

          <h2 className="text-[#121212] text-3xl md:text-4xl font-bold leading-tight">
            Schedule appointments in advance with available doctors for care at your convenience.
          </h2>

          <p className="text-[#696969] text-lg">
            Managing diabetes can be overwhelming, especially if you're not regularly monitoring your health. Care
            Diabetics simplifies the process by making it easy for you to book appointments, access personalized care,
            and stay on top of your health, all from the comfort of your home.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#56a67c] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#121212] text-xl font-medium">Make a schedule online is easy</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#56a67c] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#121212] text-xl font-medium">Easy to connect with nearest lab</span>
            </div>
          </div>

          <Button className="bg-[#f28a2e] hover:bg-[#f28a2e]/90 text-white rounded-full px-8 py-6 text-lg font-medium">
            Make Schedule Now!
          </Button>
        </div>
      </div>
    </div>
  )
}

