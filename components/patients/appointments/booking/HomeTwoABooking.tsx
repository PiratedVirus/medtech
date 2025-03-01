"use client";
import { useState, useRef } from "react";
import axios from "axios";
import { PatientForm } from "@/appointment-book/PatientFormABooking";
import PaymentSelection from "@/appointment-book/PaymentABooking";
import DoctorInfoTwo from "@/appointment-book/DoctorInfoTwoABooking";
import { useDecryptedProfile } from "@/hooks/use-profile";
import SuccessModal from "@/components/ui/custom/cd-success-modal";


interface AppointmentBookingTimeSlotProps {
  slot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  doctor: any;
  onBack: () => void;
}

export default function HomeTwoAppointmentBooking({
  slot,
  doctor,
  onBack,
}: AppointmentBookingTimeSlotProps) {
  const [paymentOption, setPaymentOption] = useState("online");
  const {  profile } = useDecryptedProfile();
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  const formRef = useRef<{ submitForm: (callback: (data: any) => void) => void } | null>(null);

  const handleConfirmAppointment = async (data: any) => {
    if (!data) {
      alert("Please fill out the form.");
      return;
    }

    const appointmentData = {
      ...data,
      slot,
      doctorId: doctor.id,
      patientId: profile?.id, 
      paymentOption,
    };

    try {
      console.log("appointmentData", appointmentData);
      const response = await axios.post("/api/appointments", appointmentData);
      if (response.data.success) {
        setShowSuccessModal(true); 
        setTimeout(() => {
          setShowSuccessModal(false);
          onBack();
        }, 3000);
      } else {
        alert("Failed to book appointment.");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      alert("An error occurred while booking the appointment.");
    }
  };

  return (
    <>
      <DoctorInfoTwo slot={slot} doctor={doctor} onBack={onBack} />
      <div className="flex flex-col px-20">
        <div className="text-3xl pt-3">Patient Details</div>
        <div className="flex flex-row">
          <div className="w-1/2">
            <PatientForm ref={formRef} />
          </div>
          <div className="w-1/2">
            <PaymentSelection selectedOption={paymentOption} onOptionChange={setPaymentOption} />
          </div>
        </div>
        <div className="flex justify-center mt-6 mb-4">
          <button
            onClick={() => {
              if (formRef.current) {
                // @ts-ignore
                formRef.current.submitForm(handleConfirmAppointment)();
              }
            }}
            className="bg-[#f28a2e] hover:bg-[#e07a20] text-white text-lg py-6 px-8 rounded-full"
          >
            Confirm Clinic Visit
          </button>
        </div>
      </div>
            <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </>
  );
}