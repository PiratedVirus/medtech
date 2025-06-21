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
import { useEffect } from "react";
import { setSubscriptionData } from "@/store/subscriptionSlice";
import { useDispatch } from "react-redux";
import { EyeIcon } from "lucide-react";
import ViewParametersDialog from "@/components/common/ViewParametersDialog";

export default function LabBookingHome({ packageInfo, onBack }: any) {
  const router = useRouter();
  const [paymentOption, setPaymentOption] = useState("online");
  const { profile } = useDecryptedProfile();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState(""); // Status messages
  const [loading, setLoading] = useState(false); // Loader state
  const dispatch = useDispatch();
  const labBbookingData = packageInfo;
  console.log("labBbookingData", labBbookingData);
  const subscriptionTracker = useSelector((state: RootState) => state.subscriptionsStore.subscriptionData);
  const [firstValidDate, setFirstValidDate] = useState<string | null>(null);
  const [filteredlabTestsDatesDates, setFilteredlabTestsDatesDates] = useState<string[] | null>(null);
  const [isLabPlanBookable, setIsLabPlanBookable] = useState(false);

  const parametersArray = labBbookingData.parameters
    ? labBbookingData.parameters.split(",").map((p: string) => p.trim())
    : [];

  const fetchSubscriptionTracker = async (userId: string) => {
    try {
      const response = await axios.get(`/api/plans/planTracker?userId=${userId}`);
      dispatch(setSubscriptionData(response.data.data));
      return response.data;
    } catch (error) {
      console.error("Error fetching plan tracker:", error);
      return null;
    }
  };
  useEffect(() => {
    console.log("Profile", profile);
    if (profile?.id) {
      if (profile?.subscriptionDetails?.subscriptionId) {
        fetchSubscriptionTracker(profile.id).then((data) => {
          console.log("Plan Tracker Data", data);
        });
      }
    }
  }, [profile]);

  useEffect(() => {
    if (!subscriptionTracker){
      return;
    }  
    const currentDate = new Date();

    // a) Find the first valid date
    const foundDate = subscriptionTracker?.labTestDates?.find((dateString: string) => {
      const consultationDate = new Date(dateString);
      const diffInMs = consultationDate.getTime() - currentDate.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      return diffInDays >= -1 && diffInDays <= 10;
    }) || null;
    console.log("ladTestsDates", subscriptionTracker);
    console.log("foundDate", foundDate);
    setFirstValidDate(foundDate);

    // b) Filter out that date
    const filtered = subscriptionTracker?.labTestDates?.filter((dateString: string) => {
      return dateString !== foundDate;
    }) || null;

    setFilteredlabTestsDatesDates(filtered);

    if(subscriptionTracker?.planName === labBbookingData?.name){
      setIsLabPlanBookable(true);
      console.log("subscriptionTracker?.planName", subscriptionTracker?.planName);
      console.log("labBbookingData?.name", labBbookingData?.name);

    }

  }, [subscriptionTracker]);

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
          // @ts-ignore
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

  const handleConfirmBooking = async (data: any, razorpayResponse?: any, labPackageFees?: number) => {
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
      consultationType: paymentOption,
      subscriptionId: subscriptionTracker?.subscriptionId || null, 
      labTestsDates: filteredlabTestsDatesDates,
      labPackageFees

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
          router.replace("/dashboard/labs");
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
      <div className="flex flex-col sm:px-20 px-5 pb-5">
        <div className="text-3xl pt-4">Patient Details</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 h-full">
          {/* Left column - Patient Form */}
          <div className="bg-white flex pt-0 pl-0 p-6">
            <LabBookingForm ref={formRef} />
          </div>
          

          {/* Right column - Payment Selection and Button */}
          <div className="flex flex-col gap-1 pt-0 h-full">
            {/* Payment Selection */}
            <div className="bg-white flex-grow flex justify-center p-6">
              <PaymentSelection
                selectedOption={paymentOption}
                onOptionChange={setPaymentOption}
                firstValidDate={firstValidDate}
                consultationType={paymentOption || ""}
                consultationFee={labBbookingData?.price}
                isPlanBookable={isLabPlanBookable}
                isDietician={false}
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
                        await handleConfirmBooking(data, undefined, labBbookingData.price);
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

      <SuccessModal text="Lab package booked successfully" open={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </>
  );
}