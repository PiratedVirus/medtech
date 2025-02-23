import { ArrowLeft, ArrowRight, MapPin, Clock, CreditCard, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
interface AppointmentBookingProps {
    doctor: any;
    consultationType: 'video' | 'clinic' | null;
    onBack: () => void;
  }
  
export default function AppointmentBooking({ doctor, consultationType, onBack }: AppointmentBookingProps) {
  return (
    <div className="container mx-auto p-4">
      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Back Button */}
          <Link href="#" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>

          {/* Doctor Info */}
          <div className="flex justify-between items-start border-b-2 mb-10">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{doctor?.name}</h1>
              <p className="text-gray-600">{doctor?.doctorProfile.specialty}</p>
              <p className="text-gray-500">{` ${doctor?.doctorProfile.yearsOfExperience} years overall experience`}</p>
              <p className="text-gray-600">{`₹ ${doctor?.doctorProfile.consultationFee} Consultation fee at clinic`}</p>
              <div className="flex items-center gap-4">
                <ThumbsUp className="h-4 w-4 text-green-400" />
                <span className="text-green-600 font-semibold">{doctor?.doctorProfile.rating}</span>
                {/* <span className="text-gray-500">69 Patient stories</span> */}
              </div>
            </div>
            <div className="relative w-48 h-48 rounded-lg overflow-hidden">
              <Image
                src="/images/doc.png?height=192&width=192"
                alt="doctor"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Date Navigation */}
          <Card className="bg-[#e6f4f1]">
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <h3 className="font-semibold">Today</h3>
                  <p className="text-sm text-green-600">9 slots available</p>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold">Tomorrow</h3>
                  <p className="text-sm text-gray-500">No slots available</p>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold">Mon 11, Nov</h3>
                  <p className="text-sm text-green-600">20 slots available</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Time Slots */}
          <div className="space-y-6">
            {/* Afternoon Slots */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Afternoon <span className="text-sm font-normal text-gray-500">(6 slots)</span>
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {["01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"].map((time) => (
                  <Button key={time} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            {/* Evening Slots */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Evening <span className="text-sm font-normal text-gray-500">(3 slots)</span>
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {["06:00 PM", "06:30 PM", "07:00 PM"].map((time) => (
                  <Button key={time} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Hospital address
            </h2>
            <div className="relative h-48 rounded-lg overflow-hidden mb-4">
              <Image
                src="/placeholder.svg?height=192&width=400"
                alt="Hospital location"
                fill
                className="object-cover"
              />
            </div>
            <Link href="#" className="text-green-600 hover:underline">
              Get Directions
            </Link>
            <p className="mt-4 text-gray-600">
              AIIMS Hospital, Sector-9, Noida,
              <br />
              Opposite ICICI Bank, Road-1, Delhi
            </p>
            <div className="mt-4 flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <div>
                <p>MON - SAT</p>
                <p>10:00 AM - 8:00 PM</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-gray-600">
              <CreditCard className="h-4 w-4" />
              <p>Online Payment Mode Available</p>
            </div>

            {/* Hospital Images */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={`/placeholder.svg?height=100&width=100`}
                    alt={`Hospital facility ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <Button className="w-full mt-6 bg-orange-500 hover:bg-orange-600">Instant Pay Available</Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

