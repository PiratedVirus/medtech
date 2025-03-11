"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PricingTable() {
  const [duration, setDuration] = useState<"6months" | "12months">("6months");

  // Pricing data for both durations
  const pricingData = {
    "6months": {
      basic: {
        name: "Basic",
        price: "Rs.2599/-",
        doctorConsultation: {
          count: "2 consultations",
          details: "(1 consultation every 3 months)",
        },
        labTests: {
          count: "2 Tests",
          details: "(1 test every 3 months)",
          parameters: "3 Parameters",
        },
        dieticianConsultation: {
          count: "-",
          details: "",
        },
        ophthalmologistConsultation: {
          count: "-",
          details: "",
        },
        medicines: "15% off",
      },
      care: {
        name: "CARE",
        price: "Rs.5999/-",
        doctorConsultation: {
          count: "2 consultations",
          details: "(1 consultation every 3 months)",
        },
        labTests: {
          count: "2 Tests",
          details: "(1 complete blood and urine test + 1FBS, HbA1c, 2 hr PP)",
          parameters: "60 parameters",
        },
        dieticianConsultation: {
          count: "2 consultations",
          details: "(1 consultation every 3 months)",
        },
        ophthalmologistConsultation: {
          count: "1 consultation",
          details: "(1 consultation in 6 months)",
        },
        medicines: "25% off",
      },
      carePlus: {
        name: "CARE+",
        price: "Rs.9999/-",
        doctorConsultation: {
          count: "4 consultations",
          details: "(2 consultations every 3 months)",
        },
        labTests: {
          count: "2 Tests",
          details: "(1 complete blood and urine test every 3 months)",
          parameters: "80 parameters",
        },
        dieticianConsultation: {
          count: "4 consultations",
          details: "(2 consultations every 3 months)",
        },
        ophthalmologistConsultation: {
          count: "1 consultation",
          details: "(1 consultation in 6 months)",
        },
        medicines: "35% off",
      },
    },
    "12months": {
      basic: {
        name: "Basic",
        price: "Rs.4999/-",
        doctorConsultation: {
          count: "4 consultations",
          details: "(1 consultation every 3 months)",
        },
        labTests: {
          count: "4 Tests",
          details: "(1 test every 3 months)",
          parameters: "3 Parameters",
        },
        dieticianConsultation: {
          count: "-",
          details: "",
        },
        ophthalmologistConsultation: {
          count: "-",
          details: "",
        },
        medicines: "15% off",
      },
      care: {
        name: "CARE",
        price: "Rs.10999/-",
        doctorConsultation: {
          count: "4 consultations",
          details: "(1 consultation every 3 months)",
        },
        labTests: {
          count: "4 Tests",
          details: "(1 complete blood and urine test + 1FBS, HbA1c, 2 hr PP)",
          parameters: "60 parameters",
        },
        dieticianConsultation: {
          count: "4 consultations",
          details: "(1 consultation every 3 months)",
        },
        ophthalmologistConsultation: {
          count: "2 consultations",
          details: "(1 consultation in 6 months)",
        },
        medicines: "25% off",
      },
      carePlus: {
        name: "CARE+",
        price: "Rs.18999/-",
        doctorConsultation: {
          count: "8 consultations",
          details: "(2 consultations every 3 months)",
        },
        labTests: {
          count: "4 Tests",
          details: "(1 complete blood and urine test every 3 months)",
          parameters: "80 parameters",
        },
        dieticianConsultation: {
          count: "8 consultations",
          details: "(2 consultations every 3 months)",
        },
        ophthalmologistConsultation: {
          count: "2 consultations",
          details: "(1 consultation in 6 months)",
        },
        medicines: "35% off",
      },
    },
  };

  const currentPricing = pricingData[duration];

  // We'll define a small array describing which rows to show:
  const rows = [
    {
      title: "Doctor Consultation",
      key: "doctorConsultation",
    },
    {
      title: "Lab Tests",
      key: "labTests",
      showParameters: true, // we show parameters in a second line
    },
    {
      title: "Dietician Consultation",
      key: "dieticianConsultation",
    },
    {
      title: "Ophthalmologist Consultation",
      key: "ophthalmologistConsultation",
      extraNote: "At Clinic*",
    },
    {
      title: "Medicines",
      key: "medicines",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-center h-24">
          <div className="bg-gradient-to-r from-[#134F30] to-[#56A67C] text-4xl font-semibold bg-clip-text text-transparent">
            Care Diabetics Program
          </div>
        </div>

        <p className="text-center text-xl md:text-2xl text-[#2c2e38] mb-8">
          We offer great <span className="text-[#349c4b]">price</span> plans for
          the application
        </p>

        {/* Duration Toggle */}
        <div className="flex flex-row justify-center items-center mb-10">
          <p className="text-[#627065] mr-3">Choose plan duration</p>
          <div className="relative flex items-center">
            <div className="flex bg-white rounded-full p-1 border">
              <button
                onClick={() => setDuration("6months")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  duration === "6months"
                    ? "bg-[#349c4b] text-white"
                    : "bg-transparent text-[#627065]"
                }`}
              >
                6 Months
              </button>
              <button
                onClick={() => setDuration("12months")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  duration === "12months"
                    ? "bg-[#349c4b] text-white"
                    : "bg-transparent text-[#627065]"
                }`}
              >
                12 Months
              </button>
            </div>
            {duration === "12months" && (
              <div className="absolute -right-24 text-xs font-bold text-[#f28a2e]">
                SAVE UP TO 33%
              </div>
            )}
          </div>
        </div>

        {/* Pricing Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-4 bg-white"></th>
                <th className="p-4 bg-white text-center text-xl">
                  {currentPricing.basic.name}
                </th>
                <th className="p-4 bg-custom-mutedgreen text-center text-xl">
                  {currentPricing.care.name}
                </th>
                <th className="p-4 bg-white text-center text-xl">
                  {currentPricing.carePlus.name}
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Rows for each service */}
              {rows.map(({ title, key, showParameters, extraNote }) => {
                const basicData = currentPricing.basic[key];
                const careData = currentPricing.care[key];
                const carePlusData = currentPricing.carePlus[key];

                // Because some keys (labTests) have extra fields (parameters) or additional lines
                // we’ll conditionally render them below:

                return (
                  <tr key={key} className="border-b">
                    {/* Service Title column */}
                    <td className="p-4 align-top">
                      <div className="text-[#134F30] font-semibold">
                        {title}
                      </div>
                      {extraNote && (
                        <div className="text-xs text-[#349c4b]">{extraNote}</div>
                      )}
                    </td>

                    {/* BASIC Column */}
                    <td className="p-4 text-center align-top">
                      <div className="font-bold">
                        {basicData.count || basicData}
                      </div>
                      {basicData.details && (
                        <div className="text-xs text-gray-500">
                          {basicData.details}
                        </div>
                      )}
                      {/* Optional parameters line */}
                      {showParameters && basicData.parameters && (
                        <div className="text-sm text-[#349c4b] mt-1">
                          {basicData.parameters}
                        </div>
                      )}
                    </td>

                    {/* CARE Column */}
                    <td className="p-4 text-center align-top bg-custom-mutedgreen">
                      <div className="font-bold">
                        {careData.count || careData}
                      </div>
                      {careData.details && (
                        <div className="text-xs text-gray-500">
                          {careData.details}
                        </div>
                      )}
                      {/* Some items have "additionalInfo"—we can show it if present */}
{/* CARE Column */}
{typeof careData === "object" && "additionalInfo" in careData && careData.additionalInfo && (
  <div className="text-xs text-gray-500">
    {careData.additionalInfo}
  </div>
)}
                      {showParameters && careData.parameters && (
                        <div className="text-sm text-[#349c4b] mt-1">
                          {careData.parameters}
                        </div>
                      )}
                    </td>

                    {/* CARE+ Column */}
                    <td className="p-4 text-center align-top">
                      <div className="font-bold">
                        {carePlusData.count || carePlusData}
                      </div>
                      {carePlusData.details && (
                        <div className="text-xs text-gray-500">
                          {carePlusData.details}
                        </div>
                      )}
                      {showParameters && carePlusData.parameters && (
                        <div className="text-sm text-[#349c4b] mt-1">
                          {carePlusData.parameters}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Final row: Plan Pricing + “Get Started” buttons */}
              <tr>
                <td className="p-4"></td>
                {/* BASIC price & button */}
                <td className="p-6 text-center">
                  <div className="text-2xl font-bold mb-4">
                    {currentPricing.basic.price}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-[#349c4b] text-[#349c4b]"
                  >
                    Get Started
                  </Button>
                </td>

                {/* CARE price & button */}
                <td className="p-6 text-center bg-custom-mutedgreen">
                  <div className="text-2xl font-bold mb-4">
                    {currentPricing.care.price}
                  </div>
                  <Button className="w-full bg-[#f28a2e] hover:bg-[#e07a1e] text-white">
                    Get Started
                  </Button>
                </td>

                {/* CARE+ price & button */}
                <td className="p-6 text-center">
                  <div className="text-2xl font-bold mb-4">
                    {currentPricing.carePlus.price}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-[#349c4b] text-[#349c4b]"
                  >
                    Get Started
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}