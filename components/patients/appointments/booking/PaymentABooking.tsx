"use client";

import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { PaymentMethod } from "@/lib/constants/enums";

interface PaymentSelectionProps {
  selectedOption: string;
  onOptionChange: (option: string) => void;
  consultationType: string;
  firstValidDate: any;
  consultationFee: any
  isPlanBookable?: boolean;
  isDietician: boolean;
}

export default function PaymentSelection({
  selectedOption,
  onOptionChange,
  consultationType,
  firstValidDate,
  consultationFee,
  isPlanBookable = true,
  isDietician,
}: PaymentSelectionProps) {
  console.log("consultation Type is ", consultationType);
  console.log("Fees is ", consultationFee);
  const isVideoConsultation = consultationType === "video";
  const subscriptionTracker = useSelector(
    (state: RootState) => state.subscriptionsStore.subscriptionData
  );

  // Extract consultation dates from subscription based on type
  const consultationDates = isDietician 
    ? subscriptionTracker?.dieticianConsultationDates 
    : subscriptionTracker?.doctorConsultationDates;

  console.log("firstValidDate yaha ", firstValidDate);

  // Calculate isPlanBookingValid
  let isPlanBookingValid = false;

  if (firstValidDate) {
    const currentDate = new Date();
    const validDate = new Date(firstValidDate);
    
    // Calculate 5 days before and 10 days after
    const fiveDaysBefore = new Date(validDate);
    fiveDaysBefore.setDate(validDate.getDate() - 5);
    
    const tenDaysAfter = new Date(validDate);
    tenDaysAfter.setDate(validDate.getDate() + 10);
    
    // Check if current date is within the range
    isPlanBookingValid = currentDate >= fiveDaysBefore && currentDate <= tenDaysAfter;
    
    console.log("First valid date is:", firstValidDate);
    console.log("Date range for booking:", {
      from: fiveDaysBefore.toISOString(),
      to: tenDaysAfter.toISOString(),
      isValid: isPlanBookingValid,
      type: isDietician ? "Dietician" : "Doctor"
    });
  } else {
    console.log("No valid date found.");
  }

  const [hasAutoSelectedPlan, setHasAutoSelectedPlan] = useState(false);

  useEffect(() => {
    if (isPlanBookingValid && !hasAutoSelectedPlan) {
      onOptionChange(PaymentMethod.PLAN);
      setHasAutoSelectedPlan(true);
    }
  }, [isPlanBookingValid, hasAutoSelectedPlan, onOptionChange]);

  const planCardDisabled = !isPlanBookingValid || !isPlanBookable;

  // Plan card styles
  const planCardClasses = cn(
    "p-2 flex flex-col items-center justify-center transition-all w-full",
    planCardDisabled
      ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
      : "cursor-pointer border bg-white hover:border-primary",
    selectedOption === PaymentMethod.PLAN && !planCardDisabled
      ? "border-2 border-primary text-primary"
      : ""
  );

  // Online card styles
  const onlineCardClasses = cn(
    "p-2 flex flex-col items-center justify-center transition-all cursor-pointer border bg-white",
    selectedOption === PaymentMethod.ONLINE
      ? "border-2 border-primary text-primary"
      : "hover:border-primary"
  );

  // Clinic card styles
  const isClinicDisabled = isVideoConsultation;
  console.log("isClinicDisabled", isClinicDisabled);
  const clinicCardClasses = cn(
    "p-2 flex flex-col items-center justify-center transition-all",
    isClinicDisabled
      ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
      : "cursor-pointer border bg-white hover:border-primary",
    selectedOption === PaymentMethod.CLINIC && !isClinicDisabled
      ? "border-2 border-primary text-primary"
      : ""
  );

  console.log("isPlanBookingValid", isPlanBookingValid);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-[#2c2e38] text-lg font-medium mb-6">
        Choose a payment option to Book Appointment
      </h1>

      {/* First row: Book with Plan (full width) */}
      <div className="mb-6">
        <Card
          className={planCardClasses}
          onClick={() => {
            if (!planCardDisabled) {
              onOptionChange(PaymentMethod.PLAN);
            }
          }}
        >
          <p
            className={cn(
              "text-lg font-medium p-3",
              selectedOption === PaymentMethod.PLAN && !planCardDisabled
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
          onClick={() => onOptionChange(PaymentMethod.ONLINE)}
        >
          <p
            className={cn(
              "text-lg font-medium mb-1 text-center",
              selectedOption === PaymentMethod.ONLINE ? "text-primary" : "text-[#2c2e38]"
            )}
          >
            ₹ {consultationFee} <br /> Pay Online
          </p>
        </Card>

        {/* Pay Later at Clinic Option */}
        <Card
          className={clinicCardClasses}
          onClick={() => {
            if (!isClinicDisabled) {
              onOptionChange(PaymentMethod.CLINIC);
            }
          }}
        >
          <p
            className={cn(
              "text-lg font-medium mb-1 text-center",
              isClinicDisabled
                ? "text-gray-400"
                : selectedOption === PaymentMethod.CLINIC
                  ? "text-primary"
                  : "text-[#2c2e38]"
            )}
          >
            ₹ {consultationFee} <br /> Pay later at the clinic
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