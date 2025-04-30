"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import ArrowButton from "@/components/ui/custom/cd-arrow-button";
import { ClipboardCheck, Activity, ArrowRight } from "lucide-react";

export default function SubscribePlanCard() {
  const accentColor = "#F28A2E";
  const primaryIconColor = "#134F30";
  const outlineIconColor = "#134F30";

  return (
    <Card className="group relative w-full h-[194px] sm:h-[184px] overflow-hidden border border-gray-100 bg-custom-mutedgreen shadow-sm transition-all duration-300 hover:shadow-md">
      {/* background outline icon */}
      <div className="absolute -right-8 -top-4 h-40 w-40 opacity-5">
        <Activity
          className="h-full w-full"
          style={{ color: outlineIconColor }}
        />
      </div>

      <div className="relative flex flex-col justify-between p-5 h-full">
        {/* Header label */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full
                       bg-gradient-to-br from-[rgba(242,138,46,0.1)] to-[rgba(86,166,124,0.1)]"
          >
            <ClipboardCheck
              className="h-5 w-5"
              style={{ color: primaryIconColor }}
            />
          </div>
          <span
            className="text-sm font-medium"
            style={{ color: accentColor }}
          >
            Care Diabetics
          </span>
        </div>

        {/* Main content */}
        <div className="mt-4 flex-grow">
          <h3 className="mb-1 text-lg font-semibold text-gray-800">
            Join the Care Diabetics Plan
          </h3>
          <p className="mb-3 text-xs text-gray-600">
            Take control of your health with personalized monitoring, expert
            insights, and proactive care. 
          </p>
        </div>

        {/* Call-to-action */}


        <div className="flex items-center text-sm font-medium text-primary transition-all duration-300 group-hover:translate-x-1">
    Explore our plans
    <ArrowRight className="ml-1 h-4 w-4" />
  </div>

      </div>
    </Card>
  );
}