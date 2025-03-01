"use client";
import { useState, useRef } from "react";
import axios from "axios";
import { AppointmentForm } from "@/patients/appointments/AppointmentBookingPatientForm";
import PaymentSelection from "@/patients/appointments/AppointmentBookingPayment";
import AppointmentDoctorInfo from "@/patients/appointments/AppointmentBookingDoctorInfo";
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

export default function AppointmentBookingTimeSlot({
  slot,
  doctor,
  onBack,
}: AppointmentBookingTimeSlotProps) {
  const [paymentOption, setPaymentOption] = useState("online");
  const {  profile, isLoading: profileLoading } = useDecryptedProfile();
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  // ✅ Ref to access form submission method
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
        setShowSuccessModal(true); // ✅ Show success modal
        setTimeout(() => {
          setShowSuccessModal(false);
          onBack(); // ✅ Close the modal and go back after 3 sec
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
      <AppointmentDoctorInfo slot={slot} doctor={doctor} onBack={onBack} />
      <div className="flex flex-col px-20">
        <div className="text-3xl pt-3">Patient Details</div>
        <div className="flex flex-row">
          <div className="w-1/2">
            <AppointmentForm ref={formRef} />
          </div>
          <div className="w-1/2">
            <PaymentSelection selectedOption={paymentOption} onOptionChange={setPaymentOption} />
          </div>
        </div>
        <div className="flex justify-center mt-6 mb-4">
          <button
            onClick={() => {
              if (formRef.current) {
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