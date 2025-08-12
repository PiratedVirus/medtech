import { Calendar, Clock, VideoIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

interface UpcomingAppointmentProps {
  appointment: any;
  mode?: 'doctor' | 'patient';
}

export default function UpcomingAppointment({ appointment, mode = 'patient' }: UpcomingAppointmentProps) {
  if (!appointment) {
    return (
      <div className="p-6 rounded-3xl h-full bg-custom-mutedgreen">
        <h2 className="text-2xl font-semibold text-gray-800">Upcoming Appointment</h2>
        <p className="text-gray-600">No upcoming appointments scheduled.</p>
      </div>
    );
  }
  // const appointment = appointments[0];
  // Prefer canonical date from API if present, fallback to doctorAvailability.date
  const rawDate: string | undefined = appointment?.date || appointment?.doctorAvailability?.date;
  const appointmentDate: Date | null = rawDate ? new Date(rawDate) : null;
  const formattedDate: string = appointmentDate
    ? appointmentDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";

  // Determine display info based on mode
  const displayName = mode === 'doctor'
    ? appointment.patient?.name || 'Patient'
    : appointment.doctor?.name || 'Doctor';
  const displayRole = mode === 'doctor' ? 'Patient' : 'Doctor';
  const displayImage = mode === 'doctor' ? '/icons/medicine-pills.svg' : '/images/doc.png';

  return (
    <div className="p-6 rounded-3xl relative overflow-hidden bg-custom-mutedgreen">
      {/* Background Layer - Right Half */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full"
        style={{
          backgroundImage: "url('/images/bg-green-pattern.png')",
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        {/* Left Section */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-800">Upcoming Appointment</h2>
            <p className="text-gray-600 flex items-center gap-2">
              Session starts at {(appointment.startTime || appointment.doctorAvailability?.startTime)} with <b>{displayName}</b>
          </p>
        </div>

        {/* Right Section - Appointment Card */}
        {(appointment.consultationType === 'Video') ? (
          <Card className="bg-gradient-to-r to-[#134F30] from-[#56A67C] text-white p-4 rounded-2xl w-full md:w-auto">
            <Link
              href={`${appointment.appointmentLink}`}
            >
              <div className="flex items-center gap-4">
                {/* Image */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  {/* <VideoIcon className="absolute top-0 left-0 w-full h-full" /> */}
                  <Image src="/images/gmeet.png?height=48&width=48" alt="gmeet" fill className="object-cover" />
                </div>

                {/* Appointment Details */}
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg">JOIN</h3>
                </div>

                {/* Time and Date */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span><b>{appointment.startTime || appointment.doctorAvailability.startTime}</b></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span><b>{formattedDate}</b></span>
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        ) : (<Card className="bg-gradient-to-tr from-[#134F30] to-[#56A67C] text-white p-4 rounded-2xl w-full md:w-auto">
          <div className="flex items-center gap-4">
            {/* Image */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <Image src={displayImage || '/icons/medicine-pills.svg'} alt={displayName} fill className="object-cover" />
            </div>

            {/* Appointment Details */}
            <div className="flex-grow">
              <h3 className="font-semibold text-lg">{displayName}</h3>
              <p className="text-sm text-white/90">{appointment.consultationType} consultation</p>
            </div>

            {/* Time and Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                 <span>{appointment.startTime || appointment.doctorAvailability.startTime}</span>
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
  );
}