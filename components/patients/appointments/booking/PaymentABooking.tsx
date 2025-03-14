"use client";

import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface PaymentSelectionProps {
  selectedOption: string;
  onOptionChange: (option: string) => void;
  consultationType: string;
  firstValidDate: any;
}

export default function PaymentSelection({
  selectedOption,
  onOptionChange,
  consultationType,
  firstValidDate,
}: PaymentSelectionProps) {
  console.log("consultation Type is ", consultationType);
  const isVideoConsultation = consultationType === "video";
  const subscriptionTracker = useSelector(
    (state: RootState) => state.subscriptionsStore.subscriptionData
  );

  // Extract doctorConsultationDates from subscription
  console.log("firstValidDate yaha ", firstValidDate);

  // Calculate isPlanBookingValid
  let isPlanBookingValid = false;

  if (firstValidDate) {
    isPlanBookingValid = true;
    console.log("First valid date is:", firstValidDate);
  } else {
    console.log("No valid date found within 10 days.");
  }

  const [hasAutoSelectedPlan, setHasAutoSelectedPlan] = useState(false);

  useEffect(() => {
    if (isPlanBookingValid && !hasAutoSelectedPlan) {
      onOptionChange("plan");
      setHasAutoSelectedPlan(true);
    }
  }, [isPlanBookingValid, hasAutoSelectedPlan, onOptionChange]);

  const planCardDisabled = !isPlanBookingValid;

  // Plan card styles
  const planCardClasses = cn(
    "p-2 flex flex-col items-center justify-center transition-all w-full",
    planCardDisabled
      ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
      : "cursor-pointer border bg-white hover:border-primary",
    selectedOption === "plan" && !planCardDisabled
      ? "border-2 border-primary text-primary"
      : ""
  );

  // Online card styles
  const onlineCardClasses = cn(
    "p-2 flex flex-col items-center justify-center transition-all cursor-pointer border bg-white",
    selectedOption === "online"
      ? "border-2 border-primary text-primary"
      : "hover:border-primary"
  );

  // Clinic card styles
  const isClinicDisabled = isVideoConsultation;
  const clinicCardClasses = cn(
    "p-2 flex flex-col items-center justify-center transition-all",
    isClinicDisabled
      ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
      : "cursor-pointer border bg-white hover:border-primary",
    selectedOption === "clinic" && !isClinicDisabled
      ? "border-2 border-primary text-primary"
      : ""
  );

  console.log("isPlanBookingValid", isPlanBookingValid);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-[#2c2e38] text-lg font-medium mb-6">
        Choose a payment option to Book Appointment
      </h1>

      {/* First row: Book with Plan (full width) */}
      <div className="mb-6">
        <Card
          className={planCardClasses}
          onClick={() => {
            if (!planCardDisabled) {
              onOptionChange("plan");
            }
          }}
        >
          <p
            className={cn(
              "text-lg font-medium p-3",
              selectedOption === "plan" && !planCardDisabled
                ? "text-primary"
                : planCardDisabled
                  ? "text-gray-400"
                  : "text-[#2c2e38]"
            )}
          >
            {`Book with ${subscriptionTracker?.planName ?? "Plan"}`}
          </p>
        </Card>
      </div>

      {/* Second row: Pay Online + Pay at Clinic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Pay Online Card */}
        <Card
          className={onlineCardClasses}
          onClick={() => onOptionChange("online")}
        >
          <p
            className={cn(
              "text-lg font-medium mb-1 text-center",
              selectedOption === "online" ? "text-primary" : "text-[#2c2e38]"
            )}
          >
            ₹ 500 <br /> Pay Online
          </p>
        </Card>

        {/* Pay Later at Clinic Option */}
        <Card
          className={clinicCardClasses}
          onClick={() => {
            if (!isClinicDisabled) {
              onOptionChange("clinic");
            }
          }}
        >
          <p
            className={cn(
              "text-lg font-medium mb-1 text-center",
              isClinicDisabled
                ? "text-gray-400"
                : selectedOption === "clinic"
                  ? "text-primary"
                  : "text-[#2c2e38]"
            )}
          >
            ₹ 500 <br /> Pay later at the clinic
          </p>
        </Card>
      </div>

      <div className="text-center mb-8 text-[#2c2e38] text-lg">
        <p className="mb-4">
          By booking this appointment, you agree to Care Diabetic's{" "}
          <a href="#" className="text-[#56a67c] hover:underline">
            Terms and Conditions.
          </a>{" "}
          You can also Pre-pay for this appointment by selecting Pay Online
          option. You can read our{" "}
          <a href="#" className="text-[#56a67c] hover:underline">
            payment FAQs.
          </a>
        </p>
      </div>

      <div className="mb-3">
        <div className="max-w-3xl mx-auto grid grid-cols-2">
          <div className="flex">
            <Check className="text-secondary mt-1 mr-2 min-w-5" />
            <p className="text-[#2c2e38] text-lg">Safe and secure payments.</p>
          </div>
          <div className="flex">
            <Check className="text-secondary mt-1 mr-2 min-w-5" />
            <p className="text-[#2c2e38] text-lg">
              No more billing queues, go cashless!
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="text-secondary mt-1 mr-2 min-w-5" />
            <p className="text-[#2c2e38] text-lg">Instant appointment confirmation</p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="text-secondary mt-1 mr-2 min-w-5" />
            <p className="text-[#2c2e38] text-lg">Easy appointment management</p>
          </div>
        </div>
      </div>
    </div>
  );
}