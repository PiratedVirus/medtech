"use client";
import { useState, useRef } from "react";
import axios from "axios";
import { PatientForm } from "@/appointment-book/PatientFormABooking";
import PaymentSelection from "@/appointment-book/PaymentABooking";
import DoctorInfoTwo from "@/appointment-book/DoctorInfoTwoABooking";
import { useDecryptedProfile } from "@/hooks/use-profile";
import SuccessModal from "@/components/ui/custom/cd-success-modal";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { loadRazorpay } from "@/lib/utils";



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
  const { profile } = useDecryptedProfile();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const bookingData = useSelector((state: RootState) => state.appointment.bookingData);
  const consultationType = bookingData?.type;

  const formRef = useRef<{ submitForm: (callback: (data: any) => void) => void } | null>(null);

  const handlePayment = async (appointmentData: any) => {
    try {
      const razorpay = await loadRazorpay();
      if (!razorpay) {
        alert("Failed to load payment gateway.");
        return;
      }
      const paymentResponse = await axios.post("/api/payments/create", {
        amount: 1 * 100, // ₹500 in paisa
        currency: "INR",
        receipt: `order_${Date.now()}`,
      });

      const { orderId } = paymentResponse.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: 1 * 100, // ₹500
        currency: "INR",
        name: "Care Diabetic",
        description: "Appointment Payment",
        order_id: orderId,
        handler: async function (response: any) {
          console.log("Payment Successful:", response);

          await handleConfirmAppointment(appointmentData, response.razorpay_payment_id);
        },
        prefill: {
          name: profile?.name || "",
          email: profile?.email || "",
          // @ts-ignore
          contact: profile?.phoneNumber || "",
        },
        theme: {
          color: "#f28a2e",
        },
      };

      // @ts-ignore
      const paymentObject = razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment failed. Please try again.");
    }
  };

  const handleConfirmAppointment = async (data: any, paymentId?: string) => {
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
      paymentId, // ✅ Store Payment ID if paid online
      consultationTypeId: consultationType === "clinic" ? 1 : 2,
    };

    if (paymentOption === "online" && !paymentId) {
      // ✅ If payment failed, do not proceed with appointment booking
      alert("Payment not completed. Please try again.");
      return;
    }

    try {
      console.log("appointmentData", appointmentData);
      const response = await axios.post("/api/appointments", appointmentData);
      if (response.data.success) {
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          // onBack();
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
      <div className="flex flex-col px-20 pb-5">
        <div className="text-3xl pt-4">Patient Details</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 h-full">          
          {/* Left column - Patient Form */}
          <div className="bg-white flex pt-0 pl-0 p-6">
            <PatientForm ref={formRef} />
          </div>

         {/* Right column - Payment Selection and Button */}
          <div className="flex flex-col gap-1 pt-0 h-full">
            {/* Payment Selection */}
            <div className="bg-white flex-grow flex items-center justify-center p-6">
              <PaymentSelection selectedOption={paymentOption} onOptionChange={setPaymentOption} consultationType={consultationType || ''} />
            </div>

            {/* Button */}
            <div className="bg-white rounded-lg mb-2 flex items-center justify-center">
              <button
                onClick={() => {
                  if (formRef.current) {
                    // @ts-ignore
                    formRef.current.submitForm((data) => {
                      if (paymentOption === "online") {
                        handlePayment(data); // ✅ Trigger Razorpay first
                      } else {
                        handleConfirmAppointment(data);
                      }
                    })();
                  }
                }}
                className="bg-[#f28a2e] hover:bg-[#e07a20] text-white text-lg py-6 px-8 rounded-full w-full md:w-auto"
              >
                {(consultationType === "clinic") ? ('Confirm Clinic Visit') : ('Confirm Video Consultation')}
              </button>
            </div>
          </div>
        </div>
      </div>
      <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </>
  );
}