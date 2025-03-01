"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function PaymentSelection({ selectedOption, onOptionChange }: { selectedOption: string, onOptionChange: (option: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto p-6 font-sans">
      <h1 className="text-[#2c2e38] text-lg font-medium mb-6">Choose a payment option to Book Appointment</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card
          className={cn(
            "p-4 flex flex-col items-center justify-center cursor-pointer transition-all",
            selectedOption === "online" ? "border-[#f28a2e] border-2" : "border hover:border-[#f28a2e]",
          )}
          onClick={() => onOptionChange("online")}
        >
          <p className="text-[#f28a2e] text-lg font-medium mb-2">₹ 500</p>
          <p className="text-[#f28a2e] text-lg">Pay online</p>
        </Card>

        <Card
          className={cn(
            "p-4 flex flex-col items-center justify-center cursor-pointer transition-all",
            selectedOption === "clinic"
              ? "border-[#f28a2e] border-2 bg-[#f5f7f9]"
              : "border bg-[#f5f7f9] hover:border-[#f28a2e]",
          )}
          onClick={() => onOptionChange("clinic")}
        >
          <p className="text-[#2c2e38] text-lg font-medium mb-2">₹ 500</p>
          <p className="text-[#2c2e38] text-lg">Pay later at the clinic</p>
        </Card>
      </div>

      <div className="text-center mb-8 text-[#2c2e38] text-lg">
        <p className="mb-4">
          By booking this appointment, you agree to Care Diabetic's{" "}
          <a href="#" className="text-[#56a67c] hover:underline">
            Terms and Conditions.
          </a>{" "}
          You can also Pre-pay for this appointment by selecting Pay Online option. You can read our{" "}
          <a href="#" className="text-[#56a67c] hover:underline">
            payment FAQs.
          </a>
        </p>
      </div>

      <div className="mb-10">
        <h2 className="text-[#2c2e38] text-lg font-medium text-center mb-6">Safe and secure payments.</h2>

        <div className="space-y-4 max-w-md mx-auto">
          <div className="flex items-start gap-2">
            <Check className="text-[#2c2e38] mt-1 min-w-5" />
            <p className="text-[#2c2e38] text-lg">No more billing queues, go cashless!</p>
          </div>

          <div className="flex items-start gap-2">
            <Check className="text-[#2c2e38] mt-1 min-w-5" />
            <p className="text-[#2c2e38] text-lg">Instant appointment confirmation</p>
          </div>

          <div className="flex items-start gap-2">
            <Check className="text-[#2c2e38] mt-1 min-w-5" />
            <p className="text-[#2c2e38] text-lg">Easy appointment management</p>
          </div>
        </div>
      </div>
    </div>
  );
}