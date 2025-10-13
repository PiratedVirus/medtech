'use client'
import { useState, useRef, use, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { ConsultationType, PaymentMethod } from "@/lib/constants/enums";
import { PatientForm } from "@/appointment-book/PatientFormABooking";
import PaymentSelection from "@/appointment-book/PaymentABooking";
import DoctorInfoTwo from "@/appointment-book/DoctorInfoTwoABooking";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import SuccessModal from "@/components/ui/custom/cd-success-modal";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { loadRazorpay } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { set } from "date-fns";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSmartMutations } from "@/hooks/use-query-mutations";

export default function HomeTwoAppointmentBooking({ slot, doctor, onBack }: any) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { useAppointmentBooking } = useSmartMutations();

  const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.ONLINE);
  const { profile } = useDecryptedProfile();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState(""); // Status messages
  const [loading, setLoading] = useState(false); // Loader state
  const bookingData = useSelector((state: RootState) => state.appointment.bookingData);
  const subscriptionTracker = useSelector((state: RootState) => state.subscriptionsStore.subscriptionData);
  const consultationMode = bookingData?.type;
  const [firstValidDate, setFirstValidDate] = useState<string | null>(null);
  const [filteredDoctorConsultationDates, setFilteredDoctorConsultationDates] = useState<string[] | null>(null);
  const isDietician = bookingData?.isDietician || false;
  const consultationDates = useMemo(() => {
    if (!subscriptionTracker) return null;
    return isDietician ? subscriptionTracker.dieticianConsultationDates : subscriptionTracker.doctorConsultationDates;
  }, [subscriptionTracker, isDietician]);
  
  useEffect(() => {
    if (!subscriptionTracker || !consultationDates) {
      setFirstValidDate(null);
      setFilteredDoctorConsultationDates(null);
      return;
    }  
  
    const currentDate = new Date();
  
    // a) Find the first valid date
    const foundDate = consultationDates.find((dateString: string) => {
      const consultationDate = new Date(dateString);
      const diffInMs = consultationDate.getTime() - currentDate.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
      return diffInDays >= -5 && diffInDays <= 10;
    }) || null;
    setFirstValidDate(foundDate);
  
    // b) Filter out that date safely
    const filtered = foundDate 
      ? consultationDates.filter((dateString: string) => dateString !== foundDate) 
      : consultationDates;
    
    setFilteredDoctorConsultationDates(filtered);
    console.log("Filtered Dates", filtered);
    console.log("First Valid Date", foundDate);
    console.log("Current Date", currentDate);
  }, [subscriptionTracker, consultationDates]);

  const formRef = useRef<{ submitForm: (callback: (data: any) => void) => void } | null>(null);


  const handlePayment = async (appointmentData: any, doctorConsultationFee: number) => {
    try {
      setLoading(true);
      setStatusMessage("Loading Razorpay...");
      const razorpay = await loadRazorpay();
      if (!razorpay) {
        alert("Failed to load payment gateway.");
        setLoading(false);
        return;
      }

      const amount = doctorConsultationFee * 100; // ₹500 in paisa
      const currency = "INR";
      const receipt = `order_${Date.now()}`;

      setStatusMessage("Creating payment order...");
      const paymentResponse = await axios.post("/api/payments/create", { amount, currency, receipt });

      const { orderId } = paymentResponse.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount,
        currency,
        name: "Care Diabetic",
        description: "Appointment Payment",
        order_id: orderId,
        handler: async function (response: any) {
          console.log("Payment Successful:", response);
          setStatusMessage("Verifying payment...");
          const razorpayResponse = {
            ...response,
            ...paymentResponse.data,
            amount,
            receipt,
          };
          await handleConfirmAppointment(appointmentData, razorpayResponse);
        },
        prefill: {
          name: profile?.name || "",
          email: profile?.email || "",
          contact: profile?.phoneNumber || "",
        },
        theme: { color: "#f28a2e" },
      };

      // @ts-expect-error
      const paymentObject = razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const appointmentMutation = useAppointmentBooking();

  const handleConfirmAppointment = async (data: any, razorpayResponse?: any, doctorConsultationFee?: number) => {
    if (!data) {
      alert("Please fill out the form.");
      return;
    }

    console.log("Razorpay Response", razorpayResponse);
    setLoading(true);
    setStatusMessage("Creating appointment...");

    const appointmentData = {
      ...data,
      slot,
      doctorId: doctor.id,
      patientId: profile?.id,
      paymentMethod,
      razorpayResponse,
      consultationMode,
      subscriptionId: subscriptionTracker?.subscriptionId || null,
      isDietician,
      doctorConsultationFee,
      doctorConsultationDates: filteredDoctorConsultationDates, // update them
    };
    console.log("Appointment Data", appointmentData);
    if (paymentMethod === PaymentMethod.ONLINE && (!razorpayResponse || !razorpayResponse.success)) {
      alert("Payment not completed. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const result = await appointmentMutation.mutateAsync(appointmentData);
      if (result.success) {
        setStatusMessage("Appointment confirmed!");
        setShowSuccessModal(true);
        // Cache invalidation now handled automatically by useAppointmentBooking
        setTimeout(() => {
          setShowSuccessModal(false);
          setStatusMessage(""); // Reset status
          router.replace("/dashboard/appointments");
        }, 3000);
      } else {
        alert("Failed to book appointment.");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      alert("An error occurred while booking the appointment.");
    } finally {
      setLoading(false);
    }
  };

  console.log("consultation mode from HomeTwoA", consultationMode);
  return (
    <>
      <DoctorInfoTwo slot={slot} doctor={doctor} onBack={onBack} />
      <div className="flex flex-col px-4 sm:px-20 pb-5">
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
              <PaymentSelection
                selectedOption={paymentMethod}
                onOptionChange={(option: string) => setPaymentMethod(option as PaymentMethod)}
                consultationType={consultationMode || ""}
                firstValidDate={firstValidDate}
                consultationFee={doctor?.doctorProfile.consultationFee}
                isDietician={isDietician}
              />
            </div>

            {/* Loader Button with Status Messages */}
            <div className="bg-white rounded-lg mb-2 flex flex-col items-center justify-center">
              {statusMessage && <p className="text-secondary p-1">{statusMessage}</p>}

              <Button
                onClick={async () => {
                  if (formRef.current) {
                    // @ts-expect-error
                    formRef.current.submitForm(async (data) => {
                      if (paymentMethod === PaymentMethod.ONLINE) {
                        await handlePayment(data, doctor?.doctorProfile.consultationFee);
                      } else {
                        await handleConfirmAppointment(data, undefined, doctor?.doctorProfile.consultationFee);
                      }
                    })();
                  }
                }}
                className="bg-[#f28a2e] hover:bg-[#e07a20] text-white text-lg py-6 px-8 rounded-full w-full md:w-auto flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5 mr-2" />
                ) : (
                  consultationMode === "clinic" ? "Confirm Clinic Visit" : "Confirm Video Consultation"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <SuccessModal text="Booking Successfull!" open={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </>
  );
}