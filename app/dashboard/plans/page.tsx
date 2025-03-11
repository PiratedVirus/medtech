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
        dieticianConsultation: { count: "-", details: "" },
        ophthalmologistConsultation: { count: "-", details: "" },
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
        dieticianConsultation: { count: "-", details: "" },
        ophthalmologistConsultation: { count: "-", details: "" },
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

  // Rows referencing keys in the data
  const rows = [
    { title: "Doctor Consultation", key: "doctorConsultation" },
    {
      title: "Lab Tests",
      key: "labTests",
      showParameters: true, // show optional "parameters" line
    },
    { title: "Dietician Consultation", key: "dieticianConsultation" },
    {
      title: "Ophthalmologist Consultation",
      key: "ophthalmologistConsultation",
      extraNote: "At Clinic*",
    },
    { title: "Medicines", key: "medicines" },
  ];

  // Type-guard to safely handle additionalInfo checks
  const hasAdditionalInfo = (
    obj: unknown
  ): obj is { additionalInfo?: string } => {
    return typeof obj === "object" && obj !== null && "additionalInfo" in obj;
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

        <p className="text-center text-xl md:text-2xl text-[#2c2e38] mb-8">
          We offer great <span className="text-[#349c4b]">price</span> plans
          for the application
        </p>

        {/* Duration Toggle */}
        <div className="flex flex-row justify-center items-center mb-10">
          <p className="text-[#627065] mr-3">Choose plan duration</p>
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
            {duration === "6months" && (
              <div className="absolute -right-24 text-xs font-bold text-[#f28a2e]">
                SAVE UP TO 33%
              </div>
            )}
          </div>
        </div>

        {/* Pricing Table */}
        {/* 
          1) Center table with mx-auto 
          2) Use <colgroup> to set the first column width 
        */}
        <div className="w-full overflow-x-auto">
          <table className="table-auto mx-5 border-collapse bg-white rounded-xl">
            <colgroup>
              <col className="w-12 bg-muted" /> {/* First column width */}
              <col className="w-64"/>
              <col className="w-80"/>
              <col className="w-64"/>
            </colgroup>
            <thead>
              <tr>
                {/* Empty top-left cell */}
                <th className="p-8"></th>

                {/* Basic header with gradient text */}
                <th className="p-8 text-center">
                  <div className="text-2xl bg-gradient-to-bl from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent">
                    {currentPricing.basic.name}
                  </div>
                </th>

                {/* Care header with gradient text */}
                <th className="p-8 text-center bg-custom-mutedgreen">
                  <div className="text-2xl bg-gradient-to-bl from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent">
                    {currentPricing.care.name}
                  </div>
                </th>

                {/* Care+ header with gradient text */}
                <th className="p-8 text-center">
                  <div className="text-2xl bg-gradient-to-bl from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent">
                    {currentPricing.carePlus.name}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map(({ title, key, showParameters, extraNote }) => {
                const basicData = currentPricing.basic[key];
                const careData = currentPricing.care[key];
                const carePlusData = currentPricing.carePlus[key];

                return (
                  <tr key={key}>
                    {/* First column (service name) with gradient text */}
                    <td className="p-8 align-top">
                      <div className="bg-gradient-to-r from-[#134F30] to-[#56A67C] text-xl font-semibold bg-clip-text text-transparent">
                        {title}
                      </div>
                      {extraNote && (
                        <div className="text-xs text-[#349c4b] italic">{extraNote}</div>
                      )}
                    </td>

                    {/* Basic Column */}
                    <td className="p-8 text-center align-top">
                      <div className="font-bold text-lg">
                        {typeof basicData === "object"
                          ? basicData.count
                          : basicData}
                      </div>
                      {typeof basicData === "object" && basicData.details && (
                        <div className="text-sm text-gray-500 italic">
                          {basicData.details}
                        </div>
                      )}
                      {showParameters &&
                        typeof basicData === "object" &&
                        basicData.parameters && (
                          <div className="text-sm text-[#349c4b] mt-1">
                            {basicData.parameters}
                          </div>
                        )}
                    </td>

                    {/* Care Column */}
                    <td className="p-8 text-center align-top bg-custom-mutedgreen">
                      <div className="font-bold text-lg">
                        {typeof careData === "object" ? careData.count : careData}
                      </div>
                      {typeof careData === "object" && careData.details && (
                        <div className="text-sm text-gray-500 italic">
                          {careData.details}
                        </div>
                      )}
                      {typeof careData === "object" &&
                        hasAdditionalInfo(careData) &&
                        careData.additionalInfo && (
                          <div className="text-sm text-gray-500 italic">
                            {careData.additionalInfo}
                          </div>
                        )}
                      {showParameters &&
                        typeof careData === "object" &&
                        careData.parameters && (
                          <div className="text-sm text-[#349c4b] mt-1">
                            {careData.parameters}
                          </div>
                        )}
                    </td>

                    {/* Care+ Column */}
                    <td className="p-8 text-center align-top">
                      <div className="font-bold text-lg">
                        {typeof carePlusData === "object"
                          ? carePlusData.count
                          : carePlusData}
                      </div>
                      {typeof carePlusData === "object" &&
                        carePlusData.details && (
                          <div className="italic text-sm text-gray-500">
                            {carePlusData.details}
                          </div>
                        )}
                      {showParameters &&
                        typeof carePlusData === "object" &&
                        carePlusData.parameters && (
                          <div className="text-sm text-[#349c4b] mt-1">
                            {carePlusData.parameters}
                          </div>
                        )}
                    </td>
                  </tr>
                );
              })}
              {/* Final row: Pricing & Buttons */}
              <tr>
                {/* Empty cell first column */}
                <td className="p-8"></td>

                {/* Basic Price & Button */}
                <td className="p-8 text-center align-top">
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

                {/* Care Price & Button */}
                <td className="p-8 text-center align-top bg-custom-mutedgreen">
                  <div className="text-2xl font-bold mb-4">
                    {currentPricing.care.price}
                  </div>
                  <Button className="w-full bg-[#f28a2e] hover:bg-[#e07a1e] text-white">
                    Get Started
                  </Button>
                </td>

                {/* Care+ Price & Button */}
                <td className="p-8 text-center align-top">
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