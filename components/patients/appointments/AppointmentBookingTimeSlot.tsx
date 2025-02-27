"use client";
import AppointmentForm from "@/patients/appointments/AppointmentBookingPatientForm";
import PaymentSelection from "@/patients/appointments/AppointmentBookingPayment";
import AppointmentDoctorInfo from "@/patients/appointments/AppointmentBookingDoctorInfo";

interface AppointmentBookingTimeSlotProps {
  slot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  doctor: any;
  onBack: () => void;
}

export default function AppointmentBookingTimeSlot({
  slot,
  doctor,
  onBack,
}: AppointmentBookingTimeSlotProps) {
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
