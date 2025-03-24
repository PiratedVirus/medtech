import React from "react";
import { Button } from "@/components/ui/button"


export default function CenteredTextBanner() {
  return (
    <section
      className="relative w-full h-[800px] bg-cover bg-center flex flex-col justify-end items-center p-8"
      style={{ backgroundImage: "url('/images/best-doc.png')" }}
    >
      {/* Optional overlay for darker text contrast */}
      <div className="absolute inset-0  pointer-events-none" />

      {/* Content container (use relative so overlay doesn't cover text) */}
      <div className="relative text-center text-white w-full">
     <div className=" mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium mb-6">
            Best Doctors, Across all specialties
          </h2>
          <p className="text-base md:text-lg mb-10 leading-relaxed">
            From routine check-ups and preventive screenings to the management of
            chronic conditions and specialized treatments, our clinic offers a
            wide range of services designed to address your unique healthcare needs.
          </p>
          <Button className="bg-[#f28a2e] hover:bg-[#e07a20] text-white rounded-full px-8 py-2 text-lg font-medium border-0">
            Join Us
          </Button>
        </div>
      </div>
    </section>
  );
}