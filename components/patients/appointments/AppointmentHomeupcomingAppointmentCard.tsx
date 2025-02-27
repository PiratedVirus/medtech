import { Calendar, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface UpcomingAppointmentProps {
  appointment: {
    doctor: {
      name: string;
    };
    consultationType: {
      type: string;
    };
    appointmentDate: string;
  } | null;
}

export default function UpcomingAppointment({ appointment }: UpcomingAppointmentProps) {
  if (!appointment) {
    return (
      <div className="p-6 rounded-3xl bg-custom-mutedgreen">
        <h2 className="text-2xl font-semibold text-gray-800">Upcoming Appointment</h2>
        <p className="text-gray-600">No upcoming appointments scheduled.</p>
      </div>
    );
  }

  const appointmentDate = new Date(appointment.appointmentDate);
  const formattedDate = appointmentDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = appointmentDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="p-6 rounded-3xl relative overflow-hidden bg-custom-mutedgreen">
      {/* Background Layer - Right Half */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full"
        style={{
          backgroundImage:
            "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bg-layer-M2yo7sLPwBebAL59BiUsCsMf421zu4.png)",
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        {/* Left Section */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-800">Upcoming Appointment</h2>
          <p className="text-gray-600 flex items-center gap-2">
            Session starts at {formattedTime}
          </p>
        </div>

        {/* Right Section - Appointment Card */}
        <Card className="bg-gradient-to-tr from-[#134F30] to-[#56A67C] text-white p-4 rounded-2xl w-full md:w-auto">
          <div className="flex items-center gap-4">
            {/* Doctor Image */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <Image src="/images/doc.png?height=48&width=48" alt={appointment.doctor.name} fill className="object-cover" />
            </div>

            {/* Appointment Details */}
            <div className="flex-grow">
              <h3 className="font-semibold text-lg">{appointment.doctor.name}</h3>
              <p className="text-sm text-white/90">{appointment.consultationType.type} consultation</p>
            </div>

            {/* Time and Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}