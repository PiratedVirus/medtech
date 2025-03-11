"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PricingTable() {
  const [duration, setDuration] = useState<"6months" | "12months">("6months");

  /**
   * Numeric-based pricing data, similar to an API response.
   * We remove strings like "2 consultations" or "(1 consultation every 3 months)"
   * and store only numeric values. The JSX below reconstructs the display text.
   */
  const pricingData = {
    "6months": {
      basic: {
        name: "Basic",
        price: 2599, // numeric only
        doctorConsultation: {
          totalConsultations: 2,
          frequencyPerInterval: 1,
          intervalInMonths: 3,
        },
        labTests: {
          totalTests: 2,
          frequencyPerInterval: 1,
          intervalInMonths: 3,
          parameters: 3,
        },
        dieticianConsultation: {
          totalConsultations: 0,
          frequencyPerInterval: 0,
          intervalInMonths: 0,
        },
        ophthalmologistConsultation: {
          totalConsultations: 0,
          frequencyPerInterval: 0,
          intervalInMonths: 0,
        },
        medicines: {
          discount: 15, // 15% off
        },
      },
      care: {
        name: "CARE",
        price: 5999,
        doctorConsultation: {
          totalConsultations: 2,
          frequencyPerInterval: 1,
          intervalInMonths: 3,
        },
        labTests: {
          totalTests: 2,
          frequencyPerInterval: 1,
          intervalInMonths: 3,
          parameters: 60,
        },
        dieticianConsultation: {
          totalConsultations: 2,
          frequencyPerInterval: 1,
          intervalInMonths: 3,
        },
        ophthalmologistConsultation: {
          totalConsultations: 1,
          frequencyPerInterval: 1,
          intervalInMonths: 6,
        },
        medicines: {
          discount: 25,
        },
      },
      carePlus: {
        name: "CARE+",
        price: 9999,
        doctorConsultation: {
          totalConsultations: 4,
          frequencyPerInterval: 2,
          intervalInMonths: 3,
        },
        labTests: {
          totalTests: 2,
          frequencyPerInterval: 1,
          intervalInMonths: 3,
          parameters: 80,
        },
        dieticianConsultation: {
          totalConsultations: 4,
          frequencyPerInterval: 2,
          intervalInMonths: 3,
        },
        ophthalmologistConsultation: {
          totalConsultations: 1,
          frequencyPerInterval: 1,
          intervalInMonths: 6,
        },
        medicines: {
          discount: 35,
        },
      },
    },
    "12months": {
      basic: {
        name: "Basic",
        price: 4999,
        doctorConsultation: {
          totalConsultations: 4,
          frequencyPerInterval: 1,
          intervalInMonths: 3,
        },
        labTests: {
          totalTests: 4,
          frequencyPerInterval: 1,
          intervalInMonths: 3,
          parameters: 3,
        },
        dieticianConsultation: {
          totalConsultations: 0,
          frequencyPerInterval: 0,
          intervalInMonths: 0,
        },
        ophthalmologistConsultation: {
          totalConsultations: 0,
          frequencyPerInterval: 0,
          intervalInMonths: 0,
        },
        medicines: {
          discount: 15,
        },
      },
      care: {
        name: "CARE",
        price: 10999,
        doctorConsultation: {
          totalConsultations: 4,
          frequencyPerInterval: 1,
          intervalInMonths: 3,
        },
        labTests: {
          totalTests: 4,
          frequencyPerInterval: 1,
          intervalInMonths: 3,
          parameters: 60,
        },
        dieticianConsultation: {
          totalConsultations: 4,
          frequencyPerInterval: 1,
          intervalInMonths: 3,
        },
        ophthalmologistConsultation: {
          totalConsultations: 2,
          frequencyPerInterval: 1,
          intervalInMonths: 6,
        },
        medicines: {
          discount: 25,
        },
      },
      carePlus: {
        name: "CARE+",
        price: 18999,
        doctorConsultation: {
          totalConsultations: 8,
          frequencyPerInterval: 2,
          intervalInMonths: 3,
        },
        labTests: {
          totalTests: 4,
          frequencyPerInterval: 1,
          intervalInMonths: 3,
          parameters: 80,
        },
        dieticianConsultation: {
          totalConsultations: 8,
          frequencyPerInterval: 2,
          intervalInMonths: 3,
        },
        ophthalmologistConsultation: {
          totalConsultations: 2,
          frequencyPerInterval: 1,
          intervalInMonths: 6,
        },
        medicines: {
          discount: 35,
        },
      },
    },
  };

  const currentPricing = pricingData[duration];

  // We define the "rows" we want to render in the table
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

  // Helper to format the “consultation/tests” lines
  const formatConsultationLine = (
    total: number,
    frequency: number,
    interval: number,
    singularLabel: string,
    pluralLabel: string
  ) => {
    // If total is 0, we treat it as “not available”
    if (!total) return "-";

    // e.g. “2 consultations”
    const totalString = `${total} ${total > 1 ? pluralLabel : singularLabel}`;

    // If frequency > 0, e.g. “(1 consultation every 3 months)”
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

  // Helper to format medicines discount
  const formatMedicines = (discount: number) => {
    return discount > 0 ? `${discount}% off` : "-";
  };

  // Helper to format lab parameters
  const formatParameters = (parameters: number | undefined) => {
    if (!parameters) return null;
    return <div className="text-sm text-[#349c4b] mt-1">{parameters} Parameters</div>;
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

          {/* Toggle Container */}
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
                {/* Empty top-left cell */}
                <th className="p-8"></th>

                {/* Basic header */}
                <th className="p-8 text-center">
                  <div className="text-2xl bg-gradient-to-bl from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent">
                    {currentPricing.basic.name}
                  </div>
                </th>

                {/* Care header */}
                <th className="p-8 text-center bg-custom-mutedgreen">
                  <div className="text-2xl bg-gradient-to-bl from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent">
                    {currentPricing.care.name}
                  </div>
                </th>

                {/* Care+ header */}
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
                    {/* First column: feature name */}
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

                    {/* Basic Column */}
                    <td className="p-8 text-center align-top">
                      {key === "medicines" ? (
                        // For medicines, we display discount
                        <div className="font-bold text-lg">
                          {formatMedicines(basicData.discount)}
                        </div>
                      ) : key === "labTests" ? (
                        <>
                          {formatConsultationLine(
                            basicData.totalTests,
                            basicData.frequencyPerInterval,
                            basicData.intervalInMonths,
                            "test",
                            "tests"
                          )}
                          {showParameters && formatParameters(basicData.parameters)}
                        </>
                      ) : (
                        <>
                          {formatConsultationLine(
                            basicData.totalConsultations,
                            basicData.frequencyPerInterval,
                            basicData.intervalInMonths,
                            "consultation",
                            "consultations"
                          )}
                        </>
                      )}
                    </td>

                    {/* Care Column */}
                    <td className="p-8 text-center align-top bg-custom-mutedgreen">
                      {key === "medicines" ? (
                        <div className="font-bold text-lg">
                          {formatMedicines(careData.discount)}
                        </div>
                      ) : key === "labTests" ? (
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
                      ) : (
                        <>
                          {formatConsultationLine(
                            careData.totalConsultations,
                            careData.frequencyPerInterval,
                            careData.intervalInMonths,
                            "consultation",
                            "consultations"
                          )}
                        </>
                      )}
                    </td>

                    {/* Care+ Column */}
                    <td className="p-8 text-center align-top">
                      {key === "medicines" ? (
                        <div className="font-bold text-lg">
                          {formatMedicines(carePlusData.discount)}
                        </div>
                      ) : key === "labTests" ? (
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
                      ) : (
                        <>
                          {formatConsultationLine(
                            carePlusData.totalConsultations,
                            carePlusData.frequencyPerInterval,
                            carePlusData.intervalInMonths,
                            "consultation",
                            "consultations"
                          )}
                        </>
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
                    Rs.{currentPricing.basic.price}/-
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
                    Rs.{currentPricing.care.price}/-
                  </div>
                  <Button className="w-full bg-[#f28a2e] hover:bg-[#e07a1e] text-white">
                    Get Started
                  </Button>
                </td>

                {/* Care+ Price & Button */}
                <td className="p-8 text-center align-top">
                  <div className="text-2xl font-bold mb-4">
                    Rs.{currentPricing.carePlus.price}/-
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