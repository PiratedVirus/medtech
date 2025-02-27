"use client";
import AppointmentForm from "../ui/custom/cd-appointment-form";
import PaymentSelection from "../ui/custom/cd-appointment-payment";
import AppointmentDoctorInfo from "../ui/custom/cd-appointment-doctor-info";
import { ArrowLeft } from "lucide-react";

interface TimeSlotBookingProps {
  slot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  doctor: any;
  onBack: () => void;
}

export default function TimeSlotBooking({
  slot,
  doctor,
  onBack,
}: TimeSlotBookingProps) {
  return (
    <>
      <AppointmentDoctorInfo doctor={doctor} onBack={onBack} />
      <div className="flex flex-col">
        <div className="text-3xl px-8 pt-3">Patient Details</div>
        <div className="flex flex-row">
          <div className="w-1/2">
            <AppointmentForm />
          </div>
          <div className="w-1/2">
            <PaymentSelection />
          </div>
        </div>
      </div>
    </>
  );
}
