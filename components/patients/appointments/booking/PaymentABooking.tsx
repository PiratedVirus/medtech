"use client";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function PaymentSelection({ 
  selectedOption, 
  onOptionChange, 
  consultationType 
}: { 
  selectedOption: string, 
  onOptionChange: (option: string) => void, 
  consultationType: string 
}) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-[#2c2e38] text-lg font-medium mb-6">Choose a payment option to Book Appointment</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* ✅ Pay Online Option */}
        <Card
          className={cn(
            "p-2 flex flex-col items-center justify-center cursor-pointer transition-all",
            selectedOption === "online" ? "border-[#f28a2e] border-2" : "border hover:border-[#f28a2e]"
          )}
          onClick={() => onOptionChange("online")}
        >
          <p className="text-[#f28a2e] text-lg font-medium mb-1">₹ 500</p>
          <p className="text-[#f28a2e] text-lg">Pay online</p>
        </Card>

        {/* ✅ Pay Later at Clinic Option (Disabled for Video Consultation) */}
        <Card
          className={cn(
            "p-2 flex flex-col items-center justify-center transition-all",
            consultationType === "video" 
              ? "border-gray-300 bg-gray-200 opacity-50 cursor-not-allowed" // ✅ Disabled Styling
              : selectedOption === "clinic"
              ? "border-[#f28a2e] border-2 bg-[#f5f7f9]"
              : "border bg-[#f5f7f9] hover:border-[#f28a2e]"
          )}
          onClick={() => {
            if (consultationType !== "video") {
              onOptionChange("clinic");
            }
          }}
        >
          <p className="text-gray-300 text-lg font-medium mb-1">₹ 500</p>
          <p className="text-gray-300 text-lg">Pay later at the clinic</p>
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

      <div className="mb-3">
        <div className="max-w-3xl mx-auto grid grid-cols-2">
          <div className="flex">
            <Check className="text-secondary mt-1 mr-2 min-w-5" />
            <p className="text-[#2c2e38] text-lg">Safe and secure payments.</p>
          </div>
          <div className="flex">
            <Check className="text-secondary mt-1 mr-2 min-w-5" />
            <p className="text-[#2c2e38] text-lg">No more billing queues, go cashless!</p>
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