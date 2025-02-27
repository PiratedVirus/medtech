'use client'
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface Appointment {
  id: number;
  appointmentDate: string;
  status: string;
  consultationType: { type: string };
  doctor: { name: string; doctorProfile: { specialty: string } };
}

export default function AppointmentListCard({ appointment }: { appointment: Appointment }) {
  return (
    <Card className="w-full max-w-2xl bg-white border-0 shadow-md">
      <CardContent className="p-4 flex items-center gap-4">
        {/* Doctor Image */}
        <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden bg-gray-200">
          <Image
            src="/images/doc.png" // Static image, replace with real data if available
            alt={appointment.doctor.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Appointment Info */}
        <div className="flex flex-col flex-1">
          <h1 className="text-[#56a67c] text-xl font-bold">
             {appointment?.doctor?.name}
          </h1>
          <p className="text-gray-500 text-sm">
            {appointment?.doctor?.doctorProfile?.specialty}
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-1">
            <Calendar className="h-4 w-4 text-gray-500" />
            {new Date(appointment.appointmentDate).toLocaleString()}
          </p>
          <p className="text-gray-500 text-sm">
            Consultation:{" "}
            <span className="text-purple-600">{appointment.consultationType.type}</span>
          </p>
          <p className="text-gray-500 text-sm">
            Status:{" "}
            <span className={`font-semibold ${appointment.status === "Completed" ? "text-green-600" : "text-blue-600"}`}>
              {appointment.status}
            </span>
          </p>
        </div>

        {/* Prescription Button */}
        <div className="text-right">
          <p className="text-gray-700 font-medium cursor-pointer hover:underline">
            Prescription
          </p>
        </div>
      </CardContent>
    </Card>
  );
}