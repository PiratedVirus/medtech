"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { loadRazorpay } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useDecryptedProfile } from "@/hooks/use-profile";
import SuccessModal from "@/components/ui/custom/cd-success-modal";
import { useQuery } from "@tanstack/react-query";
import CdLoader from "@/components/ui/custom/cd-loader";
import PlanUsage from "@/components/patients/plans/PlanUsage";

export default function PricingTable() {
  const [duration, setDuration] = useState<"6months" | "12months">("6months");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const router = useRouter();
  const { clinicId, profile, isLoading: profileLoading } = useDecryptedProfile();
  const userId = profile?.id;
  /**
   * 1) Fetch plan data from your /api/plans endpoint
   *    We expect a response of shape:
   *    {
   *      success: true,
   *      pricingData: {
   *        "6months": { basic: {...}, care: {...}, carePlus: {...} },
   *        "12months": { ... }
   *      },
   *      alreadySubscribed: boolean
   *    }
   */
  const {
    data: plansResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      if (!clinicId) return null; // or return a default shape
      const response = await axios.get(`/api/plans`, { withCredentials: true });
      return response.data; // e.g. { success, pricingData, alreadySubscribed }
    },
    enabled: !!clinicId, // Only run if clinicId is present
    staleTime: 10 * 60 * 100,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // If data is loading or if user profile is still loading
  if (isLoading || profileLoading) {
    return <CdLoader />;
  }

  // If there's an error fetching
  if (isError || !plansResponse) {
    return <div className="p-4">Error fetching plans.</div>;
  }

  // If server indicates not successful
  if (!plansResponse.success) {
    return <div className="p-4">No plan data found.</div>;
  }

  // If user already subscribed
  if (plansResponse.alreadySubscribed) {
    return (
      <>
      <div className="flex items-center justify-center bg-muted">
        <div className="rounded-md shadow-none">
        {userId && <PlanUsage userId={Number(userId)} />}
        </div>
      </div>
      
      </>
    );
  }

  // Now we safely access the pricingData
  const pricingData = plansResponse.pricingData;
  const currentPricing = pricingData[duration];

  // In case the server does not have the chosen duration
  if (!currentPricing) {
    return <div className="p-4">No plan data for {duration} found.</div>;
  }

  // Helper to format consultation/tests
  const formatConsultationLine = (
    total: number,
    frequency: number,
    interval: number,
    singularLabel: string,
    pluralLabel: string
  ) => {
    if (!total) return "-";
    const totalString = `${total} ${total > 1 ? pluralLabel : singularLabel}`;
    if (frequency > 0 && interval > 0) {
      const freqString = `${frequency} ${
        frequency > 1 ? pluralLabel : singularLabel
      } every ${interval} month${interval > 1 ? "s" : ""}`;
      return (
        <>
          <div className="font-bold text-lg">{totalString}</div>
          <div className="text-sm text-gray-500 italic">({freqString})</div>
        </>
      );
    } else {
      return <div className="font-bold text-lg">{totalString}</div>;
    }
  };

  const formatMedicines = (discount: number) => {
    return discount > 0 ? `${discount}% off` : "-";
  };

  const formatParameters = (parameters?: number) => {
    if (!parameters) return null;
    return <div className="text-sm text-[#349c4b] mt-1">{parameters} Parameters</div>;
  };

  // The "rows" in the table
  const rows = [
    { title: "Doctor Consultation", key: "doctorConsultation" },
    { title: "Lab Tests", key: "labTests", showParameters: true },
    { title: "Dietician Consultation", key: "dieticianConsultation" },
    {
      title: "Ophthalmologist Consultation",
      key: "ophthalmologistConsultation",
      extraNote: "At Clinic*",
    },
    { title: "Medicines", key: "medicines" },
  ];

  // Payment integration
  const handlePurchasePlan = async (planKey: "basic" | "care" | "carePlus") => {
    try {
      const planData = currentPricing[planKey];
      if (!planData) {
        alert("Plan not found");
        return;
      }
      const { planId, price } = planData;

      // 1) Create Razorpay order
      const createOrderRes = await axios.post("/api/payments/create", {
        amount: price * 100, // convert to paisa
        currency: "INR",
        receipt: `plan_${planId}_${Date.now()}`,
      });
      if (!createOrderRes.data.success) {
        alert("Failed to create order: " + createOrderRes.data.error);
        return;
      }
      const { orderId } = createOrderRes.data;

      // 2) Load Razorpay
      const razorpay = await loadRazorpay();
      if (!razorpay) {
        alert("Failed to load payment gateway.");
        return;
      }

      // 3) Open the payment popup
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: price * 100,
        currency: "INR",
        name: "Care Diabetic",
        description: `Plan Purchase: ${planData.name} (${duration})`,
        order_id: orderId,
        handler: async function (response: any) {
          console.log("Payment successful:", response);
          // 4) Confirm purchase
          try {
            const confirmRes = await axios.post("/api/plans/confirmPurchase", {
              planId,
              patientId: profile?.patientProfile.id,
              razorpayOrderId: orderId,
              razorpayPaymentId: response.razorpay_payment_id,
            });
            if (confirmRes.data.success) {
              setShowSuccessModal(true);
              setTimeout(() => {
                setShowSuccessModal(false);
                router.push("/dashboard/appointments");
              }, 3000);
            } else {
              alert("Error confirming purchase: " + confirmRes.data.error);
            }
          } catch (err) {
            console.error("Error confirming purchase:", err);
            alert("An error occurred while confirming the purchase.");
          }
        },
        prefill: {
          name: profile?.name || "Test User",
          email: profile?.email || "test@example.com",
          contact: profile?.phoneNumber || "9999999911",
        },
        theme: { color: "#f28a2e" },
      };

      // @ts-expect-error
      const paymentObject = new razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Top Header */}
        <div className="flex items-center justify-center h-24">
          <div className="bg-gradient-to-r from-[#134F30] to-[#56A67C] text-4xl font-semibold bg-clip-text text-transparent">
            Care Diabetics Program
          </div>
        </div>

        <p className="text-center text-2xl md:text-2xl text-[#2c2e38] mb-8">
          We offer great <span className="text-[#349c4b]">price</span> plans
          for the application
        </p>

        {/* Duration Toggle */}
        <div className="flex flex-col items-center mb-5">
          <p className="text-[#627065] mr-3 my-2">Choose plan duration</p>
          <div className="relative flex items-center">
            <div className="flex bg-white rounded-full p-1">
              <button
                onClick={() => setDuration("6months")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  duration === "6months"
                    ? "bg-gradient-to-r from-[#134F30] to-[#56A67C] font-bold text-white"
                    : "text-[#627065]"
                }`}
              >
                6 Months
              </button>
              <button
                onClick={() => setDuration("12months")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  duration === "12months"
                    ? "bg-gradient-to-r from-[#134F30] to-[#56A67C] font-bold text-white"
                    : "text-[#627065]"
                }`}
              >
                12 Months
              </button>
            </div>
          </div>
          <div className="h-5 mt-2 text-xs font-bold text-[#f28a2e] text-center">
            {duration === "6months" ? "SAVE UP TO 33% ON 12 MONTHS PLAN" : ""}
          </div>
        </div>

        {/* Pricing Table */}
        <div className="w-full overflow-x-auto mt-3">
          <table className="table-auto mx-5 border-collapse bg-white rounded-xl">
            <colgroup>
              <col className="w-12 bg-muted" />
              <col className="w-64" />
              <col className="w-80" />
              <col className="w-64" />
            </colgroup>
            <thead>
              <tr>
                <th className="p-8"></th>
                <th className="p-8 text-center">
                  <div className="text-2xl bg-gradient-to-bl from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent">
                    {currentPricing.basic?.name}
                  </div>
                </th>
                <th className="p-8 text-center bg-custom-mutedgreen">
                  <div className="text-2xl bg-gradient-to-bl from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent">
                    {currentPricing.care?.name}
                  </div>
                </th>
                <th className="p-8 text-center">
                  <div className="text-2xl bg-gradient-to-bl from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent">
                    {currentPricing.carePlus?.name}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map(({ title, key, showParameters, extraNote }) => {
                const basicData = currentPricing.basic?.[key];
                const careData = currentPricing.care?.[key];
                const carePlusData = currentPricing.carePlus?.[key];

                return (
                  <tr key={key}>
                    <td className="p-8 align-top">
                      <div className="bg-gradient-to-r from-[#134F30] to-[#56A67C] text-xl font-semibold bg-clip-text text-transparent">
                        {title}
                      </div>
                      {extraNote && (
                        <div className="text-xs text-[#349c4b] italic">
                          {extraNote}
                        </div>
                      )}
                    </td>

                    {/* BASIC COLUMN */}
                    <td className="p-8 text-center align-top">
                      {key === "medicines" ? (
                        <div className="font-bold text-lg">
                          {basicData
                            ? formatMedicines(basicData.discount)
                            : "-"}
                        </div>
                      ) : key === "labTests" && basicData ? (
                        <>
                          {formatConsultationLine(
                            basicData.totalTests,
                            basicData.frequencyPerInterval,
                            basicData.intervalInMonths,
                            "test",
                            "tests"
                          )}
                          {showParameters &&
                            formatParameters(basicData.parameters)}
                        </>
                      ) : basicData ? (
                        <>
                          {formatConsultationLine(
                            basicData.totalConsultations,
                            basicData.frequencyPerInterval,
                            basicData.intervalInMonths,
                            "consultation",
                            "consultations"
                          )}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* CARE COLUMN */}
                    <td className="p-8 text-center align-top bg-custom-mutedgreen">
                      {key === "medicines" ? (
                        <div className="font-bold text-lg">
                          {careData ? formatMedicines(careData.discount) : "-"}
                        </div>
                      ) : key === "labTests" && careData ? (
                        <>
                          {formatConsultationLine(
                            careData.totalTests,
                            careData.frequencyPerInterval,
                            careData.intervalInMonths,
                            "test",
                            "tests"
                          )}
                          {showParameters && formatParameters(careData.parameters)}
                        </>
                      ) : careData ? (
                        <>
                          {formatConsultationLine(
                            careData.totalConsultations,
                            careData.frequencyPerInterval,
                            careData.intervalInMonths,
                            "consultation",
                            "consultations"
                          )}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* CARE+ COLUMN */}
                    <td className="p-8 text-center align-top">
                      {key === "medicines" ? (
                        <div className="font-bold text-lg">
                          {carePlusData
                            ? formatMedicines(carePlusData.discount)
                            : "-"}
                        </div>
                      ) : key === "labTests" && carePlusData ? (
                        <>
                          {formatConsultationLine(
                            carePlusData.totalTests,
                            carePlusData.frequencyPerInterval,
                            carePlusData.intervalInMonths,
                            "test",
                            "tests"
                          )}
                          {showParameters &&
                            formatParameters(carePlusData.parameters)}
                        </>
                      ) : carePlusData ? (
                        <>
                          {formatConsultationLine(
                            carePlusData.totalConsultations,
                            carePlusData.frequencyPerInterval,
                            carePlusData.intervalInMonths,
                            "consultation",
                            "consultations"
                          )}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Final row: Pricing & Buttons */}
              <tr>
                <td className="p-8"></td>

                {/* BASIC Price & Button */}
                <td className="p-8 text-center align-top">
                  <div className="text-2xl font-bold mb-4">
                    {currentPricing.basic
                      ? `Rs.${currentPricing.basic.price}/-`
                      : "-"}
                  </div>
                  {currentPricing.basic && (
                    <Button
                      variant="outline"
                      className="w-full border-[#349c4b] text-[#349c4b]"
                      onClick={() => handlePurchasePlan("basic")}
                    >
                      Get Started
                    </Button>
                  )}
                </td>

                {/* CARE Price & Button */}
                <td className="p-8 text-center align-top bg-custom-mutedgreen">
                  <div className="text-2xl font-bold mb-4">
                    {currentPricing.care
                      ? `Rs.${currentPricing.care.price}/-`
                      : "-"}
                  </div>
                  {currentPricing.care && (
                    <Button
                      className="w-full bg-[#f28a2e] hover:bg-[#e07a1e] text-white"
                      onClick={() => handlePurchasePlan("care")}
                    >
                      Get Started
                    </Button>
                  )}
                </td>

                {/* CARE+ Price & Button */}
                <td className="p-8 text-center align-top">
                  <div className="text-2xl font-bold mb-4">
                    {currentPricing.carePlus
                      ? `Rs.${currentPricing.carePlus.price}/-`
                      : "-"}
                  </div>
                  {currentPricing.carePlus && (
                    <Button
                      variant="outline"
                      className="w-full border-[#349c4b] text-[#349c4b]"
                      onClick={() => handlePurchasePlan("carePlus")}
                    >
                      Get Started
                    </Button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </div>
  );
}