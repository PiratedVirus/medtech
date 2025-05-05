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
import { Eye, ArrowUpDown, EditIcon, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQueryClient } from "@tanstack/react-query";
import ViewParametersDialog from "@/components/common/ViewParametersDialog";

export default function PricingTable() {
  // Basic state for duration and subscription success modal
  const [duration, setDuration] = useState<"6months" | "12months">("6months");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [tab, setTab] = useState<"plans" | "usage">("plans");
  // State for the view parameters dialog
  const [viewParameters, setViewParameters] = useState<Record<string, string[]>>({});
  const [paramsDialogOpen, setParamsDialogOpen] = useState(false);
  // State for processing/loading overlay
  const [isProcessing, setIsProcessing] = useState(false);

  // Router and profile hooks
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clinicId, profile, isLoading: profileLoading } = useDecryptedProfile();
  const userId = profile?.id;

  // Determine subscription status
  const subscriptionId = profile?.subscriptionDetails?.subscriptionId;
  const isValidSubscription = !!subscriptionId;

  // Fetch plans (only if clinicId exists and user is not already subscribed)
  const { data: plansResponse, isLoading, isError } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      if (!clinicId) return null;
      const response = await axios.get(`/api/plans`, { withCredentials: true });
      return response.data;
    },
    enabled: !!clinicId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Loading and error handling
  if (profileLoading || isLoading) {
    return <CdLoader />;
  }
  if (isError) {
    return <div className="p-4">Error fetching plans.</div>;
  }
  if (!plansResponse) {
    return <div className="p-4">Error fetching plans because no response from plans</div>;
  }
  if (!plansResponse.success) {
    return <div className="p-4">No plan data found.</div>;
  }

  const pricingData = plansResponse.pricingData;
  const currentPricing = pricingData[duration];
  if (!currentPricing) {
    return <div className="p-4">No plan data for {duration} found.</div>;
  }

  // Handler for payment
  const handlePurchasePlan = async (planKey: "basic" | "care" | "carePlus") => {
    try {
      const planData = currentPricing[planKey];
      if (!planData) {
        alert("Plan not found");
        return;
      }
      const { planId, price } = planData;
      const createOrderRes = await axios.post("/api/payments/create", {
        amount: price * 100,
        currency: "INR",
        receipt: `plan_${planId}_${Date.now()}`,
      });
      if (!createOrderRes.data.success) {
        alert("Failed to create order: " + createOrderRes.data.error);
        return;
      }
      const { orderId } = createOrderRes.data;
      const razorpay = await loadRazorpay();
      if (!razorpay) {
        alert("Failed to load payment gateway.");
        return;
      }
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: price * 100,
        currency: "INR",
        name: "Care Diabetic",
        description: `Plan Purchase: ${planData.name} (${duration})`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            setIsProcessing(true);
            const confirmRes = await axios.post("/api/plans/confirmPurchase", {
              planId,
              patientId: profile?.patientProfile?.id,
              razorpayResponse: response,
              razorpayOrderId: orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              subscriptionPrice: price * 100,
            });
            if (confirmRes.data.success) {
              queryClient.invalidateQueries({ queryKey: ["plans"] });
              setShowSuccessModal(true);
              setTimeout(() => {
                setShowSuccessModal(false);
                router.replace("/dashboard/appointments");
              }, 3000);
            } else {
              alert("Error confirming purchase: " + confirmRes.data.error);
            }
          } catch (err) {
            console.error("Error confirming purchase:", err);
            alert("An error occurred while confirming the purchase.");
          } finally {
            setIsProcessing(false);
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

  // ---------- VIEW PARAMETERS DIALOG FUNCTIONS ----------
  // Splits the parameters string and opens the dialog
  const handleViewParameters = (parameters: string) => {
    try {
      const parsed = JSON.parse(parameters);
      if (typeof parsed === "object" && parsed !== null) {
        setViewParameters(parsed); // parsed is already in desired structure
      } else {
        console.error("Parsed parameters is not an object", parsed);
        setViewParameters({});
      }
    } catch (e) {
      console.error("Failed to parse parameters JSON", e);
      setViewParameters({});
    }
    setParamsDialogOpen(true);
  };

  // ---------- HELPER FUNCTIONS FOR RENDERING CELLS ----------
  // Helper to render consultation lines with dynamic total calculation based on duration
  const formatConsultationLine = (
    total: number,
    frequency: number,
    interval: number,
    singularLabel: string,
    pluralLabel: string
  ) => {
    const durationInMonths = duration === "6months" ? 6 : 12;
    const calculatedTotal = Math.floor((durationInMonths / interval) * frequency);
    const totalString = `${calculatedTotal} ${calculatedTotal > 1 ? pluralLabel : singularLabel}`;
    const freqString = `${frequency} ${frequency > 1 ? pluralLabel : singularLabel} every ${interval} month${interval > 1 ? "s" : ""}`;
  
    return (
      <>
        <div className="font-bold text-lg">{totalString}</div>
        <div className="text-sm text-gray-500 italic">({freqString})</div>
      </>
    );
  };

  const formatMedicines = (discount: number) => {
    return discount > 0 ? `${discount}% off` : "-";
  };

  // formatParameters displays the count and an Eye icon which opens a dialog when clicked.
  const formatParameters = (parameters?: string) => {
    if (!parameters) return null;
    const paramsArray = parameters
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return (
      <div className="inline-flex items-center text-sm text-[#349c4b] mt-1">
        {paramsArray.length} Parameters
        <Eye
          className="ml-1 h-4 w-4 cursor-pointer hover:text-green-500"
          onClick={() => handleViewParameters(parameters)}
        />
      </div>
    );
  };

  // Render cell helper for various feature keys
  function renderFeatureCell(featureData: any, key: string, showParameters?: boolean) {
    console.log("featureData", featureData);
    if (!featureData) return "-";
    if (key === "medicines") {
      return <div className="font-bold text-lg">{formatMedicines(featureData.discount)}</div>;
    } else if (key === "labTests") {
      return (
        <>
          {formatConsultationLine(
            featureData.totalTests,
            featureData.frequencyPerInterval,
            featureData.intervalInMonths,
            "test",
            "tests"
          )}
          {showParameters && formatParameters(featureData.parameters)}
        </>
      );
    } else {
      // e.g. doctorConsultation, dieticianConsultation, ophthalmologistConsultation
      return (
        <>
          {formatConsultationLine(
            featureData.totalConsultations,
            featureData.frequencyPerInterval,
            featureData.intervalInMonths,
            "consultation",
            "consultations"
          )}
        </>
      );
    }
  }

  // ---------- JSX RENDERING ----------
  return (
    <div className="min-h-screen flex justify-center bg-muted">
      {/* Toggle between Plans and Usage */}

      <Tabs defaultValue={isValidSubscription ? "usage" : "plans"} className="w-full">
        <TabsList className="grid max-w-xs grid-cols-2 mx-auto mt-2">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>
        <TabsContent value="usage">
          {isValidSubscription ? (
            <PlanUsage subscriptionId={subscriptionId} userId={Number(userId)} />
          ) : (
            <div className="text-center text-xl font-semibold text-gray-600 mt-10">
              Please subscribe to a plan to view usage.
            </div>
          )}
        </TabsContent>
        <TabsContent value="plans">

          <>
            <main className="max-w-7xl mx-auto px-3 py-2">
              {/* Top Header */}
              <div className="flex items-center justify-center h-24">
                <div className="bg-gradient-to-r from-[#134F30] to-[#56A67C] text-4xl font-semibold bg-clip-text text-transparent">
                  Care Diabetics Program
                </div>
              </div>

              <p className="text-center text-2xl md:text-2xl text-[#2c2e38] mb-8">
                We offer great <span className="text-[#349c4b]">price</span> plans for the application
              </p>

              {/* Duration Toggle */}
              <div className="flex flex-col items-center mb-5">
                <p className="text-[#627065] mr-3 my-2">Choose plan duration</p>
                <div className="relative flex items-center">
                  <div className="flex bg-white rounded-full p-1">
                    <button
                      onClick={() => setDuration("6months")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${duration === "6months"
                        ? "bg-gradient-to-r from-[#134F30] to-[#56A67C] font-bold text-white"
                        : "text-[#627065]"
                        }`}
                    >
                      6 Months
                    </button>
                    <button
                      onClick={() => setDuration("12months")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${duration === "12months"
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
                    {(() => {
                      const featureKeys = new Set<string>();

                      ["basic", "care", "carePlus"].forEach((planKey) => {
                        const plan = currentPricing[planKey];
                        if (plan) {
                          Object.keys(plan).forEach((key) => {
                            if (!["planId", "name", "price"].includes(key)) {
                              featureKeys.add(key);
                            }
                          });
                        }
                      });

                      const sortedKeys = Array.from(featureKeys).sort((a, b) => {
                        if (a === "medicines") return 1;
                        if (b === "medicines") return -1;
                        return 0;
                      });
                      return sortedKeys.map((key) => {
                        const title = key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())
                          .replace("Consultation", " Consultation")
                          .trim();
                        const showParameters = key === "labTests";
                        const extraNote = key === "ophthalmologistConsultation" ? "At Clinic*" : undefined;

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
                                <div className="text-xs text-[#349c4b] italic">{extraNote}</div>
                              )}
                            </td>
                            <td className="p-8 text-center align-top">
                              {renderFeatureCell(basicData, key, showParameters)}
                            </td>
                            <td className="p-8 text-center align-top bg-custom-mutedgreen">
                              {renderFeatureCell(careData, key, showParameters)}
                            </td>
                            <td className="p-8 text-center align-top">
                              {renderFeatureCell(carePlusData, key, showParameters)}
                            </td>
                          </tr>
                        );
                      });
                    })()}

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
                            disabled={isValidSubscription}
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
                            disabled={isValidSubscription}
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
                            disabled={isValidSubscription}
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

            {/* Success Modal */}
            <SuccessModal open={isProcessing} text="Processing your plan..." isLoading onClose={() => {}} />
            <SuccessModal text="Plan booked successfully!" open={showSuccessModal} onClose={() => setShowSuccessModal(false)} />

            {/* Dialog for Viewing Parameters */}
            <ViewParametersDialog
              open={paramsDialogOpen}
              onOpenChange={setParamsDialogOpen}
              parameters={viewParameters}
            />
          </>
        </TabsContent>
      </Tabs>
    </div>
  );
}