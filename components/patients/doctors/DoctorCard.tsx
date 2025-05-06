import { Calendar, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface DoctorProfile {
  specialty: string;
  yearsOfExperience: number;
  consultationFee: number;
  rating?: number;
  patientStories?: number;
  availability: string[];
}

interface Doctor {
  image?: string;
  name: string;
  userProfilePicture?: string;
  doctorProfile: DoctorProfile;
}
interface DoctorCardProps {
  doctor: Doctor;
  onBookAppointment: (doctor: Doctor, type: 'video' | 'clinic') => void;
}
export default function DoctorCard({ doctor, onBookAppointment }: DoctorCardProps) {
  return (
    <Card className="w-full max-w-2xl bg-white border-0">
      <CardContent className="p-3 sm:p-1">
        {/* Main Content */}
        <div className="grid md:grid-cols-[180px_1fr] gap-4">
          {/* Image Section */}
          <div className="flex items-center justify-center p-3">
            <div className="relative w-[180px] h-[270px] rounded-xl overflow-hidden bg-[#daf3ff]">
              <Image
                src={doctor.userProfilePicture || "/images/doc.png"}
                alt={doctor.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="py-4 pr-4">
            <div className="space-y-3">
              <h1 className="text-[#56a67c] text-2xl font-bold">
                {doctor.name}
              </h1>

              <div className="space-y-1">
                <p className="text-gray-400 text-base">
                  {doctor.doctorProfile?.specialty}
                </p>
                <p className="text-gray-400 text-sm">
                  {doctor.doctorProfile?.yearsOfExperience} years overall experience
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Video className="text-purple-500 h-4 w-4" />
                    <span className="text-purple-500 text-sm">
                      Video Consultation
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <Calendar className="text-pink-500 h-4 w-4" />
                    <span className="text-pink-500 text-sm">
                      Physical Consultation
                    </span>
                  </div> */}
                </div>
              </div>

              <p className="text-gray-400 text-sm">
                ₹ {doctor.doctorProfile?.consultationFee || 299} Consultation fee at clinic
              </p>

              <div className="flex items-center gap-2 text-[#56a67c]">
                <span className="text-base font-semibold">{doctor.doctorProfile?.rating || ""}</span>
                <span className="text-gray-400 text-sm">
                  • {doctor.doctorProfile?.patientStories || 0} Patient stories
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#56a67c]">
                <Calendar className="text-green-500 h-4 w-4" />
                <span >
                  {doctor?.doctorProfile?.availability?.length > 0 ? <span className="text-green-500 text-sm">Available Today</span> : <span className="text-red-500 text-sm">Not Available Today</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Section - Separated and centered */}
        <div className="mt-2 pb-4 text-center">
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
            <Button
              size="lg"
              onClick={() => onBookAppointment(doctor, 'video')}
              className="bg-[#f28a2e] hover:bg-[#f28a2e]/90 text-white rounded-full px-6"
            >
              Book video visit
            </Button>
            {/* <Button
              size="lg"
              variant="outline"
              onClick={() => onBookAppointment(doctor, 'clinic')}
              className="border-[#f28a2e] text-[#f28a2e] hover:bg-[#f28a2e]/10 rounded-full px-6"
            >
              Book clinic visit
            </Button> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}