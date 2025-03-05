'use client'
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { LabBookingForm } from "@/patients/labs/booking/LabBookingForm";
import PaymentSelection from "@/appointment-book/PaymentABooking";
import PackageInfo from "@/patients/labs/booking/PackageInfo";
import { useDecryptedProfile } from "@/hooks/use-profile";
import SuccessModal from "@/components/ui/custom/cd-success-modal";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { loadRazorpay } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function LabBookingHome({ packageInfo, onBack }: any) {
  const router = useRouter();
  const [paymentOption, setPaymentOption] = useState("online");
  const { profile } = useDecryptedProfile();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState(""); // Status messages
  const [loading, setLoading] = useState(false); // Loader state
  const labBbookingData = packageInfo;
  console.log("labBbookingData", labBbookingData);

  const formRef = useRef<{ submitForm: (callback: (data: any) => void) => void } | null>(null);

  const handlePayment = async (bookingData: any) => {
    try {
      setLoading(true);
      setStatusMessage("Loading Razorpay...");
      const razorpay = await loadRazorpay();
      if (!razorpay) {
        alert("Failed to load payment gateway.");
        setLoading(false);
        return;
      }

      const amount = packageInfo.price * 100; // Price in paisa
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
        description: "Lab Booking Payment",
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
          await handleConfirmBooking(bookingData, razorpayResponse);
        },
        prefill: {
          name: profile?.name || "",
          email: profile?.email || "",
          // @ts-expect-error
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

  const handleConfirmBooking = async (data: any, razorpayResponse?: any) => {
    if (!data) {
      alert("Please fill out the form.");
      return;
    }

    console.log("Razorpay Response", razorpayResponse);
    setLoading(true);
    setStatusMessage("Creating booking...");

    const bookingData = {
      ...data,
      packageId: labBbookingData.id,
      patientId: profile?.id,
      paymentOption,
      razorpayResponse,
    };

    if (paymentOption === "online" && (!razorpayResponse || !razorpayResponse.success)) {
      alert("Payment not completed. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/labs", bookingData);
      if (response.data.success) {
        setStatusMessage("Booking confirmed!");
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          setStatusMessage(""); // Reset status
          router.push("/dashboard/labs");
        }, 3000);

      } else {
        alert("Failed to book lab package.");
      }
    } catch (error) {
      console.error("Error booking lab package:", error);
      alert("An error occurred while booking the lab package.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PackageInfo labPackage={labBbookingData} onBack={onBack} />
      <div className="flex flex-col px-20 pb-5">
        <div className="text-3xl pt-4">Patient Details</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 h-full">
          {/* Left column - Patient Form */}
          <div className="bg-white flex pt-0 pl-0 p-6">
            <LabBookingForm ref={formRef} />
          </div>

          {/* Right column - Payment Selection and Button */}
          <div className="flex flex-col gap-1 pt-0 h-full">
            {/* Payment Selection */}
            <div className="bg-white flex-grow flex items-center justify-center p-6">
              <PaymentSelection
                selectedOption={paymentOption}
                onOptionChange={setPaymentOption}
                consultationType=""
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
                      if (paymentOption === "online") {
                        await handlePayment(data);
                      } else {
                        await handleConfirmBooking(data);
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
                  "Confirm Lab Booking"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </>
  );
}